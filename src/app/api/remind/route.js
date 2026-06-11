import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Daily Vercel Cron target: emails squad members who are overdue for a
// check-in (past their squad's cadence), throttled so nobody is nagged daily.
const THROTTLE_DAYS = 3;

export async function GET(request) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_FROM_EMAIL;
  if (!url || !key || !resendKey || !from) {
    return Response.json(
      { error: "Missing env: need NEXT_PUBLIC_SUPABASE_URL, a Supabase key, RESEND_API_KEY and REMINDER_FROM_EMAIL." },
      { status: 500 }
    );
  }

  const origin = process.env.REMINDER_APP_URL || new URL(request.url).origin;
  const supabase = createClient(url, key);

  const [{ data: members, error: mErr }, { data: checkins }] = await Promise.all([
    supabase.from("members").select("id, name, email, join_date, last_reminded_at, teams(cadence_days, name)"),
    supabase.from("checkins").select("member_id, checkin_date").order("checkin_date", { ascending: false }),
  ]);
  if (mErr) return Response.json({ error: mErr.message }, { status: 500 });

  const lastCheckin = new Map();
  (checkins || []).forEach((c) => {
    if (!lastCheckin.has(c.member_id)) lastCheckin.set(c.member_id, c.checkin_date);
  });

  const now = Date.now();
  const days = (d) => (d ? Math.floor((now - new Date(d).getTime()) / 86400000) : null);
  const reminded = [];

  for (const m of members || []) {
    if (!m.email) continue;
    const cadence = m.teams?.cadence_days || 7;
    const baseline = lastCheckin.get(m.id) || m.join_date;
    const since = days(baseline);
    if (since == null || since < cadence) continue; // not overdue
    if (m.last_reminded_at && days(m.last_reminded_at) < THROTTLE_DAYS) continue; // recently nudged

    const teamName = m.teams?.name || "your squad";
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: m.email,
        subject: "You're due for a Shredded check-in",
        html: `
          <div style="font-family:ui-sans-serif,system-ui,Arial,sans-serif;max-width:480px;margin:auto;color:#18181b">
            <h2 style="margin:0 0 8px">Hey ${escapeHtml(m.name || "there")},</h2>
            <p style="margin:0 0 16px;color:#52525b">It's been ${since} days since your last check-in with <b>${escapeHtml(teamName)}</b>. Log your weight and how you held to your habits — your squad's counting on you.</p>
            <a href="${origin}/checkin" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px">Check in now</a>
            <p style="margin:20px 0 0;font-size:12px;color:#a1a1aa">You're getting this because you're in a Shredded squad. Remove your email on the Goals page to stop reminders.</p>
          </div>`,
      }),
    });

    if (sent.ok) {
      await supabase.from("members").update({ last_reminded_at: new Date().toISOString() }).eq("id", m.id);
      reminded.push(m.email);
    }
  }

  return Response.json({ checked: (members || []).length, reminded: reminded.length });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

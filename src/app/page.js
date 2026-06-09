"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ConfigNotice from "@/components/ConfigNotice";
import { formatKg, goalProgress, formatDate, vibeEmoji } from "@/lib/format";

function daysLeft(endDate) {
  if (!endDate) return null;
  const ms = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

export default function DashboardPage() {
  const [settings, setSettings] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data: settingsData }, { data: members }, { data: goals }, { data: checkins }] =
        await Promise.all([
          supabase
            .from("group_settings")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from("members").select("*").order("join_date", { ascending: true }),
          supabase.from("goals").select("*").order("created_at", { ascending: false }),
          supabase.from("checkins").select("*").order("checkin_date", { ascending: false }),
        ]);

      // Pick the latest goal + check-in for each member.
      const latestGoal = new Map();
      (goals || []).forEach((g) => {
        if (!latestGoal.has(g.member_id)) latestGoal.set(g.member_id, g);
      });
      const latestCheckin = new Map();
      (checkins || []).forEach((c) => {
        if (!latestCheckin.has(c.member_id)) latestCheckin.set(c.member_id, c);
      });

      setSettings(settingsData || null);
      setRows(
        (members || []).map((m) => ({
          member: m,
          goal: latestGoal.get(m.id) || null,
          checkin: latestCheckin.get(m.id) || null,
        }))
      );
      setLoading(false);
    })();
  }, []);

  const left = daysLeft(settings?.end_date);

  return (
    <div className="space-y-6">
      <ConfigNotice />

      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-flame-500 to-flame-600 p-6 text-white shadow-lg shadow-flame-500/30">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
          {settings?.challenge_name || "The Challenge"}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">
          {settings?.team_name || "The Shredded Squad"} 🔥
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/90">
          {settings?.start_date && <span>Started {formatDate(settings.start_date)}</span>}
          {left !== null && <span className="font-semibold">{left} days to go 💨</span>}
          {settings?.checkin_frequency_days && (
            <span>Check in every {settings.checkin_frequency_days} days</span>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href="/checkin" className="btn-primary">
          ✅ Log a check-in
        </Link>
        <Link href="/goals" className="btn-ghost">
          🎯 My goal
        </Link>
      </div>

      {/* Members */}
      <section className="space-y-3">
        <h2 className="px-1 text-lg font-bold text-stone-700">The crew</h2>

        {loading ? (
          <p className="px-1 text-stone-400">Loading the squad…</p>
        ) : rows.length === 0 ? (
          <div className="card text-center text-stone-500">
            No members yet. Head to{" "}
            <Link href="/admin" className="font-semibold text-flame-600 underline">
              Admin
            </Link>{" "}
            to add your crew.
          </div>
        ) : (
          rows.map(({ member, goal, checkin }) => {
            const pct = goalProgress(
              goal?.starting_weight_kg,
              goal?.target_weight_kg,
              checkin?.weight_kg ?? goal?.starting_weight_kg
            );
            return (
              <Link
                key={member.id}
                href={`/member/${member.id}`}
                className="card flex items-center gap-4 transition hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-flame-100 text-lg font-bold text-flame-600">
                  {member.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-stone-800">{member.name}</p>
                    {member.is_admin && (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-500">
                        admin
                      </span>
                    )}
                    {checkin && (
                      <span className="ml-auto text-xl" title="Latest vibe">
                        {vibeEmoji(checkin.vibe_rating)}
                      </span>
                    )}
                  </div>

                  {pct !== null ? (
                    <div className="mt-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-lime-400 to-lime-600"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        {formatKg(checkin?.weight_kg ?? goal?.starting_weight_kg)} ·{" "}
                        {pct}% to {formatKg(goal?.target_weight_kg)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-stone-400">No goal set yet</p>
                  )}

                  <p className="mt-1 text-xs text-stone-400">
                    {checkin
                      ? `Last check-in ${formatDate(checkin.checkin_date)}`
                      : "No check-ins yet"}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}

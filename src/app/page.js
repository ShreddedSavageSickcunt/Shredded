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

      {/* Hero — dark card with a stat readout. */}
      <section className="relative overflow-hidden rounded-3xl bg-ink-900 p-6 ring-1 ring-white/10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-flame-500/20 blur-3xl" />
        <div className="relative">
          <p className="stat-label">{settings?.challenge_name || "The Challenge"}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {settings?.team_name || "The Shredded Squad"}{" "}
            <span className="text-flame-500">🔥</span>
          </h1>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5">
              <p className="stat-num text-flame-400">{left ?? "—"}</p>
              <p className="stat-label mt-1">days to go</p>
            </div>
            <div className="rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5">
              <p className="stat-num">{rows.length || "—"}</p>
              <p className="stat-label mt-1">in the squad</p>
            </div>
            <div className="rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5">
              <p className="stat-num">{settings?.checkin_frequency_days || "—"}</p>
              <p className="stat-label mt-1">day cadence</p>
            </div>
          </div>

          {settings?.start_date && (
            <p className="mt-3 text-xs text-zinc-500">
              Started {formatDate(settings.start_date)}
              {settings?.end_date ? ` · ends ${formatDate(settings.end_date)}` : ""}
            </p>
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
        <h2 className="px-1 text-lg font-bold text-zinc-200">The crew</h2>

        {loading ? (
          <p className="px-1 text-zinc-500">Loading the squad…</p>
        ) : rows.length === 0 ? (
          <div className="card text-center text-zinc-400">
            No members yet. Head to{" "}
            <Link href="/admin" className="font-semibold text-flame-400 underline">
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
                className="card flex items-center gap-4 transition hover:ring-white/20"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-flame-500/15 text-lg font-bold text-flame-400 ring-1 ring-flame-500/20">
                  {member.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-zinc-100">{member.name}</p>
                    {member.is_admin && <span className="chip">admin</span>}
                    {checkin && (
                      <span className="ml-auto text-xl" title="Latest vibe">
                        {vibeEmoji(checkin.vibe_rating)}
                      </span>
                    )}
                  </div>

                  {pct !== null ? (
                    <div className="mt-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-850">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-viz-green to-flame-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        {formatKg(checkin?.weight_kg ?? goal?.starting_weight_kg)} ·{" "}
                        {pct}% to {formatKg(goal?.target_weight_kg)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-zinc-500">No goal set yet</p>
                  )}

                  <p className="mt-1 text-xs text-zinc-500">
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

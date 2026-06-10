"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/components/useIdentity";
import ConfigNotice from "@/components/ConfigNotice";
import Icon from "@/components/Icon";
import { formatKg, goalProgress, formatDate } from "@/lib/format";

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function currentWeightOf(member, goal, checkin) {
  return checkin?.weight_kg ?? member?.current_weight_kg ?? goal?.starting_weight_kg ?? null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { member, ready } = useIdentity();

  const [me, setMe] = useState(null);
  const [team, setTeam] = useState(null);
  const [rows, setRows] = useState([]); // { member, goal, checkin }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Inline weight update.
  const [editing, setEditing] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !member) return;
    const { data: meRow, error: meErr } = await supabase
      .from("members")
      .select("*, teams(id, name, join_code, cadence_days)")
      .eq("id", member.id)
      .maybeSingle();

    // Most likely cause: the 0001 migration (teams + profile columns) hasn't
    // been run yet. Surface a helpful message instead of hanging.
    if (meErr) {
      setLoadError("Your database needs the latest migration. Run supabase/migrations/0001_profiles_and_teams.sql in the Supabase SQL Editor, then refresh.");
      setLoading(false);
      return;
    }

    const teamId = meRow?.team_id || null;
    const { data: members } = teamId
      ? await supabase.from("members").select("*").eq("team_id", teamId).order("join_date")
      : { data: meRow ? [meRow] : [] };

    const ids = (members || []).map((m) => m.id);
    const [{ data: goals }, { data: checkins }] = await Promise.all([
      supabase.from("goals").select("*").in("member_id", ids).order("created_at", { ascending: false }),
      supabase.from("checkins").select("*").in("member_id", ids).order("checkin_date", { ascending: false }),
    ]);

    const latestGoal = new Map();
    (goals || []).forEach((g) => !latestGoal.has(g.member_id) && latestGoal.set(g.member_id, g));
    const latestCheckin = new Map();
    (checkins || []).forEach((c) => !latestCheckin.has(c.member_id) && latestCheckin.set(c.member_id, c));

    setMe(meRow || null);
    setTeam(meRow?.teams || null);
    setRows(
      (members || []).map((m) => ({
        member: m,
        goal: latestGoal.get(m.id) || null,
        checkin: latestCheckin.get(m.id) || null,
      }))
    );
    setLoading(false);
  }, [member]);

  useEffect(() => {
    if (ready && !member) router.replace("/login");
  }, [ready, member, router]);

  useEffect(() => {
    if (member) load();
  }, [member, load]);

  const mine = rows.find((r) => r.member.id === me?.id);
  const teammates = rows.filter((r) => r.member.id !== me?.id);
  const cadence = team?.cadence_days || 7;

  const myWeight = currentWeightOf(me, mine?.goal, mine?.checkin);
  const myPct = goalProgress(mine?.goal?.starting_weight_kg, mine?.goal?.target_weight_kg, myWeight);

  async function saveWeight() {
    const val = Number(weightInput);
    if (!val) return;
    setSavingWeight(true);
    await supabase.from("checkins").insert({
      member_id: me.id,
      checkin_date: new Date().toISOString().slice(0, 10),
      weight_kg: val,
    });
    await supabase.from("members").update({ current_weight_kg: val }).eq("id", me.id);
    setSavingWeight(false);
    setEditing(false);
    setWeightInput("");
    load();
  }

  if (!ready || !member || loading) {
    return <div className="py-24 text-center text-zinc-500">Loading your dashboard…</div>;
  }

  if (loadError) {
    return (
      <div className="card mx-auto mt-8 max-w-md text-center text-sm text-zinc-300">
        <p className="mb-2 font-semibold text-zinc-100">One quick database step</p>
        <p className="text-zinc-400">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfigNotice />

      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <p className="stat-label">{team ? team.name : "Solo journey"}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Hey, {me?.name}</h1>
        </div>
        <Link href="/checkin" className="btn-primary !px-4 !py-2.5 text-sm">
          <Icon name="plus" className="h-4 w-4" />
          Check in
        </Link>
      </div>

      {/* Your progress */}
      <section className="card space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Your progress</h2>
          <Link href="/goals" className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-200">
            <Icon name="edit" className="h-3.5 w-3.5" /> Edit goal
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Current weight — editable */}
          <div className="rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5">
            <p className="stat-label">Current</p>
            {editing ? (
              <div className="mt-1.5 flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  autoFocus
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder={myWeight ? String(myWeight) : "kg"}
                  className="w-full rounded-lg bg-ink-800 px-2 py-1 text-lg font-bold text-white ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-2 focus:ring-flame-500"
                />
              </div>
            ) : (
              <p className="stat-num mt-1.5">{myWeight != null ? Number(myWeight).toFixed(1) : "—"}</p>
            )}
            <div className="mt-1.5">
              {editing ? (
                <div className="flex gap-1">
                  <button onClick={saveWeight} disabled={savingWeight} className="rounded-lg bg-flame-500 px-2 py-0.5 text-xs font-semibold text-white disabled:opacity-50">
                    {savingWeight ? "…" : "Save"}
                  </button>
                  <button onClick={() => { setEditing(false); setWeightInput(""); }} className="rounded-lg px-2 py-0.5 text-xs text-zinc-400">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-medium text-flame-400 hover:text-flame-300">
                  <Icon name="edit" className="h-3 w-3" /> Update kg
                </button>
              )}
            </div>
          </div>

          {/* Target */}
          <div className="rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5">
            <p className="stat-label">Target</p>
            <p className="stat-num mt-1.5">
              {mine?.goal?.target_weight_kg != null ? Number(mine.goal.target_weight_kg).toFixed(1) : "—"}
            </p>
            <p className="mt-1.5 text-xs text-zinc-500">
              {mine?.goal?.target_date ? `by ${formatDate(mine.goal.target_date)}` : "kg"}
            </p>
          </div>

          {/* Calories */}
          <div className="rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5">
            <p className="stat-label">Calories</p>
            <p className="stat-num mt-1.5">{mine?.goal?.daily_calorie_target ?? "—"}</p>
            <p className="mt-1.5 text-xs text-zinc-500">per day</p>
          </div>
        </div>

        {/* Progress bar */}
        {myPct !== null && (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-zinc-400">{formatKg(mine?.goal?.starting_weight_kg)} start</span>
              <span className="font-semibold text-flame-400">{myPct}% there</span>
              <span className="text-zinc-400">{formatKg(mine?.goal?.target_weight_kg)} goal</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink-800">
              <div className="h-full rounded-full bg-gradient-to-r from-viz-green to-flame-400 transition-all duration-500" style={{ width: `${myPct}%` }} />
            </div>
          </div>
        )}

        {mine?.goal?.principles && (
          <p className="rounded-2xl bg-ink-850/60 p-3 text-sm leading-relaxed text-zinc-300 ring-1 ring-white/5">
            {mine.goal.principles}
          </p>
        )}
      </section>

      {/* Squad */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-zinc-300">
            {team ? "Your squad" : "Squad"}
          </h2>
          {team && <span className="text-xs text-zinc-500">Logs every {cadence} days</span>}
        </div>

        {!team ? (
          <div className="card flex items-center gap-4 text-sm text-zinc-400">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-850 text-zinc-500 ring-1 ring-white/10">
              <Icon name="users" className="h-5 w-5" />
            </span>
            <p>You’re tracking solo. Create or join a squad to keep each other accountable.</p>
          </div>
        ) : teammates.length === 0 ? (
          <div className="card text-sm text-zinc-400">
            Just you so far. Share your squad code{" "}
            <span className="font-mono font-semibold tracking-widest text-flame-400">{team.join_code}</span>{" "}
            with friends to bring them in.
          </div>
        ) : (
          teammates.map(({ member: m, goal, checkin }) => {
            const w = currentWeightOf(m, goal, checkin);
            const pct = goalProgress(goal?.starting_weight_kg, goal?.target_weight_kg, w);
            const since = daysSince(checkin?.checkin_date);
            const logged = since !== null && since <= cadence;
            return (
              <Link
                key={m.id}
                href={`/member/${m.id}`}
                className={`card flex items-center gap-4 transition ${
                  logged ? "hover:ring-white/20" : "opacity-60 grayscale-[0.4] hover:opacity-80"
                }`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ring-1 ${
                    logged
                      ? "bg-flame-500/15 text-flame-400 ring-flame-500/20"
                      : "bg-ink-850 text-zinc-500 ring-white/10"
                  }`}
                >
                  {m.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-zinc-100">{m.name}</p>
                    {!logged && (
                      <span className="rounded-full bg-ink-850 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 ring-1 ring-white/10">
                        {since === null ? "No logs" : "Behind"}
                      </span>
                    )}
                    <span className="ml-auto text-sm font-semibold text-zinc-300">
                      {w != null ? formatKg(w) : "—"}
                    </span>
                  </div>
                  {pct !== null ? (
                    <div className="mt-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
                        <div
                          className={`h-full rounded-full ${logged ? "bg-gradient-to-r from-viz-green to-flame-400" : "bg-zinc-600"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {pct}% to goal ·{" "}
                        {since === null ? "no check-ins yet" : since === 0 ? "logged today" : `${since}d ago`}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-zinc-500">No goal set yet</p>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/components/useIdentity";
import ConfigNotice from "@/components/ConfigNotice";
import Icon from "@/components/Icon";
import CheckinTrends from "@/components/CheckinTrends";
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
  const [rows, setRows] = useState([]); // { member, goal, checkin } latest per member
  const [feed, setFeed] = useState([]); // { checkin, member } recent across squad
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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

    if (meErr) {
      setLoadError("Your database needs the latest migration. Run the SQL files in supabase/migrations, then refresh.");
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
      supabase.from("checkins").select("*").in("member_id", ids).order("created_at", { ascending: false }),
    ]);

    const latestGoal = new Map();
    (goals || []).forEach((g) => !latestGoal.has(g.member_id) && latestGoal.set(g.member_id, g));
    const latestCheckin = new Map();
    (checkins || []).forEach((c) => !latestCheckin.has(c.member_id) && latestCheckin.set(c.member_id, c));
    const memberById = new Map((members || []).map((m) => [m.id, m]));

    // Group each member's check-ins (already newest-first) and work out the
    // weight that preceded each one, so we can show a weight trend.
    const byMember = new Map();
    (checkins || []).forEach((c) => {
      const a = byMember.get(c.member_id) || [];
      a.push(c);
      byMember.set(c.member_id, a);
    });
    const prevWeightById = new Map();
    byMember.forEach((arr, mid) => {
      const startW = latestGoal.get(mid)?.starting_weight_kg ?? null;
      for (let i = 0; i < arr.length; i++) {
        let prev = null;
        for (let j = i + 1; j < arr.length; j++) {
          if (arr[j].weight_kg != null) { prev = arr[j].weight_kg; break; }
        }
        prevWeightById.set(arr[i].id, prev ?? startW);
      }
    });

    setMe(meRow || null);
    setTeam(meRow?.teams || null);
    setRows(
      (members || []).map((m) => {
        const checkin = latestCheckin.get(m.id) || null;
        return {
          member: m,
          goal: latestGoal.get(m.id) || null,
          checkin,
          prevWeight: checkin ? prevWeightById.get(checkin.id) ?? null : null,
        };
      })
    );
    setFeed(
      (checkins || [])
        .slice(0, 20)
        .map((c) => ({
          checkin: c,
          member: memberById.get(c.member_id),
          prevWeight: prevWeightById.get(c.id) ?? null,
          target: latestGoal.get(c.member_id)?.target_weight_kg ?? null,
        }))
        .filter((x) => x.member)
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

      {/* Greeting + actions */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="stat-label">{team ? team.name : "Solo journey"}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Hey, {me?.name}</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/squad" className="btn-ghost !px-3 !py-2.5 text-sm">
            <Icon name="cog" className="h-4 w-4" />
            <span className="hidden sm:inline">{team ? "Squad settings" : "Find a squad"}</span>
          </Link>
          <Link href="/checkin" className="btn-primary !px-4 !py-2.5 text-sm">
            <Icon name="plus" className="h-4 w-4" />
            Check in
          </Link>
        </div>
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
          <div className="rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5">
            <p className="stat-label">Current</p>
            {editing ? (
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                autoFocus
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={myWeight ? String(myWeight) : "kg"}
                className="mt-1.5 w-full rounded-lg bg-ink-800 px-2 py-1 text-lg font-bold text-white ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-2 focus:ring-flame-500"
              />
            ) : (
              <p className="stat-num mt-1.5">{myWeight != null ? Number(myWeight).toFixed(1) : "—"}</p>
            )}
            <div className="mt-1.5">
              {editing ? (
                <div className="flex gap-1">
                  <button onClick={saveWeight} disabled={savingWeight} className="rounded-lg bg-flame-500 px-2 py-0.5 text-xs font-semibold text-white disabled:opacity-50">
                    {savingWeight ? "…" : "Save"}
                  </button>
                  <button onClick={() => { setEditing(false); setWeightInput(""); }} className="rounded-lg px-2 py-0.5 text-xs text-zinc-400">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-medium text-flame-400 hover:text-flame-300">
                  <Icon name="edit" className="h-3 w-3" /> Update kg
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5">
            <p className="stat-label">Target</p>
            <p className="stat-num mt-1.5">{mine?.goal?.target_weight_kg != null ? Number(mine.goal.target_weight_kg).toFixed(1) : "—"}</p>
            <p className="mt-1.5 text-xs text-zinc-500">{mine?.goal?.target_date ? `by ${formatDate(mine.goal.target_date)}` : "kg"}</p>
          </div>

          <div className="rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5">
            <p className="stat-label">Calories</p>
            <p className="stat-num mt-1.5">{mine?.goal?.daily_calorie_target ?? "—"}</p>
            <p className="mt-1.5 text-xs text-zinc-500">per day</p>
          </div>
        </div>

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
      </section>

      {/* Squad status */}
      {team && teammates.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-zinc-300">Squad status</h2>
            <span className="text-xs text-zinc-500">Logs every {cadence} days</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {teammates.map(({ member: m, goal, checkin, prevWeight }) => {
              const w = currentWeightOf(m, goal, checkin);
              const since = daysSince(checkin?.checkin_date);
              const logged = since !== null && since <= cadence;
              return (
                <Link
                  key={m.id}
                  href={`/member/${m.id}`}
                  className={`card !p-4 ${logged ? "hover:ring-white/20" : "opacity-60"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ring-1 ${logged ? "bg-flame-500/15 text-flame-400 ring-flame-500/20" : "bg-ink-850 text-zinc-500 ring-white/10"}`}>
                      {m.name?.[0]?.toUpperCase()}
                    </span>
                    <span className="truncate text-sm font-semibold text-zinc-100">{m.name}</span>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-lg font-bold text-zinc-100">{w != null ? formatKg(w) : "—"}</p>
                      <p className="text-xs text-zinc-500">
                        {since === null ? "No check-ins" : !logged ? "Behind" : since === 0 ? "Logged today" : `${since}d ago`}
                      </p>
                    </div>
                    {checkin && (
                      <CheckinTrends
                        latestWeight={checkin.weight_kg}
                        prevWeight={prevWeight}
                        target={goal?.target_weight_kg}
                        met={checkin.commitments_met}
                        total={checkin.commitments_total}
                        size={32}
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Activity feed */}
      <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold text-zinc-300">Recent check-ins</h2>
        {feed.length === 0 ? (
          <div className="card text-center text-sm text-zinc-400">
            No check-ins yet. Tap <span className="font-semibold text-zinc-200">Check in</span> to start the streak.
          </div>
        ) : (
          feed.map(({ checkin: c, member: m, prevWeight, target }) => (
            <Link key={c.id} href={`/member/${m.id}`} className="card block transition hover:ring-white/20">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-flame-500/15 text-sm font-bold text-flame-400 ring-1 ring-flame-500/20">
                  {m.name?.[0]?.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-100">{m.name}</span>
                    <span className="text-xs text-zinc-500">{formatDate(c.checkin_date)}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-zinc-400">
                    {c.weight_kg != null && (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="scale" className="h-3.5 w-3.5 text-zinc-500" /> {formatKg(c.weight_kg)}
                      </span>
                    )}
                    {c.commitments_total ? (
                      <span>{c.commitments_met}/{c.commitments_total} habits kept</span>
                    ) : null}
                  </div>
                </div>
                <CheckinTrends
                  latestWeight={c.weight_kg}
                  prevWeight={prevWeight}
                  target={target}
                  met={c.commitments_met}
                  total={c.commitments_total}
                />
              </div>
              {c.notes && <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{c.notes}</p>}
            </Link>
          ))
        )}
      </section>
    </div>
  );
}

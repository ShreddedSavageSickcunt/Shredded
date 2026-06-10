"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/components/useIdentity";
import ConfigNotice from "@/components/ConfigNotice";
import Icon from "@/components/Icon";
import { formatDate, formatKg, goalProgress, vibeLabel } from "@/lib/format";

const REACTIONS = ["🔥", "💪", "❤️", "👏", "🚀"];

export default function MemberProfilePage({ params }) {
  // Next 14 passes params to client pages as a plain object.
  const { id } = params;
  const { member: me } = useIdentity();

  const [member, setMember] = useState(null);
  const [goal, setGoal] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [reactions, setReactions] = useState({}); // checkin_id -> array
  const [loading, setLoading] = useState(true);

  async function loadReactions(checkinIds) {
    if (checkinIds.length === 0) return setReactions({});
    const { data } = await supabase
      .from("reactions")
      .select("*")
      .in("checkin_id", checkinIds);
    const grouped = {};
    (data || []).forEach((r) => {
      (grouped[r.checkin_id] = grouped[r.checkin_id] || []).push(r);
    });
    setReactions(grouped);
  }

  useEffect(() => {
    if (!supabase) return setLoading(false);
    (async () => {
      const [{ data: m }, { data: g }, { data: c }] = await Promise.all([
        supabase.from("members").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("goals")
          .select("*")
          .eq("member_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("checkins")
          .select("*")
          .eq("member_id", id)
          .order("checkin_date", { ascending: false }),
      ]);
      setMember(m || null);
      setGoal(g || null);
      setCheckins(c || []);
      await loadReactions((c || []).map((x) => x.id));
      setLoading(false);
    })();
  }, [id]);

  async function toggleReaction(checkinId, emoji) {
    if (!me) return;
    const existing = (reactions[checkinId] || []).find(
      (r) => r.member_id === me.id && r.emoji === emoji
    );
    if (existing) {
      await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      await supabase
        .from("reactions")
        .insert({ checkin_id: checkinId, member_id: me.id, emoji });
    }
    await loadReactions(checkins.map((x) => x.id));
  }

  if (loading) return <div className="py-16 text-center text-zinc-500">Loading…</div>;
  if (!member)
    return (
      <div className="card mx-auto max-w-md text-center">
        <p>Member not found.</p>
        <Link href="/" className="mt-2 inline-block font-semibold text-flame-400 underline">
          Back to the squad
        </Link>
      </div>
    );

  const latestWeight = checkins[0]?.weight_kg ?? goal?.starting_weight_kg;
  const pct = goalProgress(goal?.starting_weight_kg, goal?.target_weight_kg, latestWeight);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ConfigNotice />

      {/* Header */}
      <section className="card flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-flame-500/15 text-2xl font-bold text-flame-400 ring-1 ring-flame-500/20">
          {member.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">{member.name}</h1>
          <p className="text-sm text-zinc-500">Joined {formatDate(member.join_date)}</p>
          {pct !== null && (
            <div className="mt-2">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-850">
                <div className="h-full rounded-full bg-gradient-to-r from-viz-green to-flame-400" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                {formatKg(latestWeight)} now · started {formatKg(goal?.starting_weight_kg)} · target {formatKg(goal?.target_weight_kg)} · {pct}% there
              </p>
            </div>
          )}
        </div>
      </section>

      {goal?.principles && (
        <section className="card">
          <h2 className="stat-label">Principles</h2>
          <p className="mt-1 whitespace-pre-wrap text-zinc-200">{goal.principles}</p>
        </section>
      )}

      {/* History */}
      <section className="space-y-3">
        <h2 className="px-1 text-lg font-bold text-zinc-200">Check-in history</h2>
        {checkins.length === 0 ? (
          <div className="card text-center text-zinc-400">No check-ins yet.</div>
        ) : (
          checkins.map((c) => {
            const rx = reactions[c.id] || [];
            const counts = {};
            rx.forEach((r) => (counts[r.emoji] = (counts[r.emoji] || 0) + 1));
            return (
              <article key={c.id} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-zinc-100">{formatDate(c.checkin_date)}</p>
                  {c.vibe_rating != null && (
                    <span className="chip">{vibeLabel(c.vibe_rating)}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-300">
                  {c.weight_kg != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="scale" className="h-4 w-4 text-zinc-500" /> {formatKg(c.weight_kg)}
                    </span>
                  )}
                  {c.calories_consumed != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="spark" className="h-4 w-4 text-zinc-500" /> {c.calories_consumed} cal/day
                    </span>
                  )}
                </div>
                {c.notes && <p className="whitespace-pre-wrap text-zinc-200">{c.notes}</p>}
                {c.photo_url && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-ink-850">
                    <Image src={c.photo_url} alt="Progress photo" fill className="object-cover" />
                  </div>
                )}

                {/* Reactions */}
                <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2">
                  {REACTIONS.map((emoji) => {
                    const mine = rx.some((r) => r.member_id === me?.id && r.emoji === emoji);
                    const n = counts[emoji] || 0;
                    return (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(c.id, emoji)}
                        disabled={!me}
                        className={`rounded-full px-2.5 py-1 text-sm transition disabled:opacity-40 ${
                          mine ? "bg-flame-500/20 ring-1 ring-flame-500" : "bg-ink-850 hover:bg-ink-800"
                        }`}
                      >
                        {emoji} {n > 0 && <span className="text-xs font-semibold text-zinc-300">{n}</span>}
                      </button>
                    );
                  })}
                  {!me && <span className="ml-1 text-xs text-zinc-500">Identify to react</span>}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

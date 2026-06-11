"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/components/useIdentity";
import IdentityGate from "@/components/IdentityGate";
import Icon from "@/components/Icon";
import { VIBE_LABELS } from "@/lib/format";

function CheckinForm() {
  const router = useRouter();
  const { member } = useIdentity();
  const today = new Date().toISOString().slice(0, 10);

  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkin_date, setDate] = useState(today);
  const [weight, setWeight] = useState("");
  const [vibe, setVibe] = useState(4);
  const [met, setMet] = useState({}); // commitmentId -> bool
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("commitments")
        .select("*")
        .eq("member_id", member.id)
        .order("created_at");
      setCommitments(data || []);
      setLoading(false);
    })();
  }, [member.id]);

  const toggle = (id) => setMet((m) => ({ ...m, [id]: !m[id] }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const metIds = commitments.filter((c) => met[c.id]).map((c) => c.id);
      const { error: insErr } = await supabase.from("checkins").insert({
        member_id: member.id,
        checkin_date,
        weight_kg: weight ? Number(weight) : null,
        vibe_rating: Number(vibe),
        commitments_total: commitments.length,
        commitments_met: metIds.length,
        met_ids: metIds,
        notes: notes || null,
      });
      if (insErr) throw insErr;

      // Keep the member's current weight in sync so the dashboard reflects it.
      if (weight) {
        await supabase.from("members").update({ current_weight_kg: Number(weight) }).eq("id", member.id);
      }
      router.replace("/");
    } catch (err) {
      setError(err.message || "Couldn’t save your check-in. Try again.");
      setBusy(false);
    }
  }

  if (loading) return <div className="py-24 text-center text-zinc-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Check in, {member.name}</h1>
      <p className="mb-5 text-sm text-zinc-400">Log your weight and how you held to your habits.</p>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={checkin_date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" step="0.1" inputMode="decimal" className="input" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="82.4" />
          </div>
        </div>

        {/* Habit adherence */}
        <div>
          <label className="label">Did you stick to your habits?</label>
          {commitments.length === 0 ? (
            <div className="rounded-2xl bg-ink-850 p-4 text-sm text-zinc-400 ring-1 ring-white/5">
              You haven’t set any habits yet.{" "}
              <Link href="/habits" className="font-semibold text-flame-400 underline">Add some on the Habits page</Link>{" "}
              to track your consistency.
            </div>
          ) : (
            <div className="space-y-2">
              {commitments.map((c) => {
                const on = !!met[c.id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 transition ${
                      on ? "bg-viz-green/10 ring-viz-green/40" : "bg-ink-850 ring-white/10 hover:bg-ink-800"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ring-1 transition ${
                        on ? "bg-viz-green text-ink-950 ring-viz-green" : "bg-ink-900 ring-white/15"
                      }`}
                    >
                      {on && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.8} />}
                    </span>
                    <span className="flex-1 text-sm font-medium text-zinc-200">{c.label}</span>
                    <span className="text-[11px] uppercase tracking-wide text-zinc-500">{c.category}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="label">How did it feel?</label>
          <div className="flex gap-1.5">
            {VIBE_LABELS.map((lbl, i) => {
              const rating = i + 1;
              const active = Number(vibe) === rating;
              return (
                <button
                  type="button"
                  key={rating}
                  onClick={() => setVibe(rating)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
                    active ? "bg-flame-500/15 text-flame-400 ring-1 ring-flame-500/50" : "bg-ink-850 text-zinc-400 ring-1 ring-white/5 hover:bg-ink-800"
                  }`}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label">Notes <span className="text-zinc-600">(optional)</span></label>
          <textarea className="input min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Wins, struggles, what you’re proud of…" />
        </div>

        {error && <p className="text-sm font-medium text-red-400">{error}</p>}

        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Saving…" : "Post check-in"}
        </button>
      </form>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <IdentityGate>
      <CheckinForm />
    </IdentityGate>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/components/useIdentity";
import IdentityGate from "@/components/IdentityGate";
import Icon from "@/components/Icon";
import { COMMITMENT_TEMPLATES, COMMITMENT_CATEGORIES, resolveLabel } from "@/lib/commitments";

function GoalsInner() {
  const router = useRouter();
  const { member } = useIdentity();

  const [form, setForm] = useState({
    starting_weight_kg: "",
    target_weight_kg: "",
    target_date: "",
    daily_calorie_target: "",
    principles: "",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Habits
  const [commitments, setCommitments] = useState([]);
  const [vals, setVals] = useState({}); // templateId -> chosen number
  const [picking, setPicking] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function loadCommitments() {
    const { data } = await supabase
      .from("commitments")
      .select("*")
      .eq("member_id", member.id)
      .order("created_at");
    setCommitments(data || []);
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setForm({
          starting_weight_kg: data.starting_weight_kg ?? "",
          target_weight_kg: data.target_weight_kg ?? "",
          target_date: data.target_date ?? "",
          daily_calorie_target: data.daily_calorie_target ?? "",
          principles: data.principles ?? "",
        });
      }
      await loadCommitments();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setBusy(true);
    const { error: insErr } = await supabase.from("goals").insert({
      member_id: member.id,
      starting_weight_kg: form.starting_weight_kg ? Number(form.starting_weight_kg) : null,
      target_weight_kg: form.target_weight_kg ? Number(form.target_weight_kg) : null,
      target_date: form.target_date || null,
      daily_calorie_target: form.daily_calorie_target ? Number(form.daily_calorie_target) : null,
      principles: form.principles || null,
    });
    setBusy(false);
    if (insErr) return setError(insErr.message || "Couldn’t save. Try again.");
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function addCommitment(t) {
    const v = vals[t.id] ?? t.target?.default;
    await supabase.from("commitments").insert({
      member_id: member.id,
      category: t.category,
      label: resolveLabel(t, v),
    });
    await loadCommitments();
  }

  async function removeCommitment(id) {
    await supabase.from("commitments").delete().eq("id", id);
    await loadCommitments();
  }

  if (loading) return <div className="py-16 text-center text-zinc-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Your goal</h1>
        <p className="mt-1 text-sm text-zinc-400">Set your target, then choose the habits that get you there.</p>
      </header>

      {/* Goal */}
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Starting weight (kg)</label>
            <input type="number" step="0.1" inputMode="decimal" className="input" value={form.starting_weight_kg} onChange={set("starting_weight_kg")} placeholder="88.0" />
          </div>
          <div>
            <label className="label">Target weight (kg)</label>
            <input type="number" step="0.1" inputMode="decimal" className="input" value={form.target_weight_kg} onChange={set("target_weight_kg")} placeholder="78.0" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Daily calorie target</label>
            <input type="number" inputMode="numeric" className="input" value={form.daily_calorie_target} onChange={set("daily_calorie_target")} placeholder="2000" />
          </div>
          <div>
            <label className="label">Target date</label>
            <input type="date" className="input" value={form.target_date} onChange={set("target_date")} />
          </div>
        </div>
        <div>
          <label className="label">Notes <span className="text-zinc-600">(optional)</span></label>
          <textarea className="input min-h-20" value={form.principles} onChange={set("principles")} placeholder="Anything else you’re holding yourself to…" />
        </div>
        {error && <p className="text-sm font-medium text-red-400">{error}</p>}
        {saved && <p className="text-sm font-medium text-emerald-400">Saved.</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Save goal"}</button>
      </form>

      {/* Habits */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-zinc-100">Your habits</h2>
            <p className="text-sm text-zinc-400">The actions you’ll be held accountable to each check-in.</p>
          </div>
          <button onClick={() => setPicking((p) => !p)} className="btn-ghost !px-3 !py-2 text-sm">
            <Icon name={picking ? "chevronDown" : "plus"} className="h-4 w-4" />
            {picking ? "Done" : "Add"}
          </button>
        </div>

        {commitments.length === 0 ? (
          <p className="rounded-2xl bg-ink-850 p-4 text-sm text-zinc-400 ring-1 ring-white/5">
            No habits yet. Tap <span className="font-semibold text-zinc-200">Add</span> to choose some.
          </p>
        ) : (
          <ul className="space-y-2">
            {commitments.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5">
                <span className="chip">{c.category}</span>
                <span className="flex-1 text-sm font-medium text-zinc-200">{c.label}</span>
                <button onClick={() => removeCommitment(c.id)} className="rounded-lg p-1 text-zinc-500 hover:bg-ink-800 hover:text-red-400" title="Remove">
                  <Icon name="plus" className="h-4 w-4 rotate-45" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Template picker */}
        {picking && (
          <div className="space-y-4 border-t border-white/10 pt-4">
            {COMMITMENT_CATEGORIES.map((cat) => (
              <div key={cat}>
                <p className="stat-label mb-2">{cat}</p>
                <div className="space-y-2">
                  {COMMITMENT_TEMPLATES.filter((t) => t.category === cat).map((t) => (
                    <div key={t.id} className="flex items-center gap-2 rounded-2xl bg-ink-850 p-2.5 ring-1 ring-white/5">
                      <span className="flex-1 text-sm text-zinc-300">{resolveLabel(t, vals[t.id] ?? t.target?.default)}</span>
                      {t.target && (
                        <input
                          type="number"
                          min={t.target.min}
                          max={t.target.max}
                          step={t.target.step}
                          value={vals[t.id] ?? t.target.default}
                          onChange={(e) => setVals((v) => ({ ...v, [t.id]: e.target.value }))}
                          className="w-20 rounded-lg bg-ink-800 px-2 py-1 text-sm text-zinc-100 ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-2 focus:ring-flame-500"
                        />
                      )}
                      <button onClick={() => addCommitment(t)} className="rounded-lg bg-flame-500/15 px-2.5 py-1.5 text-sm font-semibold text-flame-400 hover:bg-flame-500/25">
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function GoalsPage() {
  return (
    <IdentityGate>
      <GoalsInner />
    </IdentityGate>
  );
}

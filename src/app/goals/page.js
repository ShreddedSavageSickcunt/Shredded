"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/components/useIdentity";
import IdentityGate from "@/components/IdentityGate";
import HabitPicker from "@/components/HabitPicker";

function GoalsInner() {
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
  const [commitments, setCommitments] = useState([]);

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

  const selected = commitments.map((c) => ({
    key: c.id,
    templateId: c.template_id,
    category: c.category,
    label: c.label,
  }));

  async function addHabit(habit) {
    await supabase.from("commitments").insert({
      member_id: member.id,
      category: habit.category,
      label: habit.label,
      template_id: habit.templateId,
    });
    await loadCommitments();
  }

  async function removeHabit(item) {
    await supabase.from("commitments").delete().eq("id", item.key);
    await loadCommitments();
  }

  if (loading) return <div className="py-16 text-center text-zinc-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Your goal</h1>
        <p className="mt-1 text-sm text-zinc-400">Set your target, then choose the habits that get you there.</p>
      </header>

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

      <section className="card space-y-4">
        <div>
          <h2 className="font-semibold text-zinc-100">Your habits</h2>
          <p className="text-sm text-zinc-400">The actions you’ll be held accountable to each check-in.</p>
        </div>
        <HabitPicker selected={selected} onAdd={addHabit} onRemove={removeHabit} />
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/components/useIdentity";
import IdentityGate from "@/components/IdentityGate";

function GoalForm() {
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
      setLoading(false);
    })();
  }, [member.id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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
    if (insErr) {
      setError(insErr.message || "Couldn’t save. Try again.");
      return;
    }
    setSaved(true);
    setTimeout(() => router.push("/"), 700);
  }

  if (loading) return <div className="py-16 text-center text-zinc-500">Loading your goal…</div>;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Your goal</h1>
      <p className="mb-5 text-sm text-zinc-400">Set the target you’re chasing and the rules you live by.</p>

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
          <label className="label">My principles</label>
          <textarea className="input min-h-28" value={form.principles} onChange={set("principles")} placeholder="No booze on weekdays. Walk 8k steps. Protein with every meal…" />
          <p className="mt-1 text-xs text-zinc-500">Your personal rules / approach — the squad can see these for accountability.</p>
        </div>

        {error && <p className="text-sm font-medium text-red-400">{error}</p>}
        {saved && <p className="text-sm font-medium text-emerald-400">Saved! Redirecting…</p>}

        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Saving…" : "Save goal"}
        </button>
      </form>
    </div>
  );
}

export default function GoalsPage() {
  return (
    <IdentityGate>
      <GoalForm />
    </IdentityGate>
  );
}

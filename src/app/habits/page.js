"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/components/useIdentity";
import IdentityGate from "@/components/IdentityGate";
import HabitPicker from "@/components/HabitPicker";

function HabitsInner() {
  const { member } = useIdentity();
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadCommitments() {
    const { data } = await supabase.from("commitments").select("*").eq("member_id", member.id).order("created_at");
    setCommitments(data || []);
  }

  useEffect(() => {
    (async () => {
      await loadCommitments();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  const selected = commitments.map((c) => ({ key: c.id, templateId: c.template_id, category: c.category, label: c.label }));

  async function addHabit(habit) {
    const tempId = `temp-${Date.now()}`;
    setCommitments((cs) => [...cs, { id: tempId, category: habit.category, label: habit.label, template_id: habit.templateId }]);
    const base = { member_id: member.id, category: habit.category, label: habit.label };
    let { data, error: e1 } = await supabase.from("commitments").insert({ ...base, template_id: habit.templateId }).select("id").single();
    if (e1 && /template_id/i.test(e1.message || "")) ({ data, error: e1 } = await supabase.from("commitments").insert(base).select("id").single());
    if (e1) return setCommitments((cs) => cs.filter((c) => c.id !== tempId));
    setCommitments((cs) => cs.map((c) => (c.id === tempId ? { ...c, id: data.id } : c)));
  }

  async function removeHabit(item) {
    setCommitments((cs) => cs.filter((c) => c.id !== item.key));
    await supabase.from("commitments").delete().eq("id", item.key);
  }

  if (loading) return <div className="py-16 text-center text-zinc-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Your habits</h1>
        <p className="mt-1 text-sm text-zinc-400">The actions you’ll be held accountable to each check-in.</p>
      </header>

      <section className="card">
        <HabitPicker selected={selected} onAdd={addHabit} onRemove={removeHabit} />
      </section>
    </div>
  );
}

export default function HabitsPage() {
  return (
    <IdentityGate>
      <HabitsInner />
    </IdentityGate>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/components/useIdentity";
import IdentityGate from "@/components/IdentityGate";
import HabitPicker from "@/components/HabitPicker";
import {
  ACTIVITY_LEVELS,
  PACES,
  paceRate,
  maintenanceCalories,
  suggestedCalories,
  estimateDaysToGoal,
} from "@/lib/calories";
import { formatDate, formatDuration, addDays } from "@/lib/format";

function GoalsInner() {
  const { member } = useIdentity();

  const [profile, setProfile] = useState({ sex: "male", age: "", height_cm: "", current_weight_kg: "", activity_factor: "1.2" });
  const [goal, setGoal] = useState({ starting_weight_kg: "", target_weight_kg: "", target_date: "", daily_calorie_target: "", principles: "" });
  const [pace, setPace] = useState("steady");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [commitments, setCommitments] = useState([]);

  const setP = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }));
  const setG = (k) => (e) => setGoal((g) => ({ ...g, [k]: e.target.value }));

  async function loadCommitments() {
    const { data } = await supabase.from("commitments").select("*").eq("member_id", member.id).order("created_at");
    setCommitments(data || []);
  }

  useEffect(() => {
    (async () => {
      const [{ data: me }, { data: g }] = await Promise.all([
        supabase.from("members").select("sex, age, height_cm, current_weight_kg, activity_factor").eq("id", member.id).maybeSingle(),
        supabase.from("goals").select("*").eq("member_id", member.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (me) {
        setProfile({
          sex: me.sex || "male",
          age: me.age ?? "",
          height_cm: me.height_cm ?? "",
          current_weight_kg: me.current_weight_kg ?? "",
          activity_factor: me.activity_factor ? String(me.activity_factor) : "1.2",
        });
      }
      if (g) {
        setGoal({
          starting_weight_kg: g.starting_weight_kg ?? "",
          target_weight_kg: g.target_weight_kg ?? "",
          target_date: g.target_date ?? "",
          daily_calorie_target: g.daily_calorie_target ?? "",
          principles: g.principles ?? "",
        });
      }
      await loadCommitments();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  // Live calorie maths.
  const maintenance = useMemo(
    () => maintenanceCalories({ sex: profile.sex, weightKg: profile.current_weight_kg, heightCm: profile.height_cm, age: profile.age, activityFactor: profile.activity_factor }),
    [profile.sex, profile.current_weight_kg, profile.height_cm, profile.age, profile.activity_factor]
  );
  const suggested = useMemo(
    () => suggestedCalories({ maintenance, currentKg: profile.current_weight_kg, targetKg: goal.target_weight_kg, sex: profile.sex, rate: paceRate(pace) }),
    [maintenance, profile.current_weight_kg, goal.target_weight_kg, profile.sex, pace]
  );
  const estDays = useMemo(
    () => estimateDaysToGoal({ currentKg: profile.current_weight_kg, targetKg: goal.target_weight_kg, rate: paceRate(pace) }),
    [profile.current_weight_kg, goal.target_weight_kg, pace]
  );
  const projectedDate = estDays ? addDays(estDays) : null;
  const daysUntilTarget = goal.target_date ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / 86400000) : null;
  const missesDate = estDays && daysUntilTarget != null && estDays > daysUntilTarget;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setBusy(true);
    const num = (v) => (v === "" || v == null ? null : Number(v));

    const { error: pErr } = await supabase
      .from("members")
      .update({
        sex: profile.sex,
        age: num(profile.age),
        height_cm: num(profile.height_cm),
        current_weight_kg: num(profile.current_weight_kg),
        activity_factor: num(profile.activity_factor),
      })
      .eq("id", member.id);

    const { error: gErr } = await supabase.from("goals").insert({
      member_id: member.id,
      starting_weight_kg: num(goal.starting_weight_kg),
      target_weight_kg: num(goal.target_weight_kg),
      target_date: goal.target_date || null,
      daily_calorie_target: num(goal.daily_calorie_target),
      principles: goal.principles || null,
    });

    setBusy(false);
    if (pErr || gErr) return setError((pErr || gErr).message || "Couldn’t save. Try again.");
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  // Habits
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
        <h1 className="text-2xl font-bold tracking-tight">Your goal</h1>
        <p className="mt-1 text-sm text-zinc-400">Tweak your details, replay the calorie calculator, and manage your habits.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* About you */}
        <section className="card space-y-4">
          <h2 className="font-semibold text-zinc-100">About you</h2>
          <div>
            <label className="label">Sex <span className="text-zinc-600">(for the calorie formula)</span></label>
            <div className="seg w-full">
              {["male", "female"].map((s) => (
                <button key={s} type="button" onClick={() => setProfile((p) => ({ ...p, sex: s }))} className={`seg-item flex-1 capitalize ${profile.sex === s ? "seg-item-active" : ""}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Age</label>
              <input type="number" inputMode="numeric" className="input" value={profile.age} onChange={setP("age")} placeholder="29" />
            </div>
            <div>
              <label className="label">Height (cm)</label>
              <input type="number" inputMode="decimal" className="input" value={profile.height_cm} onChange={setP("height_cm")} placeholder="178" />
            </div>
            <div>
              <label className="label">Current (kg)</label>
              <input type="number" step="0.1" inputMode="decimal" className="input" value={profile.current_weight_kg} onChange={setP("current_weight_kg")} placeholder="82.5" />
            </div>
          </div>
          <div>
            <label className="label">How active are you?</label>
            <select className="input" value={profile.activity_factor} onChange={setP("activity_factor")}>
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.factor} value={a.factor}>{a.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">{ACTIVITY_LEVELS.find((a) => String(a.factor) === String(profile.activity_factor))?.desc}</p>
          </div>
        </section>

        {/* Goal + calculator */}
        <section className="card space-y-4">
          <h2 className="font-semibold text-zinc-100">Target</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Starting (kg)</label>
              <input type="number" step="0.1" inputMode="decimal" className="input" value={goal.starting_weight_kg} onChange={setG("starting_weight_kg")} placeholder="88.0" />
            </div>
            <div>
              <label className="label">Target (kg)</label>
              <input type="number" step="0.1" inputMode="decimal" className="input" value={goal.target_weight_kg} onChange={setG("target_weight_kg")} placeholder="78.0" />
            </div>
            <div>
              <label className="label">By when</label>
              <input type="date" className="input" value={goal.target_date} onChange={setG("target_date")} />
            </div>
          </div>

          {/* Pace */}
          <div>
            <label className="label">How aggressively?</label>
            <div className="grid grid-cols-3 gap-2">
              {PACES.map((p) => {
                const active = pace === p.key;
                return (
                  <button key={p.key} type="button" onClick={() => setPace(p.key)} className={`rounded-2xl px-2 py-2.5 text-center ring-1 transition ${active ? "bg-flame-500/10 ring-flame-500/50" : "bg-ink-850 ring-white/10 hover:bg-ink-800"}`}>
                    <span className={`block text-sm font-semibold ${active ? "text-flame-400" : "text-zinc-200"}`}>{p.label}</span>
                    <span className="block text-[11px] text-zinc-500">{p.weekly}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculator */}
          <div className="rounded-2xl bg-ink-850 p-4 ring-1 ring-white/5">
            {maintenance ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Maintenance</span>
                  <span className="font-semibold text-zinc-200">{maintenance} kcal</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Suggested for your goal</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-flame-400">{suggested} kcal</span>
                    {suggested != null && String(suggested) !== String(goal.daily_calorie_target) && (
                      <button type="button" onClick={() => setGoal((g) => ({ ...g, daily_calorie_target: String(suggested) }))} className="rounded-lg bg-flame-500/15 px-2 py-0.5 text-xs font-semibold text-flame-400 hover:bg-flame-500/25">Use</button>
                    )}
                  </div>
                </div>
                {estDays && (
                  <p className="mt-2 text-xs text-zinc-400">
                    At this pace, <span className="font-semibold text-zinc-200">{formatDuration(estDays)}</span>
                    {projectedDate ? ` — around ${formatDate(projectedDate)}.` : "."}
                    {daysUntilTarget != null && (
                      <span className={`ml-1 font-medium ${missesDate ? "text-viz-coral" : "text-viz-green"}`}>
                        {missesDate ? `After your ${formatDate(goal.target_date)} target.` : `On track for ${formatDate(goal.target_date)}.`}
                      </span>
                    )}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-zinc-400">Fill in your age, height, current weight and activity level to calculate calories.</p>
            )}
          </div>

          <div>
            <label className="label">Daily calorie target</label>
            <input type="number" inputMode="numeric" className="input" value={goal.daily_calorie_target} onChange={setG("daily_calorie_target")} placeholder="2000" />
          </div>
          <div>
            <label className="label">Notes <span className="text-zinc-600">(optional)</span></label>
            <textarea className="input min-h-20" value={goal.principles} onChange={setG("principles")} placeholder="Anything else you’re holding yourself to…" />
          </div>

          {error && <p className="text-sm font-medium text-red-400">{error}</p>}
          {saved && <p className="text-sm font-medium text-emerald-400">Saved.</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Save goal"}</button>
        </section>
      </form>

      {/* Habits */}
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

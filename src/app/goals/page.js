"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useIdentity } from "@/components/useIdentity";
import IdentityGate from "@/components/IdentityGate";
import AboutYouFields from "@/components/AboutYouFields";
import ActivitySelect from "@/components/ActivitySelect";
import CalorieCalculator from "@/components/CalorieCalculator";

function GoalsInner() {
  const { member } = useIdentity();

  const [profile, setProfile] = useState({ sex: "male", age: "", height_cm: "", current_weight_kg: "", activity_factor: "1.2" });
  const [goal, setGoal] = useState({ starting_weight_kg: "", target_weight_kg: "", target_date: "", daily_calorie_target: "", principles: "" });
  const [pace, setPace] = useState("steady");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const setG = (k) => (e) => setGoal((g) => ({ ...g, [k]: e.target.value }));
  const setProfileField = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

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
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

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

  if (loading) return <div className="py-16 text-center text-zinc-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Your goal</h1>
        <p className="mt-1 text-sm text-zinc-400">Tweak your details and replay the calorie calculator.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card space-y-4">
          <h2 className="font-semibold text-zinc-100">About you</h2>
          <AboutYouFields value={profile} onChange={setProfileField} />
        </section>

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

          <ActivitySelect value={profile.activity_factor} onChange={(v) => setProfileField("activity_factor", v)} />

          <CalorieCalculator
            sex={profile.sex}
            age={profile.age}
            heightCm={profile.height_cm}
            currentWeight={profile.current_weight_kg}
            activityFactor={profile.activity_factor}
            targetWeight={goal.target_weight_kg}
            targetDate={goal.target_date}
            pace={pace}
            onPaceChange={setPace}
            dailyTarget={goal.daily_calorie_target}
            onUseSuggested={(v) => setGoal((g) => ({ ...g, daily_calorie_target: String(v) }))}
          />

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

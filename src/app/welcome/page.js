"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { storeMember } from "@/lib/session";
import { useIdentity } from "@/components/useIdentity";
import ConfigNotice from "@/components/ConfigNotice";
import Icon from "@/components/Icon";

function makeJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const STEPS = ["Welcome", "About you", "Your goal", "Your squad"];

export default function WelcomePage() {
  const router = useRouter();
  const { member, ready } = useIdentity();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    age: "",
    height_cm: "",
    current_weight_kg: "",
    target_weight_kg: "",
    target_date: "",
    daily_calorie_target: "",
    principles: "",
    mode: "solo", // solo | create | join
    team_name: "",
    join_code: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Already onboarded on this device → straight to the dashboard.
  useEffect(() => {
    if (ready && member) router.replace("/");
  }, [ready, member, router]);

  const canContinue = () => {
    if (step === 1) return form.name.trim() && form.current_weight_kg;
    if (step === 3) {
      if (form.mode === "create") return form.team_name.trim();
      if (form.mode === "join") return form.join_code.trim();
      return true;
    }
    return true;
  };

  async function finish() {
    setError("");
    if (!isSupabaseConfigured) {
      setError("Connect Supabase first (see the banner above).");
      return;
    }
    setBusy(true);
    try {
      let team_id = null;
      let is_admin = false;

      if (form.mode === "create") {
        const { data: team, error: tErr } = await supabase
          .from("teams")
          .insert({ name: form.team_name.trim(), join_code: makeJoinCode() })
          .select("id")
          .single();
        if (tErr) throw tErr;
        team_id = team.id;
        is_admin = true;
      } else if (form.mode === "join") {
        const { data: team, error: tErr } = await supabase
          .from("teams")
          .select("id")
          .ilike("join_code", form.join_code.trim())
          .maybeSingle();
        if (tErr) throw tErr;
        if (!team) {
          setBusy(false);
          setError("No squad found with that code. Double-check it with your friend.");
          return;
        }
        team_id = team.id;
      }

      const { data: newMember, error: mErr } = await supabase
        .from("members")
        .insert({
          name: form.name.trim(),
          age: form.age ? Number(form.age) : null,
          height_cm: form.height_cm ? Number(form.height_cm) : null,
          current_weight_kg: form.current_weight_kg ? Number(form.current_weight_kg) : null,
          team_id,
          is_admin,
          join_date: new Date().toISOString().slice(0, 10),
        })
        .select("id, name, is_admin")
        .single();
      if (mErr) throw mErr;

      await supabase.from("goals").insert({
        member_id: newMember.id,
        starting_weight_kg: form.current_weight_kg ? Number(form.current_weight_kg) : null,
        target_weight_kg: form.target_weight_kg ? Number(form.target_weight_kg) : null,
        daily_calorie_target: form.daily_calorie_target ? Number(form.daily_calorie_target) : null,
        target_date: form.target_date || null,
        principles: form.principles || null,
      });

      storeMember(newMember);
      router.replace("/");
    } catch (err) {
      setBusy(false);
      setError(err.message || "Something went wrong. Please try again.");
    }
  }

  if (!ready || member) {
    return <div className="py-24 text-center text-zinc-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-md">
      <ConfigNotice />

      {/* Progress dots */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-7 bg-flame-500" : i < step ? "w-2.5 bg-flame-500/40" : "w-2.5 bg-ink-800"
            }`}
          />
        ))}
      </div>

      <div className="card">
        {step === 0 && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-flame-500/15 text-flame-400 ring-1 ring-flame-500/20">
              <Icon name="flame" className="h-8 w-8" strokeWidth={1.6} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Shredded</h1>
            <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-zinc-400">
              Set your goal, track your progress, and stay accountable with a small
              squad of friends chasing the same thing.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <header>
              <h1 className="text-xl font-bold tracking-tight">A bit about you</h1>
              <p className="mt-1 text-sm text-zinc-400">This stays between you and your squad.</p>
            </header>
            <div>
              <label className="label">What should we call you?</label>
              <input className="input" value={form.name} onChange={set("name")} placeholder="First name" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Age</label>
                <input type="number" inputMode="numeric" className="input" value={form.age} onChange={set("age")} placeholder="29" />
              </div>
              <div>
                <label className="label">Height (cm)</label>
                <input type="number" inputMode="decimal" className="input" value={form.height_cm} onChange={set("height_cm")} placeholder="178" />
              </div>
            </div>
            <div>
              <label className="label">Current weight (kg)</label>
              <input type="number" step="0.1" inputMode="decimal" className="input" value={form.current_weight_kg} onChange={set("current_weight_kg")} placeholder="82.5" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <header>
              <h1 className="text-xl font-bold tracking-tight">What are you chasing?</h1>
              <p className="mt-1 text-sm text-zinc-400">Set the target and the timeframe you want to hit it by.</p>
            </header>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Target weight (kg)</label>
                <input type="number" step="0.1" inputMode="decimal" className="input" value={form.target_weight_kg} onChange={set("target_weight_kg")} placeholder="75.0" />
              </div>
              <div>
                <label className="label">By when</label>
                <input type="date" className="input" value={form.target_date} onChange={set("target_date")} />
              </div>
            </div>
            <div>
              <label className="label">Daily calorie target</label>
              <input type="number" inputMode="numeric" className="input" value={form.daily_calorie_target} onChange={set("daily_calorie_target")} placeholder="2000" />
            </div>
            <div>
              <label className="label">Your approach <span className="text-zinc-600">(optional)</span></label>
              <textarea className="input min-h-20" value={form.principles} onChange={set("principles")} placeholder="The rules you're holding yourself to…" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <header>
              <h1 className="text-xl font-bold tracking-tight">Ride solo or with a squad?</h1>
              <p className="mt-1 text-sm text-zinc-400">You can create or join a squad any time later, too.</p>
            </header>

            <div className="space-y-2">
              {[
                { key: "solo", title: "Just me for now", desc: "Track your own progress privately." },
                { key: "create", title: "Create a squad", desc: "Start a group and invite friends with a code." },
                { key: "join", title: "Join a squad", desc: "Got a code from a friend? Hop in." },
              ].map((opt) => {
                const active = form.mode === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, mode: opt.key }))}
                    className={`flex w-full items-start gap-3 rounded-2xl p-3.5 text-left ring-1 transition ${
                      active ? "bg-flame-500/10 ring-flame-500/50" : "bg-ink-850 ring-white/10 hover:bg-ink-800"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-2 transition ${
                        active ? "bg-flame-500 ring-flame-500" : "ring-zinc-600"
                      }`}
                    >
                      {active && <Icon name="check" className="h-3 w-3 text-white" strokeWidth={2.6} />}
                    </span>
                    <span>
                      <span className="block font-semibold text-zinc-100">{opt.title}</span>
                      <span className="block text-sm text-zinc-400">{opt.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {form.mode === "create" && (
              <div>
                <label className="label">Squad name</label>
                <input className="input" value={form.team_name} onChange={set("team_name")} placeholder="The Shredded Squad" autoFocus />
              </div>
            )}
            {form.mode === "join" && (
              <div>
                <label className="label">Squad code</label>
                <input className="input uppercase tracking-widest" value={form.join_code} onChange={set("join_code")} placeholder="AB12CD" autoFocus />
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-sm font-medium text-red-400">{error}</p>}

        {/* Nav */}
        <div className="mt-6 flex items-center gap-3">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="btn-ghost flex-1" disabled={busy}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} className="btn-primary flex-1" disabled={!canContinue()}>
              {step === 0 ? "Get started" : "Continue"}
              <Icon name="arrowRight" className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={finish} className="btn-primary flex-1" disabled={busy || !canContinue()}>
              {busy ? "Setting up…" : "Enter Shredded"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

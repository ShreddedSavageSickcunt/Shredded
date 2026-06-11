"use client";

import { ACTIVITY_LEVELS } from "@/lib/calories";

// Shared profile inputs used by onboarding + the Goals page.
// `value` = { sex, age, height_cm, current_weight_kg, activity_factor }.
export default function AboutYouFields({ value, onChange }) {
  const set = (k) => (e) => onChange(k, e.target.value);
  return (
    <>
      <div>
        <label className="label">Sex <span className="text-zinc-600">(for the calorie formula)</span></label>
        <div className="seg w-full">
          {["male", "female"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange("sex", s)}
              className={`seg-item flex-1 capitalize ${value.sex === s ? "seg-item-active" : ""}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Age</label>
          <input type="number" inputMode="numeric" className="input" value={value.age} onChange={set("age")} placeholder="29" />
        </div>
        <div>
          <label className="label">Height (cm)</label>
          <input type="number" inputMode="decimal" className="input" value={value.height_cm} onChange={set("height_cm")} placeholder="178" />
        </div>
        <div>
          <label className="label">Current (kg)</label>
          <input type="number" step="0.1" inputMode="decimal" className="input" value={value.current_weight_kg} onChange={set("current_weight_kg")} placeholder="82.5" />
        </div>
      </div>
      <div>
        <label className="label">How active are you?</label>
        <select className="input" value={value.activity_factor} onChange={set("activity_factor")}>
          {ACTIVITY_LEVELS.map((a) => (
            <option key={a.factor} value={a.factor}>
              {a.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500">
          {ACTIVITY_LEVELS.find((a) => String(a.factor) === String(value.activity_factor))?.desc}
        </p>
      </div>
    </>
  );
}

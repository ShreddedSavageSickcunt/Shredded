"use client";

import { ACTIVITY_LEVELS } from "@/lib/calories";

export default function ActivitySelect({ value, onChange }) {
  return (
    <div>
      <label className="label">How active are you?</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {ACTIVITY_LEVELS.map((a) => (
          <option key={a.factor} value={a.factor}>
            {a.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-zinc-500">
        {ACTIVITY_LEVELS.find((a) => String(a.factor) === String(value))?.desc}
      </p>
    </div>
  );
}

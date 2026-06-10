"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { COMMITMENT_TEMPLATES, COMMITMENT_CATEGORIES, resolveLabel } from "@/lib/commitments";

// Controlled habit selector shared by onboarding and the Goals page.
// `selected` items: { key, templateId|null, category, label }.
export default function HabitPicker({ selected, onAdd, onRemove }) {
  const [picking, setPicking] = useState(selected.length === 0);
  const [vals, setVals] = useState({});
  const [custom, setCustom] = useState("");

  const addedIds = new Set(selected.filter((s) => s.templateId).map((s) => s.templateId));
  const labels = new Set(selected.map((s) => s.label.trim().toLowerCase()));

  function addTemplate(t) {
    if (addedIds.has(t.id)) return;
    const v = vals[t.id] ?? t.target?.default;
    onAdd({ templateId: t.id, category: t.category, label: resolveLabel(t, v) });
  }
  function addCustom() {
    const label = custom.trim();
    if (!label || labels.has(label.toLowerCase())) {
      setCustom("");
      return;
    }
    onAdd({ templateId: null, category: "Custom", label });
    setCustom("");
  }

  return (
    <div className="space-y-4">
      {selected.length < 3 && (
        <p className="rounded-2xl bg-flame-500/10 px-3 py-2 text-xs text-flame-300/90 ring-1 ring-flame-500/20">
          Try adding around 3 habits to start — you can always add or remove them later.
        </p>
      )}

      {selected.length > 0 && (
        <ul className="space-y-2">
          {selected.map((s) => (
            <li key={s.key} className="flex items-center gap-3 rounded-2xl bg-ink-850 p-3 ring-1 ring-white/5">
              <span className="chip">{s.category}</span>
              <span className="flex-1 text-sm font-medium text-zinc-200">{s.label}</span>
              <button
                onClick={() => onRemove(s)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-ink-800 hover:text-red-400"
                title="Remove"
                type="button"
              >
                <Icon name="plus" className="h-4 w-4 rotate-45" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={() => setPicking((p) => !p)} className="btn-ghost w-full !py-2.5 text-sm">
        <Icon name={picking ? "chevronDown" : "plus"} className="h-4 w-4" />
        {picking ? "Done adding" : "Add habits"}
      </button>

      {picking && (
        <div className="space-y-4 border-t border-white/10 pt-4">
          {/* Custom habit */}
          <div>
            <p className="stat-label mb-2">Your own</p>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                placeholder="Write your own habit"
              />
              <button type="button" onClick={addCustom} className="rounded-xl bg-flame-500/15 px-3 text-sm font-semibold text-flame-400 hover:bg-flame-500/25">
                Add
              </button>
            </div>
          </div>

          {COMMITMENT_CATEGORIES.map((cat) => (
            <div key={cat}>
              <p className="stat-label mb-2">{cat}</p>
              <div className="space-y-2">
                {COMMITMENT_TEMPLATES.filter((t) => t.category === cat).map((t) => {
                  const added = addedIds.has(t.id);
                  return (
                    <div key={t.id} className="flex items-center gap-2 rounded-2xl bg-ink-850 p-2.5 ring-1 ring-white/5">
                      <span className={`flex-1 text-sm ${added ? "text-zinc-500" : "text-zinc-300"}`}>
                        {resolveLabel(t, vals[t.id] ?? t.target?.default)}
                      </span>
                      {t.target && !added && (
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
                      <button
                        type="button"
                        onClick={() => addTemplate(t)}
                        disabled={added}
                        className={`rounded-lg px-2.5 py-1.5 text-sm font-semibold transition ${
                          added
                            ? "cursor-default bg-ink-800 text-zinc-500"
                            : "bg-flame-500/15 text-flame-400 hover:bg-flame-500/25"
                        }`}
                      >
                        {added ? "Added" : "Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

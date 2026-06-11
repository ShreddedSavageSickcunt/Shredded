"use client";

import { useEffect, useMemo } from "react";
import { PACES, paceRate, maintenanceCalories, suggestedCalories, estimateDaysToGoal } from "@/lib/calories";
import { formatDate, formatDuration, addDays } from "@/lib/format";

// Shared pace selector + calorie results card + time-to-goal estimate.
// Computes everything from the passed-in details; the daily-target input
// itself stays in each parent (onboarding auto-follows, Goals uses "Use").
export default function CalorieCalculator({
  sex,
  age,
  heightCm,
  currentWeight,
  activityFactor,
  targetWeight,
  targetDate,
  pace,
  onPaceChange,
  dailyTarget,
  onUseSuggested,
  onSuggestedChange,
}) {
  const maintenance = useMemo(
    () => maintenanceCalories({ sex, weightKg: currentWeight, heightCm, age, activityFactor }),
    [sex, currentWeight, heightCm, age, activityFactor]
  );
  const suggested = useMemo(
    () => suggestedCalories({ maintenance, currentKg: currentWeight, targetKg: targetWeight, sex, rate: paceRate(pace) }),
    [maintenance, currentWeight, targetWeight, sex, pace]
  );
  const estDays = useMemo(
    () => estimateDaysToGoal({ currentKg: currentWeight, targetKg: targetWeight, rate: paceRate(pace) }),
    [currentWeight, targetWeight, pace]
  );
  const projectedDate = estDays ? addDays(estDays) : null;
  const daysUntilTarget = targetDate ? Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000) : null;
  const missesDate = estDays && daysUntilTarget != null && estDays > daysUntilTarget;

  useEffect(() => {
    if (onSuggestedChange) onSuggestedChange(suggested);
  }, [suggested, onSuggestedChange]);

  const showUse = onUseSuggested && suggested != null && String(suggested) !== String(dailyTarget);

  return (
    <>
      <div>
        <label className="label">How aggressively?</label>
        <div className="grid grid-cols-3 gap-2">
          {PACES.map((p) => {
            const active = pace === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onPaceChange(p.key)}
                className={`rounded-2xl px-2 py-2.5 text-center ring-1 transition ${active ? "bg-flame-500/10 ring-flame-500/50" : "bg-ink-850 ring-white/10 hover:bg-ink-800"}`}
              >
                <span className={`block text-sm font-semibold ${active ? "text-flame-400" : "text-zinc-200"}`}>{p.label}</span>
                <span className="block text-[11px] text-zinc-500">{p.weekly}</span>
              </button>
            );
          })}
        </div>
      </div>

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
                {showUse && (
                  <button
                    type="button"
                    onClick={() => onUseSuggested(suggested)}
                    className="rounded-lg bg-flame-500/15 px-2 py-0.5 text-xs font-semibold text-flame-400 hover:bg-flame-500/25"
                  >
                    Use
                  </button>
                )}
              </div>
            </div>
            {estDays ? (
              <p className="mt-2 text-xs text-zinc-400">
                At this pace, <span className="font-semibold text-zinc-200">{formatDuration(estDays)}</span>
                {projectedDate ? ` — around ${formatDate(projectedDate)}.` : "."}
                {daysUntilTarget != null && (
                  <span className={`ml-1 font-medium ${missesDate ? "text-viz-coral" : "text-viz-green"}`}>
                    {missesDate ? `After your ${formatDate(targetDate)} target.` : `On track for ${formatDate(targetDate)}.`}
                  </span>
                )}
              </p>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">Mifflin–St Jeor maintenance, minus your pace.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-zinc-400">Add your age, height, current weight and activity level to calculate calories.</p>
        )}
      </div>
    </>
  );
}

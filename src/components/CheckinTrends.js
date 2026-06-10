"use client";

import Icon from "@/components/Icon";

// Weight trend = did this check-in move toward or away from the target,
// relative to the previous check-in (or the starting weight for the first one).
function weightTrend(latestWeight, prevWeight, target) {
  if (latestWeight == null || prevWeight == null || target == null) return null;
  const delta = latestWeight - prevWeight;
  if (Math.abs(delta) < 0.3) {
    return { icon: "minus", color: "#fbbf24", ring: "ring-viz-amber/30 bg-viz-amber/10", label: "Steady" };
  }
  const toward = Math.abs(latestWeight - target) < Math.abs(prevWeight - target);
  return toward
    ? { icon: "trendUp", color: "#34d399", ring: "ring-viz-green/30 bg-viz-green/10", label: "Toward" }
    : { icon: "trendDown", color: "#fb7185", ring: "ring-viz-coral/30 bg-viz-coral/10", label: "Away" };
}

function HabitRing({ met, total, size }) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const ratio = total ? Math.min(1, met / total) : 0;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#30333d" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#a78bfa"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circ * ratio} ${circ}`}
        />
      </svg>
      <span className="absolute text-[9px] font-bold text-zinc-200">
        {met}/{total}
      </span>
    </span>
  );
}

// Two-icon system: violet ring = habits score, coloured arrow = weight trend.
export default function CheckinTrends({ latestWeight, prevWeight, target, met, total, size = 38 }) {
  const wt = weightTrend(latestWeight, prevWeight, target);
  const hasHabits = total > 0;
  if (!wt && !hasHabits) return null;

  return (
    <div className="flex items-center gap-3">
      {hasHabits && (
        <div className="flex flex-col items-center gap-1">
          <HabitRing met={met} total={total} size={size} />
          <span className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">Habits</span>
        </div>
      )}
      {wt && (
        <div className="flex flex-col items-center gap-1">
          <span className={`flex items-center justify-center rounded-full ring-1 ${wt.ring}`} style={{ width: size, height: size, color: wt.color }}>
            <Icon name={wt.icon} className="h-4 w-4" strokeWidth={2} />
            <span className="sr-only">{wt.label}</span>
          </span>
          <span className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">Weight</span>
        </div>
      )}
    </div>
  );
}

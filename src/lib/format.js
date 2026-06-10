// Small shared formatting + progress helpers.

export function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatKg(value) {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toFixed(1)} kg`;
}

// Progress from starting weight toward target, clamped 0–100%.
export function goalProgress(starting, target, current) {
  if (
    starting === null ||
    target === null ||
    current === null ||
    starting === undefined ||
    target === undefined ||
    current === undefined
  ) {
    return null;
  }
  const total = Number(starting) - Number(target);
  if (total === 0) return current <= target ? 100 : 0;
  const done = Number(starting) - Number(current);
  const pct = (done / total) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export const VIBE_LABELS = ["Rough", "Meh", "OK", "Good", "Great"];

export function vibeLabel(rating) {
  if (!rating) return "";
  return VIBE_LABELS[Math.max(1, Math.min(5, rating)) - 1];
}

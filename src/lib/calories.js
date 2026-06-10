// Calorie targets via the Mifflin-St Jeor equation.
//   BMR = 10*kg + 6.25*cm - 5*age + s   (s = +5 male, -161 female)
//   Maintenance (TDEE) = BMR * activity factor

// Activity levels, sedentary and up, described in plain everyday terms.
export const ACTIVITY_LEVELS = [
  {
    factor: 1.2,
    label: "Mostly sitting, little to no exercise",
    desc: "Desk job and not much movement through the day",
  },
  {
    factor: 1.375,
    label: "The odd workout or walk most weeks",
    desc: "Light exercise or sport 1–3 days a week",
  },
  {
    factor: 1.425,
    label: "Walks regularly and hits the gym a few times a week",
    desc: "Active most days at a moderate level",
  },
  {
    factor: 1.55,
    label: "Trains hard 4–5 days a week, or a physical job",
    desc: "Consistent exercise or on your feet at work",
  },
  {
    factor: 1.75,
    label: "Intense training almost every day",
    desc: "Hard workouts 6–7 days a week, or heavy labour",
  },
  {
    factor: 1.9,
    label: "Athlete-level training or very physical job",
    desc: "Twice-a-day sessions or extremely demanding work",
  },
];

// How aggressively to push toward the goal (kcal/day adjustment).
export const PACES = [
  { key: "gentle", label: "Gentle", rate: 250, weekly: "~0.25 kg/week" },
  { key: "steady", label: "Steady", rate: 500, weekly: "~0.5 kg/week" },
  { key: "aggressive", label: "Aggressive", rate: 750, weekly: "~0.7 kg/week" },
];

export function paceRate(key) {
  return (PACES.find((p) => p.key === key) || PACES[1]).rate;
}

export function bmrMifflin({ sex, weightKg, heightCm, age }) {
  const w = Number(weightKg);
  const h = Number(heightCm);
  const a = Number(age);
  if (!w || !h || !a) return null;
  const base = 10 * w + 6.25 * h - 5 * a;
  return Math.round(base + (sex === "female" ? -161 : 5));
}

export function maintenanceCalories({ sex, weightKg, heightCm, age, activityFactor }) {
  const bmr = bmrMifflin({ sex, weightKg, heightCm, age });
  const f = Number(activityFactor);
  if (bmr === null || !f) return null;
  return Math.round(bmr * f);
}

// Suggested intake to move toward a goal weight. The chosen pace sets the daily
// deficit (for loss) or surplus (for gain). Maintenance if roughly there.
// Floored at a sensible minimum so we never suggest something unsafe.
export function suggestedCalories({ maintenance, currentKg, targetKg, sex, rate = 500 }) {
  if (!maintenance) return null;
  const floor = sex === "female" ? 1200 : 1500;
  const c = Number(currentKg);
  const t = Number(targetKg);
  const r = Number(rate) || 500;
  if (!c || !t || Math.abs(c - t) < 0.5) return maintenance;
  const adjusted = t < c ? maintenance - r : maintenance + r;
  return Math.max(floor, Math.round(adjusted));
}

// Roughly how many days to reach the goal at a given daily deficit/surplus.
// 1 kg of body weight ≈ 7700 kcal.
export function estimateDaysToGoal({ currentKg, targetKg, rate }) {
  const c = Number(currentKg);
  const t = Number(targetKg);
  const r = Number(rate);
  if (!c || !t || !r || Math.abs(c - t) < 0.5) return null;
  const weeklyKg = (r * 7) / 7700;
  if (weeklyKg <= 0) return null;
  const weeks = Math.abs(c - t) / weeklyKg;
  return Math.ceil(weeks * 7);
}

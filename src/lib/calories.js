// Calorie targets via the Mifflin-St Jeor equation.
//   BMR = 10*kg + 6.25*cm - 5*age + s   (s = +5 male, -161 female)
//   Maintenance (TDEE) = BMR * activity factor

// Activity factors + descriptions (from the provided breakdown).
export const ACTIVITY_LEVELS = [
  { factor: 1.0, label: "Completely paralyzed / comatose", desc: "Unable to move without aid of others" },
  { factor: 1.05, label: "Immobile / bedridden", desc: "Stationary, some arm movement, partially paralyzed" },
  { factor: 1.1, label: "Constricted lifestyle", desc: "Confined space, almost always sitting or laying" },
  { factor: 1.16, label: "Work from home, no exercise", desc: "Little to no travel, some walking, mostly sitting" },
  { factor: 1.2, label: "Sedentary", desc: "Little/no exercise, moderate walking, desk job away from home" },
  { factor: 1.375, label: "Slightly active", desc: "Light sport 1–3 days/wk, jog or walk 3–4 days/wk" },
  { factor: 1.425, label: "Lightly active", desc: "Moderate sport 2–3 days/wk, jog or walk 5–7 days/wk" },
  { factor: 1.55, label: "Moderately active", desc: "Physical work or sport 4–5 days/wk, e.g. construction" },
  { factor: 1.75, label: "Very active", desc: "Heavy physical work or sport 6–7 days/wk, hard laborer" },
  { factor: 1.9, label: "Extremely active", desc: "Very heavy work or daily training, pro/Olympic athlete" },
];

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

// Suggested intake to move toward a goal weight. ~500 kcal/day deficit for
// loss (≈0.5 kg/week), surplus for a gain, maintenance if roughly there.
// Floored at a sensible minimum so we never suggest something unsafe.
export function suggestedCalories({ maintenance, currentKg, targetKg, sex }) {
  if (!maintenance) return null;
  const floor = sex === "female" ? 1200 : 1500;
  const c = Number(currentKg);
  const t = Number(targetKg);
  if (!c || !t || Math.abs(c - t) < 0.5) return maintenance;
  const adjusted = t < c ? maintenance - 500 : maintenance + 300;
  return Math.max(floor, Math.round(adjusted));
}

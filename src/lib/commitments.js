// Habit templates a member can adopt. Some carry one editable number ({n}).

export const COMMITMENT_TEMPLATES = [
  // Diet
  { id: "cut-junk", category: "Diet", label: "Cut out junk food" },
  { id: "no-sugar", category: "Diet", label: "Avoid sugary snacks" },
  { id: "protein", category: "Diet", label: "Hit {n}g of protein daily", target: { default: 150, min: 50, max: 300, step: 10 } },
  { id: "water", category: "Diet", label: "Drink {n}L of water daily", target: { default: 3, min: 1, max: 6, step: 1 } },
  { id: "alcohol", category: "Diet", label: "Max {n} alcoholic drinks per week", target: { default: 2, min: 0, max: 21, step: 1 } },
  { id: "home-cooked", category: "Diet", label: "Cook {n} meals at home per week", target: { default: 5, min: 1, max: 21, step: 1 } },

  // Training
  { id: "gym", category: "Training", label: "Gym {n}x per week", target: { default: 3, min: 1, max: 7, step: 1 } },
  { id: "cardio", category: "Training", label: "Cardio {n}x per week", target: { default: 3, min: 1, max: 7, step: 1 } },
  { id: "cardio-daily", category: "Training", label: "Some cardio every day" },
  { id: "steps", category: "Training", label: "Hit {n} steps daily", target: { default: 8000, min: 2000, max: 25000, step: 500 } },

  // Lifestyle
  { id: "sleep", category: "Lifestyle", label: "Sleep {n}+ hours a night", target: { default: 7, min: 4, max: 10, step: 1 } },
  { id: "no-late-eating", category: "Lifestyle", label: "No eating after 8pm" },
  { id: "steps-walk", category: "Lifestyle", label: "Walk after {n} meals a day", target: { default: 1, min: 1, max: 3, step: 1 } },
];

export const COMMITMENT_CATEGORIES = ["Diet", "Training", "Lifestyle"];

// Fill {n} with the chosen value to produce the stored label.
export function resolveLabel(template, value) {
  if (!template.target) return template.label;
  return template.label.replace("{n}", value ?? template.target.default);
}

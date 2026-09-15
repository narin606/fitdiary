import { api } from "./api";

export type ActivityLevel = "sedentary" | "light" | "active" | "very_active";
export type GoalType = "LOSE" | "MAINTAIN" | "GAIN";
export type Sex = "male" | "female";
export type Units = "metric" | "imperial";

export type Plan = {
  bmr: number;
  maintenanceCalories: number;
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  notes: string[];
};

export type Answers = {
  goalType: GoalType;
  sex: Sex;
  birthDate: string;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  activityLevel: ActivityLevel;
  weeklyRateKg?: number;
  units: Units;
};

export type Overrides = Partial<Pick<Plan, "calorieGoal" | "proteinGoal" | "carbGoal" | "fatGoal">>;

/** The four activity levels, described the way a person would recognise their own day. */
export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: "sedentary", label: "Not Very Active", description: "Mostly seated — desk work, driving, and little walking during the day." },
  { value: "light", label: "Lightly Active", description: "On your feet for part of the day — teaching, retail, or regular light chores." },
  { value: "active", label: "Active", description: "Moving for most of the day — serving, nursing, or a walking commute." },
  { value: "very_active", label: "Very Active", description: "Heavy physical work, or hard training on most days of the week." },
];

export const GOAL_OPTIONS: { value: GoalType; label: string; description: string }[] = [
  { value: "LOSE", label: "Lose weight", description: "Eat below your maintenance calories." },
  { value: "MAINTAIN", label: "Maintain weight", description: "Eat close to your maintenance calories." },
  { value: "GAIN", label: "Gain weight", description: "Eat above your maintenance calories." },
];

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

/** Rates offered per week. Values are stored in kilograms regardless of the display units. */
export const RATE_OPTIONS_KG = [0.25, 0.5, 0.75, 1];

export const LB_PER_KG = 2.2046226218;

export const toDisplayWeight = (kg: number, units: Units) => (units === "imperial" ? kg * LB_PER_KG : kg);
export const toKg = (value: number, units: Units) => (units === "imperial" ? value / LB_PER_KG : value);
export const weightUnitLabel = (units: Units) => (units === "imperial" ? "lb" : "kg");

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / 2.54);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}
export const feetInchesToCm = (feet: number, inches: number) => Math.round((feet * 12 + inches) * 2.54 * 10) / 10;

export const onboardingApi = {
  get: () => api<{ profile: Record<string, unknown>; onboarded: boolean }>("/onboarding"),
  plan: (answers: Answers) => api<{ plan: Plan }>("/onboarding/plan", { method: "POST", body: JSON.stringify(answers) }),
  save: (answers: Answers, overrides?: Overrides) => api<{ plan: Plan }>("/onboarding", { method: "POST", body: JSON.stringify({ ...answers, overrides }) }),
};

// Calorie and macro targets derived from the onboarding answers.
//
// Uses the Mifflin-St Jeor equation for resting metabolic rate, an activity multiplier
// for daily expenditure, then a deficit or surplus from the weekly rate the user picked.
// Everything here is pure so the numbers can be unit tested and are never trusted from
// the client.

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  active: 1.55,
  very_active: 1.725,
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_MULTIPLIERS;
export type Sex = "male" | "female";
export type GoalType = "LOSE" | "MAINTAIN" | "GAIN";

export const ACTIVITY_LEVELS = Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[];
export const WEEKLY_RATES_KG = [0.25, 0.5, 0.75, 1] as const;

/** Energy in a kilogram of body fat, used to turn a weekly rate into a daily change. */
const KCAL_PER_KG_FAT = 7700;
/**
 * Safe rate of change per week, as a fraction of body weight. Losing faster than about
 * 1% of body weight per week costs lean mass; gaining is kept slower still so the
 * surplus favours muscle over fat.
 */
const MAX_WEEKLY_RATE_FRACTION: Record<"LOSE" | "GAIN", number> = { LOSE: 0.01, GAIN: 0.005 };
/** Floors below which a target is not offered. */
export const CALORIE_FLOOR: Record<Sex, number> = { male: 1500, female: 1200 };
const PROTEIN_G_PER_KG = 1.8;
const FAT_FRACTION_OF_CALORIES = 0.3;

export type OnboardingInput = {
  birthDate: Date;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  goalType: GoalType;
  activityLevel: ActivityLevel;
  weeklyRateKg?: number;
  targetWeightKg?: number;
};

export type Plan = {
  bmr: number;
  maintenanceCalories: number;
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  /** Non-fatal notes shown to the user, e.g. when a requested rate was capped. */
  notes: string[];
};

export function ageOn(birthDate: Date, now: Date): number {
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birthDate.getUTCDate())) age -= 1;
  return age;
}

/** Mifflin-St Jeor resting metabolic rate. */
export function restingRate(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

function roundToTen(value: number): number {
  return Math.round(value / 10) * 10;
}

export function buildPlan(input: OnboardingInput, now: Date): Plan {
  const notes: string[] = [];
  const age = Math.max(13, ageOn(input.birthDate, now));
  const bmr = restingRate(input.sex, input.weightKg, input.heightCm, age);
  const maintenanceCalories = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel];

  let delta = 0;
  if (input.goalType !== "MAINTAIN") {
    const requested = input.weeklyRateKg ?? 0.5;
    const maxRate = MAX_WEEKLY_RATE_FRACTION[input.goalType] * input.weightKg;
    const rate = Math.min(requested, maxRate);
    if (requested > maxRate + 1e-9) {
      notes.push(
        `Rates above ${maxRate.toFixed(2)} kg per week are not advised at your weight, so ${maxRate.toFixed(2)} kg per week was used instead.`,
      );
    }
    const direction = input.goalType === "LOSE" ? -1 : 1;
    delta = (direction * rate * KCAL_PER_KG_FAT) / 7;
  }

  const floor = CALORIE_FLOOR[input.sex];
  let calorieGoal = roundToTen(maintenanceCalories + delta);
  if (calorieGoal < floor) {
    calorieGoal = floor;
    notes.push(`Targets below ${floor} kcal are not offered. Your goal was raised to that floor.`);
  }

  // Protein is set by body weight; fat takes a share of the target; carbohydrate fills
  // whatever is left, so the three macros always add up to the calorie goal.
  const proteinGoal = Math.round(PROTEIN_G_PER_KG * input.weightKg);
  const fatGoal = Math.round((calorieGoal * FAT_FRACTION_OF_CALORIES) / 9);
  const remaining = calorieGoal - proteinGoal * 4 - fatGoal * 9;
  const carbGoal = Math.max(0, Math.round(remaining / 4));

  return {
    bmr: Math.round(bmr),
    maintenanceCalories: roundToTen(maintenanceCalories),
    calorieGoal,
    proteinGoal,
    carbGoal,
    fatGoal,
    notes,
  };
}

export const ONBOARDING_LIMITS = {
  age: { min: 13, max: 100 },
  heightCm: { min: 90, max: 250 },
  weightKg: { min: 25, max: 400 },
} as const;

/** Rejects answers that are individually plausible but impossible for a real person. */
export function validateAnswers(input: OnboardingInput, now: Date): string | null {
  const age = ageOn(input.birthDate, now);
  if (!Number.isFinite(age) || age < ONBOARDING_LIMITS.age.min || age > ONBOARDING_LIMITS.age.max)
    return `Age must be between ${ONBOARDING_LIMITS.age.min} and ${ONBOARDING_LIMITS.age.max}.`;
  if (!Number.isFinite(input.heightCm) || input.heightCm < ONBOARDING_LIMITS.heightCm.min || input.heightCm > ONBOARDING_LIMITS.heightCm.max)
    return `Height must be between ${ONBOARDING_LIMITS.heightCm.min} and ${ONBOARDING_LIMITS.heightCm.max} cm.`;
  if (!Number.isFinite(input.weightKg) || input.weightKg < ONBOARDING_LIMITS.weightKg.min || input.weightKg > ONBOARDING_LIMITS.weightKg.max)
    return `Weight must be between ${ONBOARDING_LIMITS.weightKg.min} and ${ONBOARDING_LIMITS.weightKg.max} kg.`;
  if (input.goalType === "LOSE" && input.targetWeightKg !== undefined) {
    if (input.targetWeightKg >= input.weightKg) return "A weight-loss goal needs a target below your current weight.";
  }
  if (input.goalType === "GAIN" && input.targetWeightKg !== undefined) {
    if (input.targetWeightKg <= input.weightKg) return "A weight-gain goal needs a target above your current weight.";
  }
  return null;
}

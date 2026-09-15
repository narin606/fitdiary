import test from "node:test";
import assert from "node:assert/strict";
import { ACTIVITY_MULTIPLIERS, ageOn, buildPlan, restingRate, validateAnswers, type OnboardingInput } from "./goals.js";

const now = new Date("2026-09-15T00:00:00.000Z");
const base: OnboardingInput = {
  birthDate: new Date("1996-09-15T00:00:00.000Z"),
  sex: "male",
  heightCm: 180,
  weightKg: 80,
  goalType: "MAINTAIN",
  activityLevel: "sedentary",
};

test("resting rate follows Mifflin-St Jeor for both sexes", () => {
  assert.equal(restingRate("male", 80, 180, 30), 1780);
  assert.equal(restingRate("female", 80, 180, 30), 1614);
});

test("age counts completed years only", () => {
  assert.equal(ageOn(new Date("1996-09-15T00:00:00.000Z"), now), 30);
  assert.equal(ageOn(new Date("1996-09-16T00:00:00.000Z"), now), 29);
  assert.equal(ageOn(new Date("1996-10-01T00:00:00.000Z"), now), 29);
});

test("maintenance scales resting rate by activity level", () => {
  for (const [level, multiplier] of Object.entries(ACTIVITY_MULTIPLIERS)) {
    const plan = buildPlan({ ...base, activityLevel: level as keyof typeof ACTIVITY_MULTIPLIERS }, now);
    assert.equal(plan.maintenanceCalories, Math.round((1780 * multiplier) / 10) * 10);
  }
});

test("weight loss subtracts the weekly rate converted to a daily deficit", () => {
  const plan = buildPlan({ ...base, goalType: "LOSE", weeklyRateKg: 0.5 }, now);
  // 1780 * 1.2 = 2136 maintenance; 0.5 kg/week = 550 kcal/day.
  assert.equal(plan.calorieGoal, Math.round((2136 - 550) / 10) * 10);
  assert.deepEqual(plan.notes, []);
});

test("a faster rate is capped at about 1% of body weight per week", () => {
  // Active 80 kg male: 1780 * 1.55 = 2759 maintenance, high enough that the calorie
  // floor does not interfere with what this test is isolating.
  const plan = buildPlan({ ...base, activityLevel: "active", goalType: "LOSE", weeklyRateKg: 1 }, now);
  // Capped to 0.8 kg/week: 0.8 kg * 7700 kcal / 7 days = 880 kcal/day.
  assert.equal(plan.calorieGoal, Math.round((1780 * 1.55 - 880) / 10) * 10);
  assert.equal(plan.notes.length, 1);
  assert.match(plan.notes[0], /not advised at your weight/);
});

test("a rate inside the safe band is accepted unchanged", () => {
  const plan = buildPlan({ ...base, activityLevel: "active", goalType: "LOSE", weeklyRateKg: 0.75 }, now);
  assert.deepEqual(plan.notes, []);
  assert.equal(plan.calorieGoal, Math.round((1780 * 1.55 - (0.75 * 7700) / 7) / 10) * 10);
});

test("targets are never offered below the floor", () => {
  const plan = buildPlan(
    { ...base, birthDate: new Date("1950-01-01T00:00:00.000Z"), sex: "female", heightCm: 150, weightKg: 45, goalType: "LOSE", weeklyRateKg: 1, activityLevel: "sedentary" },
    now,
  );
  assert.equal(plan.calorieGoal, 1200);
  assert.ok(plan.notes.some(note => /not offered/.test(note)));
});

test("macros always add back up to the calorie goal", () => {
  for (const goalType of ["LOSE", "MAINTAIN", "GAIN"] as const) {
    for (const activityLevel of Object.keys(ACTIVITY_MULTIPLIERS) as (keyof typeof ACTIVITY_MULTIPLIERS)[]) {
      const plan = buildPlan({ ...base, goalType, activityLevel }, now);
      const total = plan.proteinGoal * 4 + plan.carbGoal * 4 + plan.fatGoal * 9;
      assert.ok(Math.abs(total - plan.calorieGoal) <= 4, `${goalType}/${activityLevel} drifted to ${total} vs ${plan.calorieGoal}`);
    }
  }
});

test("gaining adds a surplus instead of a deficit", () => {
  const plan = buildPlan({ ...base, goalType: "GAIN", weeklyRateKg: 0.25 }, now);
  assert.equal(plan.calorieGoal, Math.round((2136 + (0.25 * 7700) / 7) / 10) * 10);
});

test("impossible answers are rejected", () => {
  assert.match(validateAnswers({ ...base, birthDate: new Date("2026-01-01T00:00:00.000Z") }, now)!, /Age must be/);
  assert.match(validateAnswers({ ...base, heightCm: 20 }, now)!, /Height must be/);
  assert.match(validateAnswers({ ...base, weightKg: 5 }, now)!, /Weight must be/);
  assert.match(validateAnswers({ ...base, goalType: "LOSE", targetWeightKg: 90 }, now)!, /below your current weight/);
  assert.match(validateAnswers({ ...base, goalType: "GAIN", targetWeightKg: 70 }, now)!, /above your current weight/);
  assert.equal(validateAnswers({ ...base, goalType: "LOSE", targetWeightKg: 72 }, now), null);
  assert.equal(validateAnswers(base, now), null);
});

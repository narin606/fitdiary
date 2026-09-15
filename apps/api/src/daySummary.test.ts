import test from "node:test";
import assert from "node:assert/strict";
import { aggregateDay, dayBounds, parseDay } from "./daySummary.js";

test("day boundaries are exact UTC calendar boundaries", () => {
  assert.deepEqual(dayBounds("2026-09-09"), {
    start: new Date("2026-09-09T00:00:00.000Z"),
    end: new Date("2026-09-10T00:00:00.000Z"),
  });
});

test("invalid or ambiguous dates are rejected rather than silently replaced", () => {
  assert.throws(() => parseDay("09/09/2026"));
  assert.throws(() => parseDay("2026-02-30"));
  assert.equal(parseDay("2026-09-09"), "2026-09-09");
});

test("day summary calculates exact persisted food, macro, water, weight, and exercise totals", () => {
  const summary = aggregateDay({
    date: "2026-09-09",
    goals: { calories: 2200, proteinG: 150, carbsG: 248, fatG: 73, waterMl: 2500 },
    diaryEntries: [
      { items: [{ servings: 2, calories: 100.25, proteinG: 5.5, carbsG: 7.25, fatG: 3.5 }] },
      { items: [{ servings: 0.5, calories: 301, proteinG: 21, carbsG: 10, fatG: 9 }] },
    ],
    waterEntries: [{ amountMl: 250 }, { amountMl: 375 }],
    exerciseEntries: [{ caloriesBurned: 180, durationMinutes: 35 }, { caloriesBurned: 20, durationMinutes: null }],
    weightEntries: [{ id: "older", date: new Date("2026-09-09T08:00:00Z"), weightKg: 130 }, { id: "latest", date: new Date("2026-09-09T20:00:00Z"), weightKg: 129.8 }],
  });
  assert.deepEqual(summary.totals, { calories: 351, proteinG: 21.5, carbsG: 19.5, fatG: 11.5, waterMl: 625, exerciseCalories: 200, exerciseMinutes: 35 });
  assert.equal(summary.remainingCalories, 2049);
  assert.equal(summary.latestWeight?.id, "latest");
});

test("summary does not mutate or mix data outside the repository-selected user/day", () => {
  const summary = aggregateDay({date:"2026-09-10",goals:{calories:2000,proteinG:120,carbsG:220,fatG:65,waterMl:2500},diaryEntries:[],waterEntries:[],exerciseEntries:[],weightEntries:[]});
  assert.equal(summary.date, "2026-09-10");
  assert.deepEqual(summary.totals, {calories:0,proteinG:0,carbsG:0,fatG:0,waterMl:0,exerciseCalories:0,exerciseMinutes:0});
  assert.equal(summary.latestWeight, null);
});

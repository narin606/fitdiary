import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requireUser, type AuthedRequest } from "../middleware/requireUser.js";
import { ACTIVITY_LEVELS, buildPlan, validateAnswers, type ActivityLevel, type GoalType, type OnboardingInput, type Sex } from "../goals.js";

export const onboardingRouter = Router();
onboardingRouter.use(requireUser);

/** The profile shape returned to the client, shared with /profile so both agree. */
export const ONBOARDING_SELECT = {
  username: true,
  email: true,
  displayName: true,
  birthDate: true,
  sex: true,
  heightCm: true,
  activityLevel: true,
  goalType: true,
  calorieGoal: true,
  proteinGoal: true,
  carbGoal: true,
  fatGoal: true,
  waterGoalMl: true,
  units: true,
  targetWeightKg: true,
  onboardedAt: true,
} as const;

const answerSchema = z.object({
  goalType: z.enum(["LOSE", "MAINTAIN", "GAIN"]),
  sex: z.enum(["male", "female"]),
  birthDate: z.coerce.date(),
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  targetWeightKg: z.number().positive().optional(),
  activityLevel: z.enum(["sedentary", "light", "active", "very_active"]),
  weeklyRateKg: z.number().positive().optional(),
  units: z.enum(["metric", "imperial"]).optional(),
  // Editing the suggested numbers is allowed, but the answers themselves are what
  // produce the suggestion and are always recalculated on the server.
  overrides: z
    .object({
      calorieGoal: z.number().int().min(500).max(10000).optional(),
      proteinGoal: z.number().int().min(0).max(1000).optional(),
      carbGoal: z.number().int().min(0).max(2000).optional(),
      fatGoal: z.number().int().min(0).max(1000).optional(),
    })
    .optional(),
});

function toInput(answers: z.infer<typeof answerSchema>): OnboardingInput {
  return {
    birthDate: answers.birthDate,
    sex: answers.sex as Sex,
    heightCm: answers.heightCm,
    weightKg: answers.weightKg,
    goalType: answers.goalType as GoalType,
    activityLevel: answers.activityLevel as ActivityLevel,
    weeklyRateKg: answers.weeklyRateKg,
    targetWeightKg: answers.targetWeightKg,
  };
}

/** Computes the suggestion without writing anything, so the wizard can show live numbers. */
onboardingRouter.post("/plan", (req: AuthedRequest, res) => {
  const parsed = answerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid answers", details: parsed.error.flatten() });
  const input = toInput(parsed.data);
  const problem = validateAnswers(input, new Date());
  if (problem) return res.status(400).json({ error: problem });
  return res.json({ plan: buildPlan(input, new Date()), activityLevels: ACTIVITY_LEVELS });
});

onboardingRouter.get("/", async (req: AuthedRequest, res) => {
  const profile = await db.user.findUniqueOrThrow({ where: { id: req.userId }, select: ONBOARDING_SELECT });
  res.json({ profile, onboarded: Boolean(profile.onboardedAt) });
});

onboardingRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const parsed = answerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid answers", details: parsed.error.flatten() });
    const input = toInput(parsed.data);
    const now = new Date();
    const problem = validateAnswers(input, now);
    if (problem) return res.status(400).json({ error: problem });

    const plan = buildPlan(input, now);
    const o = parsed.data.overrides ?? {};
    const goals = {
      calorieGoal: o.calorieGoal ?? plan.calorieGoal,
      proteinGoal: o.proteinGoal ?? plan.proteinGoal,
      carbGoal: o.carbGoal ?? plan.carbGoal,
      fatGoal: o.fatGoal ?? plan.fatGoal,
    };

    const profile = await db.$transaction(async tx => {
      const updated = await tx.user.update({
        where: { id: req.userId! },
        data: {
          birthDate: input.birthDate,
          sex: input.sex,
          heightCm: input.heightCm,
          activityLevel: input.activityLevel,
          goalType: input.goalType,
          targetWeightKg: input.targetWeightKg ?? null,
          units: parsed.data.units ?? "metric",
          ...goals,
          // Recorded once, so re-running the wizard later does not look like a new signup.
          onboardedAt: (await tx.user.findUniqueOrThrow({ where: { id: req.userId! }, select: { onboardedAt: true } })).onboardedAt ?? now,
        },
        select: ONBOARDING_SELECT,
      });
      // Seed today's weigh-in so progress starts from the number they just gave us.
      const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const existing = await tx.weightEntry.findFirst({ where: { userId: req.userId!, date: day }, select: { id: true } });
      if (existing) await tx.weightEntry.update({ where: { id: existing.id }, data: { weightKg: input.weightKg } });
      else await tx.weightEntry.create({ data: { userId: req.userId!, date: day, weightKg: input.weightKg } });
      return updated;
    });

    return res.json({ profile, plan, goals });
  } catch (error) {
    return next(error);
  }
});

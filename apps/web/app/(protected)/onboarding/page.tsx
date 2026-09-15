"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import {
  ACTIVITY_OPTIONS,
  GOAL_OPTIONS,
  RATE_OPTIONS_KG,
  SEX_OPTIONS,
  cmToFeetInches,
  feetInchesToCm,
  onboardingApi,
  toDisplayWeight,
  toKg,
  weightUnitLabel,
  type ActivityLevel,
  type Answers,
  type GoalType,
  type Plan,
  type Sex,
  type Units,
} from "../../../lib/onboarding";

type Step = "goal" | "about" | "body" | "activity" | "rate" | "plan";

const METRIC_WEIGHT_DEFAULT = 70;
const METRIC_HEIGHT_DEFAULT = 170;

export default function Onboarding() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [answers, setAnswers] = useState<Answers>({
    goalType: "LOSE",
    sex: "male",
    birthDate: "",
    heightCm: METRIC_HEIGHT_DEFAULT,
    weightKg: METRIC_WEIGHT_DEFAULT,
    activityLevel: "sedentary",
    weeklyRateKg: 0.5,
    units: "metric",
  });
  const [chosen, setChosen] = useState<{ sex: boolean; activity: boolean }>({ sex: false, activity: false });
  const [step, setStep] = useState<Step>("goal");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [targets, setTargets] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);

  const replacing = answers.goalType !== "MAINTAIN";
  const steps: Step[] = useMemo(
    () => (replacing ? ["goal", "about", "body", "activity", "rate", "plan"] : ["goal", "about", "body", "activity", "plan"]),
    [replacing],
  );
  const index = steps.indexOf(step);
  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => setAnswers(current => ({ ...current, [key]: value }));

  useEffect(() => {
    heading.current?.focus();
    setError("");
  }, [step]);

  // When setup is re-opened from Settings, start from the answers already on file.
  useEffect(() => {
    onboardingApi
      .get()
      .then(({ profile }) => {
        const p = profile as Record<string, unknown>;
        if (!p) return;
        const num = (value: unknown) => (typeof value === "number" ? value : undefined);
        setAnswers(current => ({
          ...current,
          birthDate: typeof p.birthDate === "string" ? p.birthDate.slice(0, 10) : current.birthDate,
          sex: (p.sex as Sex | null) ?? current.sex,
          heightCm: num(p.heightCm) ?? current.heightCm,
          weightKg: current.weightKg,
          activityLevel: (p.activityLevel as ActivityLevel | null) ?? current.activityLevel,
          goalType: (p.goalType as GoalType | null) ?? current.goalType,
          targetWeightKg: num(p.targetWeightKg),
          units: (p.units as Units | null) ?? current.units,
        }));
        setChosen({ sex: Boolean(p.sex), activity: Boolean(p.activityLevel) });
      })
      .catch(() => undefined);
  }, []);

  const loadPlan = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const { plan: next } = await onboardingApi.plan(answers);
      setPlan(next);
      setTargets(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not calculate your plan");
    } finally {
      setBusy(false);
    }
  }, [answers]);

  useEffect(() => {
    if (step === "plan" && !plan) void loadPlan();
  }, [step, plan, loadPlan]);

  function advance() {
    if (step === "about" && !answers.birthDate) return setError("Choose your birthdate so we can calculate an accurate goal.");
    if (step === "body") {
      if (answers.heightCm < 90 || answers.heightCm > 250) return setError("Enter a height between 90 and 250 cm.");
      if (answers.weightKg < 25 || answers.weightKg > 400) return setError("Enter a weight between 25 and 400 kg.");
    }
    const next = steps[index + 1];
    if (next === "rate" || next === "plan") setPlan(null);
    setStep(next);
  }

  function back() {
    if (index === 0) return router.replace("/");
    setStep(steps[index - 1]);
  }

  async function finish() {
    if (!targets || !plan) return;
    setBusy(true);
    setError("");
    try {
      const overrides = {
        calorieGoal: targets.calorieGoal,
        proteinGoal: targets.proteinGoal,
        carbGoal: targets.carbGoal,
        fatGoal: targets.fatGoal,
      };
      const changed = {
        calorieGoal: overrides.calorieGoal !== plan.calorieGoal ? overrides.calorieGoal : undefined,
        proteinGoal: overrides.proteinGoal !== plan.proteinGoal ? overrides.proteinGoal : undefined,
        carbGoal: overrides.carbGoal !== plan.carbGoal ? overrides.carbGoal : undefined,
        fatGoal: overrides.fatGoal !== plan.fatGoal ? overrides.fatGoal : undefined,
      };
      await onboardingApi.save(answers, changed);
      await refresh();
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your plan");
      setBusy(false);
    }
  }

  const units: Units = answers.units;
  const weightLabel = weightUnitLabel(units);
  const displayWeight = Math.round(toDisplayWeight(answers.weightKg, units) * 10) / 10;
  const displayTarget = answers.targetWeightKg === undefined ? "" : String(Math.round(toDisplayWeight(answers.targetWeightKg, units) * 10) / 10);
  const { feet, inches } = cmToFeetInches(answers.heightCm);
  const age = answers.birthDate ? Math.floor((Date.now() - new Date(answers.birthDate).getTime()) / 31557600000) : null;

  return (
    <main className="wizard">
      <form
        className="wizard-card"
        onSubmit={event => {
          event.preventDefault();
          if (step === "plan") void finish();
          else advance();
        }}
      >
        <div className="wizard-progress">
          <div className="wizard-bar" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={index + 1} aria-label="Setup progress">
            <span style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
          </div>
          <p className="wizard-count">
            Step {index + 1} of {steps.length}
          </p>
        </div>

        {step === "goal" && (
          <fieldset className="wizard-step">
            <legend>
              <h1 ref={heading} tabIndex={-1}>
                What is your goal?
              </h1>
            </legend>
            <p className="wizard-help">This sets the calorie budget everything else is measured against.</p>
            {GOAL_OPTIONS.map(option => (
              <label key={option.value} className={`choice${answers.goalType === option.value ? " is-selected" : ""}`}>
                <input type="radio" name="goalType" value={option.value} checked={answers.goalType === option.value} onChange={() => set("goalType", option.value as GoalType)} />
                <span>
                  <strong>{option.label}</strong>
                  <em>{option.description}</em>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {step === "about" && (
          <fieldset className="wizard-step">
            <legend>
              <h1 ref={heading} tabIndex={-1}>
                About you
              </h1>
            </legend>
            <p className="wizard-help">We use this information to calculate an accurate calorie goal for you.</p>
            <div className="choice-row">
              {SEX_OPTIONS.map(option => (
                <label key={option.value} className={`choice choice-compact${chosen.sex && answers.sex === option.value ? " is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="sex"
                    value={option.value}
                    checked={chosen.sex && answers.sex === option.value}
                    onChange={() => {
                      setChosen(current => ({ ...current, sex: true }));
                      set("sex", option.value as Sex);
                    }}
                  />
                  <span>
                    <strong>{option.label}</strong>
                  </span>
                </label>
              ))}
            </div>
            <label className="wizard-field">
              <span>Birthdate</span>
              <input
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                value={answers.birthDate}
                onChange={event => set("birthDate", event.target.value)}
              />
              {age !== null && age > 0 && <small>Age {age}</small>}
            </label>
          </fieldset>
        )}

        {step === "body" && (
          <fieldset className="wizard-step">
            <legend>
              <h1 ref={heading} tabIndex={-1}>
                Your body
              </h1>
            </legend>
            <p className="wizard-help">Height and weight drive your calorie needs. Both stay private to your account.</p>
            <div className="unit-toggle" role="group" aria-label="Units">
              {(["metric", "imperial"] as Units[]).map(option => (
                <button key={option} type="button" aria-pressed={units === option} className={units === option ? "is-selected" : ""} onClick={() => set("units", option)}>
                  {option === "metric" ? "kg / cm" : "lb / ft"}
                </button>
              ))}
            </div>
            {units === "metric" ? (
              <label className="wizard-field">
                <span>Height (cm)</span>
                <input type="number" inputMode="decimal" min={90} max={250} step="0.5" required value={answers.heightCm} onChange={event => set("heightCm", Number(event.target.value))} />
              </label>
            ) : (
              <div className="wizard-field">
                <span>Height</span>
                <div className="field-split">
                  <label>
                    <input type="number" inputMode="numeric" min={2} max={8} value={feet} onChange={event => set("heightCm", feetInchesToCm(Number(event.target.value), inches))} />
                    <small>ft</small>
                  </label>
                  <label>
                    <input type="number" inputMode="numeric" min={0} max={11} value={inches} onChange={event => set("heightCm", feetInchesToCm(feet, Number(event.target.value)))} />
                    <small>in</small>
                  </label>
                </div>
              </div>
            )}
            <label className="wizard-field">
              <span>Current weight ({weightLabel})</span>
              <input
                type="number"
                inputMode="decimal"
                min={units === "metric" ? 25 : 55}
                max={units === "metric" ? 400 : 880}
                step="0.1"
                required
                value={displayWeight}
                onChange={event => set("weightKg", toKg(Number(event.target.value), units))}
              />
              <small>Recorded as today&apos;s weigh-in.</small>
            </label>
            {replacing && (
              <label className="wizard-field">
                <span>Goal weight ({weightLabel})</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  required
                  value={displayTarget}
                  onChange={event => set("targetWeightKg", event.target.value === "" ? undefined : toKg(Number(event.target.value), units))}
                />
              </label>
            )}
          </fieldset>
        )}

        {step === "activity" && (
          <fieldset className="wizard-step">
            <legend>
              <h1 ref={heading} tabIndex={-1}>
                How active are you?
              </h1>
            </legend>
            <p className="wizard-help">Think about a typical day, not your best week.</p>
            {ACTIVITY_OPTIONS.map(option => (
              <label key={option.value} className={`choice${chosen.activity && answers.activityLevel === option.value ? " is-selected" : ""}`}>
                <input
                  type="radio"
                  name="activityLevel"
                  value={option.value}
                  checked={chosen.activity && answers.activityLevel === option.value}
                  onChange={() => {
                    setChosen(current => ({ ...current, activity: true }));
                    set("activityLevel", option.value as ActivityLevel);
                  }}
                />
                <span>
                  <strong>{option.label}</strong>
                  <em>{option.description}</em>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {step === "rate" && (
          <fieldset className="wizard-step">
            <legend>
              <h1 ref={heading} tabIndex={-1}>
                How fast?
              </h1>
            </legend>
            <p className="wizard-help">
              {answers.goalType === "LOSE" ? "A slower rate is easier to keep and protects muscle." : "A slower surplus favours muscle over fat."}
            </p>
            {RATE_OPTIONS_KG.map(rate => {
              const shown = units === "imperial" ? Math.round(toDisplayWeight(rate, units) * 100) / 100 : rate;
              return (
                <label key={rate} className={`choice choice-compact-row${answers.weeklyRateKg === rate ? " is-selected" : ""}`}>
                  <input type="radio" name="weeklyRateKg" value={rate} checked={answers.weeklyRateKg === rate} onChange={() => set("weeklyRateKg", rate)} />
                  <span>
                    <strong>
                      {shown} {weightLabel} per week
                    </strong>
                  </span>
                </label>
              );
            })}
          </fieldset>
        )}

        {step === "plan" && (
          <div className="wizard-step">
            <h1 ref={heading} tabIndex={-1}>
              Your daily plan
            </h1>
            {busy && !plan && <p role="status">Calculating your plan…</p>}
            {plan && targets && (
              <>
                <p className="wizard-help">
                  Based on your answers, you would maintain your weight on about <strong>{plan.maintenanceCalories.toLocaleString()} kcal</strong> a day.
                </p>
                <div className="plan-hero">
                  <span className="plan-number">{targets.calorieGoal.toLocaleString()}</span>
                  <span className="plan-unit">kcal per day</span>
                </div>
                <div className="plan-macros">
                  {(
                    [
                      ["proteinGoal", "Protein", "g"],
                      ["carbGoal", "Carbs", "g"],
                      ["fatGoal", "Fat", "g"],
                    ] as const
                  ).map(([key, label, unit]) => (
                    <label key={key} className="wizard-field">
                      <span>{label}</span>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={targets[key]}
                        onChange={event => setTargets(current => (current ? { ...current, [key]: Number(event.target.value) } : current))}
                      />
                      <small>{unit}</small>
                    </label>
                  ))}
                </div>
                {plan.notes.map(note => (
                  <p key={note} className="plan-note">
                    {note}
                  </p>
                ))}
                <p className="wizard-help">You can change any of these numbers — they are a starting point, not a rule.</p>
              </>
            )}
          </div>
        )}

        {error && (
          <p className="wizard-error" role="alert">
            {error}
          </p>
        )}

        <div className="wizard-actions">
          <button type="button" className="ghost" onClick={back} disabled={busy}>
            {index === 0 ? "Not now" : "Back"}
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {step === "plan" ? "Start tracking" : "Next"}
          </button>
        </div>
      </form>
    </main>
  );
}

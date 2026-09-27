import { passwordChecks } from "../lib/passwordPolicy";

export function PasswordChecklist({ password }: { password: string }) {
  const checks = passwordChecks(password);
  const items = [
    [checks.length, "At least 8 characters"],
    [checks.letter, "At least one letter"],
    [checks.numberAndSymbol, "At least one number and one symbol"],
  ] as const;

  return (
    <ul className="password-checklist" aria-label="Password requirements" aria-live="polite">
      {items.map(([met, label]) => (
        <li key={label} className={met ? "met" : "unmet"}>
          <span aria-hidden="true">{met ? "✓" : "○"}</span> {label}
        </li>
      ))}
    </ul>
  );
}

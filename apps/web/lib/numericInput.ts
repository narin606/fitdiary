/** Keep an empty numeric field empty while it is being edited. */
export function editableNumber(raw: string): number {
  return raw === "" ? Number.NaN : Number(raw);
}

export function numericInputValue(value: number): number | "" {
  return Number.isFinite(value) ? value : "";
}
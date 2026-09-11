export type FieldErrors = Partial<Record<"username" | "email" | "password" | "confirmPassword", string>>;
const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;
export function validateLogin(username: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!usernamePattern.test(username.trim())) errors.username = "Use 3–30 letters, numbers, or underscores.";
  if (password.length < 10) errors.password = "Password must be at least 10 characters.";
  return errors;
}
export function validateRegistration(username: string, email: string, password: string, confirmation: string): FieldErrors {
  const errors = validateLogin(username, password);
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "Enter a valid email address.";
  if (password !== confirmation) errors.confirmPassword = "Passwords do not match.";
  return errors;
}
export function safeReturnTo(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

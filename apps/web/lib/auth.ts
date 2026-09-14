export type FieldErrors = Partial<Record<"identity" | "username" | "email" | "password" | "confirmPassword", string>>;
const usernamePattern = /^[a-zA-Z0-9_]{3,30}$/;
const emailPattern = /^\S+@\S+\.\S+$/;

export function validateLogin(identity: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const value = identity.trim();
  if (!usernamePattern.test(value) && !emailPattern.test(value)) errors.identity = "Enter your username or email address.";
  if (password.length < 10) errors.password = "Password must be at least 10 characters.";
  return errors;
}

export function validateRegistration(username: string, email: string, password: string, confirmation: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!usernamePattern.test(username.trim())) errors.username = "Use 3–30 letters, numbers, or underscores.";
  if (!emailPattern.test(email.trim())) errors.email = "Enter a valid email address.";
  if (password.length < 10) errors.password = "Password must be at least 10 characters.";
  if (password !== confirmation) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

export function safeReturnTo(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

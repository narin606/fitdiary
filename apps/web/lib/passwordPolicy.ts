export type PasswordChecks = {
  length: boolean;
  letter: boolean;
  numberAndSymbol: boolean;
};

export function passwordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= 8 && password.length <= 128,
    letter: /[A-Za-z]/.test(password),
    numberAndSymbol: /\d/.test(password) && /[^A-Za-z0-9]/.test(password),
  };
}

export function isValidPassword(password: string): boolean {
  return Object.values(passwordChecks(password)).every(Boolean);
}

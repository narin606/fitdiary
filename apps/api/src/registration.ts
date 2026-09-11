export type RegistrationInput = {
  username: string;
  email: string;
  password: string;
};

export const REGISTRATION_ACCEPTED = "Please check your inbox for a verification email. If an account can be created with those details, the email will arrive shortly.";

type PendingAccount = {
  username: string;
  email: string;
  passwordHash: string;
  tokenHash: string;
  expiresAt: Date;
};

type RegistrationStore = {
  findExisting: (identity: { username: string; email: string }) => Promise<unknown | null>;
  createPending: (account: PendingAccount) => Promise<void>;
};

type RegistrationSecurity = {
  hashPassword: (password: string) => Promise<string>;
  createToken: () => string;
  hashToken: (token: string) => string;
  now: () => Date;
};

export async function registerPendingAccount(
  input: RegistrationInput,
  store: RegistrationStore,
  security: RegistrationSecurity,
) {
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const existing = await store.findExisting({ username, email });

  if (existing) return { accepted: true as const };

  const verificationToken = security.createToken();
  const now = security.now();
  await store.createPending({
    username,
    email,
    passwordHash: await security.hashPassword(input.password),
    tokenHash: security.hashToken(verificationToken),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
  });

  return { accepted: true as const, verificationToken };
}

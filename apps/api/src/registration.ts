export type RegistrationInput = { username: string; email: string; password: string };

export const REGISTRATION_ACCEPTED = "Check your inbox for a verification email. It should arrive shortly.";
export const REGISTRATION_THROTTLED = "Please try again later.";

export type PendingRegistration = {
  username: string;
  email: string;
  passwordHash: string;
  tokenHash: string;
  expiresAt: Date;
};

type RegistrationStore = {
  findExisting: (identity: { username: string; email: string }) => Promise<unknown | null>;
  createPending: (account: PendingRegistration) => Promise<boolean>;
};

type RegistrationSecurity = {
  hashPassword: (password: string) => Promise<string>;
  createToken: () => string;
  hashToken: (token: string) => string;
  now: () => Date;
};

export async function preparePendingRegistration(input: RegistrationInput, store: Pick<RegistrationStore, "findExisting">, security: RegistrationSecurity) {
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  if (await store.findExisting({ username, email })) return { accepted: true as const };
  const token = security.createToken();
  const now = security.now();
  return {
    accepted: true as const,
    verificationToken: token,
    pending: {
      username,
      email,
      passwordHash: await security.hashPassword(input.password),
      tokenHash: security.hashToken(token),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    },
  };
}

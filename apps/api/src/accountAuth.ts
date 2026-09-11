export type LoginAccount = { id: string; passwordHash: string; emailVerifiedAt: Date | null };

export async function authenticateVerifiedAccount<T extends LoginAccount>(
  account: T | null | undefined,
  password: string,
  verifyPassword: (hash: string, password: string) => Promise<boolean>,
) {
  if (!account?.emailVerifiedAt) return null;
  return (await verifyPassword(account.passwordHash, password)) ? account : null;
}

export async function verifyPendingAccount(token: string, dependencies: {
  hashToken: (token: string) => string;
  now: () => Date;
  consumeAndVerify: (tokenHash: string, now: Date) => Promise<boolean>;
}) {
  if (!token) return false;
  return dependencies.consumeAndVerify(dependencies.hashToken(token), dependencies.now());
}

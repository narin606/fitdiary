import assert from "node:assert/strict";
import test from "node:test";
import { registerPendingAccount } from "./registration.js";

test("registration creates an unverified account and hashed verification token without a session", async () => {
  const writes: unknown[] = [];
  const result = await registerPendingAccount(
    { username: "Alice", email: "ALICE@example.com", password: "correct horse battery staple" },
    {
      findExisting: async () => null,
      createPending: async (account) => { writes.push(account); },
    },
    {
      hashPassword: async () => "password-hash",
      createToken: () => "raw-token",
      hashToken: () => "token-hash",
      now: () => new Date("2026-09-11T12:00:00.000Z"),
    },
  );

  assert.deepEqual(result, { accepted: true, verificationToken: "raw-token" });
  assert.deepEqual(writes, [{
    username: "alice",
    email: "alice@example.com",
    passwordHash: "password-hash",
    tokenHash: "token-hash",
    expiresAt: new Date("2026-09-12T12:00:00.000Z"),
  }]);
  assert.equal("session" in result, false);
});

test("registration gives the same accepted response for an existing identity and performs no write", async () => {
  let wrote = false;
  const result = await registerPendingAccount(
    { username: "alice", email: "alice@example.com", password: "correct horse battery staple" },
    {
      findExisting: async () => ({ id: "existing" }),
      createPending: async () => { wrote = true; },
    },
    {
      hashPassword: async () => { throw new Error("must not hash an existing identity"); },
      createToken: () => "unused",
      hashToken: () => "unused",
      now: () => new Date("2026-09-11T12:00:00.000Z"),
    },
  );

  assert.deepEqual(result, { accepted: true });
  assert.equal(wrote, false);
});

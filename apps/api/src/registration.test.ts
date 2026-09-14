import assert from "node:assert/strict";
import test from "node:test";
import { REGISTRATION_ACCEPTED, preparePendingRegistration } from "./registration.js";

test("registration acknowledgement is friendly and remains generic", () => {
  assert.equal(REGISTRATION_ACCEPTED, "Check your inbox for a verification email. It should arrive shortly.");
  assert.doesNotMatch(REGISTRATION_ACCEPTED, /account (exists|was created)|registered successfully/i);
});

test("registration prepares only an expiring pending record; it does not create an account", async () => {
  const result = await preparePendingRegistration(
    { username: "Alice", email: "ALICE@example.com", password: "correct horse battery staple" },
    { findExisting: async () => null },
    { hashPassword: async () => "password-hash", createToken: () => "raw-token", hashToken: () => "token-hash", now: () => new Date("2026-09-11T12:00:00.000Z") },
  );
  assert.deepEqual(result, { accepted: true, verificationToken: "raw-token", pending: { username: "alice", email: "alice@example.com", passwordHash: "password-hash", tokenHash: "token-hash", expiresAt: new Date("2026-09-11T13:00:00.000Z") } });
  assert.equal("session" in result, false);
  assert.equal("user" in result, false);
});

test("registration returns a generic accepted result and creates no pending data for an existing identity", async () => {
  const result = await preparePendingRegistration(
    { username: "alice", email: "alice@example.com", password: "correct horse battery staple" },
    { findExisting: async () => ({ id: "existing" }) },
    { hashPassword: async () => { throw new Error("must not hash existing identity"); }, createToken: () => "unused", hashToken: () => "unused", now: () => new Date() },
  );
  assert.deepEqual(result, { accepted: true });
});

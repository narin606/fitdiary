import assert from "node:assert/strict";
import test from "node:test";
import { createVerificationToken, hashVerificationToken, isVerificationTokenExpired } from "./verification.js";

test("verification tokens are random and only their deterministic hash is persisted", () => {
  const first = createVerificationToken();
  const second = createVerificationToken();

  assert.notEqual(first, second);
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(hashVerificationToken(first), hashVerificationToken(first));
  assert.notEqual(hashVerificationToken(first), first);
});

test("verification token expiry uses the current instant as its boundary", () => {
  const now = new Date("2026-09-11T12:00:00.000Z");

  assert.equal(isVerificationTokenExpired(new Date("2026-09-11T12:00:00.001Z"), now), false);
  assert.equal(isVerificationTokenExpired(new Date("2026-09-11T12:00:00.000Z"), now), true);
});
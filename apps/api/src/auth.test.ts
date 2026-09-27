import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "./auth.js";

test("password verification accepts valid legacy-length passwords", async () => {
  const password = "legacy";
  const stored = await hashPassword(password);
  assert.equal(await verifyPassword(stored, password), true);
  assert.equal(await verifyPassword(stored, "wrong"), false);
});

test("malformed stored hashes fail closed instead of crashing the API", async () => {
  assert.equal(await verifyPassword("malformed", "password"), false);
});

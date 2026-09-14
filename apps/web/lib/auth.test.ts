import test from "node:test";
import assert from "node:assert/strict";
import { validateLogin, validateRegistration, safeReturnTo } from "./auth.js";

test("login accepts a username or email address and requires a secure password", () => {
  assert.deepEqual(validateLogin("bad name", "short"), {
    identity: "Enter your username or email address.",
    password: "Password must be at least 10 characters.",
  });
  assert.deepEqual(validateLogin("valid_user", "long-enough"), {});
  assert.deepEqual(validateLogin("person@example.com", "long-enough"), {});
});

test("registration validates email and matching password", () => {
  assert.deepEqual(validateRegistration("fit_user", "bad", "long-enough", "different!!"), {
    email: "Enter a valid email address.",
    confirmPassword: "Passwords do not match.",
  });
});

test("return targets cannot leave FitDiary", () => {
  assert.equal(safeReturnTo("/diary?day=today"), "/diary?day=today");
  assert.equal(safeReturnTo("//evil.example"), "/");
  assert.equal(safeReturnTo("https://evil.example"), "/");
});

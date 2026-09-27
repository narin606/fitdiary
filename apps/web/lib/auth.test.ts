import test from "node:test";
import assert from "node:assert/strict";
import { validateLogin, validateRegistration, safeReturnTo } from "./auth.js";

test("login accepts a username or email address, including legacy account passwords", () => {
  assert.deepEqual(validateLogin("bad name", ""), {
    identity: "Enter your username or email address.",
    password: "Enter your password.",
  });
  assert.deepEqual(validateLogin("Brandon_1", "legacy"), {});
  assert.deepEqual(validateLogin("brandon@example.com", "long-enough-password"), {});
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

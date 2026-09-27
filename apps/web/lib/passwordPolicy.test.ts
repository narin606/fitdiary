import test from "node:test";
import assert from "node:assert/strict";
import { passwordChecks, isValidPassword } from "./passwordPolicy.js";

test("password checklist tracks all three requirements", () => {
  assert.deepEqual(passwordChecks("A1!defg"), { length: false, letter: true, numberAndSymbol: true });
  assert.deepEqual(passwordChecks("12345678!"), { length: true, letter: false, numberAndSymbol: true });
  assert.deepEqual(passwordChecks("Abcdefgh!"), { length: true, letter: true, numberAndSymbol: false });
  assert.equal(isValidPassword("Ab1!defg"), true);
  assert.equal(isValidPassword("Abcdefg1"), false);
});
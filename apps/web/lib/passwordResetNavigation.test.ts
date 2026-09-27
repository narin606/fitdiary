import test from "node:test";
import assert from "node:assert/strict";
import { PASSWORD_RESET_SUCCESS_PATH, PASSWORD_RESET_HOME_DELAY_MS } from "./passwordResetNavigation.js";

test("successful reset uses a dedicated page and returns home after 12 seconds", () => {
  assert.equal(PASSWORD_RESET_SUCCESS_PATH, "/reset-password/success");
  assert.equal(PASSWORD_RESET_HOME_DELAY_MS, 12_000);
});

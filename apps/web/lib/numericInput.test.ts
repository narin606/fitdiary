import assert from "node:assert/strict";
import test from "node:test";
import { editableNumber, numericInputValue } from "./numericInput";

test("an emptied numeric field stays empty instead of becoming zero", () => {
  const value = editableNumber("");
  assert.equal(Number.isNaN(value), true);
  assert.equal(numericInputValue(value), "");
});

test("entered decimal values remain numeric", () => {
  assert.equal(editableNumber("72.5"), 72.5);
  assert.equal(numericInputValue(72.5), 72.5);
});
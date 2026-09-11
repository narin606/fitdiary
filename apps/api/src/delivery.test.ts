import assert from "node:assert/strict";
import test from "node:test";
import { deliverVerification } from "./delivery.js";

test("verification delivery is an injectable abstraction", async () => {
  const sent: unknown[] = [];
  await deliverVerification({ email: "alice@example.com", token: "secret" }, { sendVerification: async message => { sent.push(message); } });
  assert.deepEqual(sent, [{ email: "alice@example.com", token: "secret" }]);
});
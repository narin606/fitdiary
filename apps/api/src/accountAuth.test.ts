import assert from "node:assert/strict";
import test from "node:test";
import { authenticateVerifiedAccount, verifyPendingAccount } from "./accountAuth.js";

test("verification delegates one atomic consume-and-verify operation using only the token hash", async () => {
  const calls: unknown[] = [];
  const verified = await verifyPendingAccount("raw-token", {
    hashToken: () => "token-hash",
    now: () => new Date("2026-09-11T12:00:00Z"),
    consumeAndVerify: async (tokenHash, now) => {
      calls.push({ tokenHash, now });
      return true;
    },
  });
  assert.equal(verified, true);
  assert.deepEqual(calls, [{ tokenHash: "token-hash", now: new Date("2026-09-11T12:00:00Z") }]);
});

test("login rejects unverified accounts with the same generic result as bad credentials", async () => {
  const verify = async () => true;
  assert.equal(await authenticateVerifiedAccount(undefined, "password", verify), null);
  assert.equal(await authenticateVerifiedAccount({ id: "u1", passwordHash: "hash", emailVerifiedAt: null }, "password", verify), null);
  assert.equal(await authenticateVerifiedAccount({ id: "u1", passwordHash: "hash", emailVerifiedAt: new Date() }, "password", async () => false), null);
  assert.equal((await authenticateVerifiedAccount({ id: "u1", passwordHash: "hash", emailVerifiedAt: new Date() }, "password", verify))?.id, "u1");
});
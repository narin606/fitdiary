import assert from "node:assert/strict";
import test from "node:test";
import { deliverVerification, resendDelivery } from "./delivery.js";

test("verification delivery is an injectable abstraction", async () => {
  const sent: unknown[] = [];
  await deliverVerification({ email: "alice@example.com", token: "secret" }, { sendVerification: async message => { sent.push(message); return {}; } });
  assert.deepEqual(sent, [{ email: "alice@example.com", token: "secret" }]);
});

test("Resend delivery builds FitDiary verification and reset messages", async () => {
  const requests: Array<{url:string; init:RequestInit}> = [];
  const delivery=resendDelivery({apiKey:"key",from:"FitDiary <hello@example.com>",frontendUrl:"https://fitdiary.kaehana.com",fetch:async(url,init)=>{requests.push({url:String(url),init: init!});return new Response("{}",{status:200})}});
  await delivery.sendVerification({email:"alice@example.com",token:"a token"});
  await delivery.sendPasswordReset({email:"alice@example.com",token:"reset token"});
  assert.equal(requests.length,2);
  assert.match(String(requests[0].init.body),/verify-email\?token=a%20token/);
  assert.match(String(requests[1].init.body),/reset-password\?token=reset%20token/);
  assert.equal((requests[0].init.headers as Record<string,string>).Authorization,"Bearer key");
});

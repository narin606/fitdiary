import test from "node:test";
import assert from "node:assert/strict";
import { createPasswordResetToken, hashPasswordResetToken, isValidPassword, requestPasswordReset, resetPassword } from "./passwordRecovery.js";

test("reset tokens are random and only their SHA-256 digest is persisted", async () => {
  const first=createPasswordResetToken(), second=createPasswordResetToken();
  assert.notEqual(first,second); assert.match(first,/^[A-Za-z0-9_-]{43}$/);
  assert.match(hashPasswordResetToken(first),/^[a-f0-9]{64}$/); assert.notEqual(hashPasswordResetToken(first),first);
});
test("password policy matches the frontend",()=>{assert.equal(isValidPassword("123456789"),false);assert.equal(isValidPassword("1234567890"),true);assert.equal(isValidPassword("x".repeat(129)),false)});
test("forgot password always returns generic result and stores only digest for known verified email",async()=>{let stored:any;const result=await requestPasswordReset(" USER@Example.COM ",{now:()=>new Date(0),findVerifiedUser:async email=>email==="user@example.com"?{id:"u"}:null,store:async data=>{stored=data}});assert.deepEqual(result,{accepted:true});assert.equal(stored.userId,"u");assert.match(stored.tokenHash,/^[a-f0-9]{64}$/);assert.equal(stored.expiresAt.getTime(),900000);assert.ok(result.accepted);assert.equal("token" in result,false)});
test("reset delegates an atomic consume, password update, and session revocation",async()=>{let input:any;const ok=await resetPassword("raw","1234567890",{now:()=>new Date(1),hashPassword:async()=>"$argon2id$hash",consumeUpdateAndRevoke:async data=>{input=data;return true}});assert.equal(ok,true);assert.equal(input.tokenHash,hashPasswordResetToken("raw"));assert.equal(input.passwordHash,"$argon2id$hash")});

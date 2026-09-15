import assert from "node:assert/strict";
import test from "node:test";
import { detectImage, photoObjectKey, serializeByKey } from "./photoStorage.js";

test("detectImage requires MIME and matching file signatures",()=>{
  assert.equal(detectImage("image/jpeg",Buffer.from([0xff,0xd8,0xff,0x00])),"jpg");
  assert.equal(detectImage("image/png",Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])),"png");
  assert.equal(detectImage("image/webp",Buffer.from("RIFFxxxxWEBP")),"webp");
  assert.equal(detectImage("image/jpeg",Buffer.from("not an image")),null);
  assert.equal(detectImage("text/plain",Buffer.from([0xff,0xd8,0xff])),null);
});
test("photo keys are per-user, unpredictable, and traversal-safe",()=>{
  const a=photoObjectKey("user/../one","jpg"),b=photoObjectKey("user/../one","jpg");
  assert.notEqual(a,b); assert.match(a,/^[a-f0-9]{64}\/[a-f0-9-]{36}\.jpg$/); assert.ok(!a.includes(".."));
});
test("unsupported extension cannot form a key",()=>assert.throws(()=>photoObjectKey("u","gif" as never)));
test("same-entry mutations serialize and the lock survives failure",async()=>{const events:string[]=[];let release!:()=>void;const blocked=new Promise<void>(r=>release=r);const first=serializeByKey("entry",async()=>{events.push("first-start");await blocked;events.push("first-end")});const second=serializeByKey("entry",async()=>{events.push("second")});await new Promise(r=>setTimeout(r,10));assert.deepEqual(events,["first-start"]);release();await Promise.all([first,second]);assert.deepEqual(events,["first-start","first-end","second"]);await assert.rejects(()=>serializeByKey("entry",async()=>{throw new Error("expected")}));await serializeByKey("entry",async()=>events.push("after-failure"));assert.equal(events.at(-1),"after-failure")});
test("photo replacement and whole-entry deletion cannot overlap for one entry",async()=>{const events:string[]=[];let finishReplacement!:()=>void;const replacementBlocked=new Promise<void>(resolve=>finishReplacement=resolve);const replacement=serializeByKey("replace-v-delete",async()=>{events.push("replacement-start");await replacementBlocked;events.push("replacement-finish")});const deletion=serializeByKey("replace-v-delete",async()=>events.push("entry-delete"));await new Promise(resolve=>setTimeout(resolve,10));assert.deepEqual(events,["replacement-start"]);finishReplacement();await Promise.all([replacement,deletion]);assert.deepEqual(events,["replacement-start","replacement-finish","entry-delete"])});

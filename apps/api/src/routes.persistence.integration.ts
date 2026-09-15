import assert from "node:assert/strict";
import test, { after } from "node:test";
import { db } from "./db.js";
import { hashSessionToken } from "./session.js";

const base = process.env.INTEGRATION_API_URL;
if (!base || process.env.NODE_ENV !== "test" || !process.env.DATABASE_URL?.includes("127.0.0.1:55432/fitdiary_integration")) {
  throw new Error("Integration tests require the isolated loopback PostgreSQL harness");
}

after(async () => db.$disconnect());

async function request(path:string, token:string, init:RequestInit={}) {
  const response=await fetch(`${base}${path}`,{...init,headers:{"content-type":"application/json",cookie:`fitdiary_session=${token}`,...init.headers}});
  const body=response.status===204?null:await response.json();
  return {status:response.status,body};
}
const post=(path:string,token:string,body:unknown)=>request(path,token,{method:"POST",body:JSON.stringify(body)});
const put=(path:string,token:string,body:unknown)=>request(path,token,{method:"PUT",body:JSON.stringify(body)});
const del=(path:string,token:string)=>request(path,token,{method:"DELETE"});

async function identity(name:string) {
  const user=await db.user.create({data:{username:name,email:`${name}@example.test`,emailVerifiedAt:new Date(),passwordHash:"integration-only",calorieGoal:2000,proteinGoal:120,carbGoal:220,fatGoal:65,waterGoalMl:2500}});
  const token=`${name}-session-token`;
  await db.session.create({data:{userId:user.id,tokenHash:hashSessionToken(token),expiresAt:new Date("2099-01-01T00:00:00.000Z")}});
  return {user,token};
}

test("database-backed routes enforce ownership, UTC day bounds, CRUD, aggregates, and food trust",async()=>{
  const alice=await identity("integration-alice");
  const bob=await identity("integration-bob");
  const [verifiedGlobal,unverifiedGlobal,aliceFood,bobFood]=await Promise.all([
    db.food.create({data:{name:"Verified global",source:"VERIFIED",verified:true,servingLabel:"portion",calories:1}}),
    db.food.create({data:{name:"Unverified global",source:"COMMUNITY",verified:false,servingLabel:"portion",calories:1}}),
    db.food.create({data:{ownerId:alice.user.id,name:"Alice custom",source:"CUSTOM",servingLabel:"portion",calories:1}}),
    db.food.create({data:{ownerId:bob.user.id,name:"Bob custom",source:"CUSTOM",servingLabel:"portion",calories:1}}),
  ]);
  const day="2026-09-15";
  const item={name:"Snapshot oats",servings:1.5,servingLabel:"saved bowl",calories:200.25,proteinG:10.5,carbsG:30.25,fatG:5.5};

  for(const foodId of ["unknown-food-id",bobFood.id,unverifiedGlobal.id]) {
    const rejected=await post("/diary",alice.token,{date:day,mealType:"BREAKFAST",items:[{...item,foodId}]});
    assert.equal(rejected.status,400,`food ${foodId} must fail closed`);
  }
  for(const foodId of [verifiedGlobal.id,aliceFood.id]) {
    const accepted=await post("/diary",alice.token,{date:day,mealType:"SNACK",items:[{...item,name:`Allowed ${foodId}`,foodId}]});
    assert.equal(accepted.status,201);
    await del(`/diary/${accepted.body.entry.id}`,alice.token);
  }

  const created=await post("/diary",alice.token,{date:day,mealType:"BREAKFAST",title:"Breakfast",items:[{...item,foodId:aliceFood.id}]});
  assert.equal(created.status,201);
  const diaryId=created.body.entry.id;
  assert.deepEqual({...created.body.entry.items[0],id:undefined,diaryEntryId:undefined,foodId:undefined,aiSuggested:undefined,userConfirmed:undefined},{...item,id:undefined,diaryEntryId:undefined,foodId:undefined,aiSuggested:undefined,userConfirmed:undefined});
  assert.equal(created.body.entry.items[0].foodId,aliceFood.id);

  await db.diaryEntry.create({data:{userId:alice.user.id,date:new Date("2026-09-15T23:59:59.999Z"),mealType:"LUNCH",items:{create:{name:"Boundary item",servingLabel:"unit",servings:1,calories:99,proteinG:1,carbsG:2,fatG:3}}}});
  await db.diaryEntry.create({data:{userId:alice.user.id,date:new Date("2026-09-16T00:00:00.000Z"),mealType:"LUNCH",items:{create:{name:"Next day",servingLabel:"unit",servings:1,calories:999}}}});
  await db.diaryEntry.create({data:{userId:bob.user.id,date:new Date(`${day}T12:00:00.000Z`),mealType:"DINNER",items:{create:{name:"Bob secret",servingLabel:"unit",servings:1,calories:777}}}});
  const read=await request(`/diary?date=${day}`,alice.token);
  assert.equal(read.status,200); assert.deepEqual(read.body.entries.map((e:any)=>e.items[0].name),["Snapshot oats","Boundary item"]);
  assert.equal((await request(`/diary?date=2026-09-16`,alice.token)).body.entries.length,1);
  assert.equal((await request(`/diary?date=${day}`,bob.token)).body.entries.length,1);

  assert.equal((await put(`/diary/${diaryId}`,bob.token,{date:day,mealType:"DINNER",items:[item]})).status,404);
  assert.equal((await del(`/diary/${diaryId}`,bob.token)).status,404);
  const updated=await put(`/diary/${diaryId}`,alice.token,{date:day,mealType:"DINNER",title:"Updated",items:[{...item,name:"Updated snapshot",servings:2}]});
  assert.equal(updated.status,200); assert.equal(updated.body.entry.items[0].name,"Updated snapshot");

  const definitions:any={
    water:{create:{date:day,amountMl:375},update:{date:day,amountMl:500}},
    weight:{create:{date:day,weightKg:81.25,notes:"first"},update:{date:day,weightKg:80.75,notes:"updated"}},
    exercise:{create:{date:day,name:"Walk",durationMinutes:35,caloriesBurned:175},update:{date:day,name:"Fast walk",durationMinutes:40,caloriesBurned:200}},
  };
  const ids:Record<string,string>={};
  for(const [kind,value] of Object.entries(definitions) as any) {
    const made=await post(`/tracking/${kind}`,alice.token,value.create); assert.equal(made.status,201); ids[kind]=made.body.entry.id;
    assert.equal((await request(`/tracking/${kind}?date=${day}`,alice.token)).body.entries.length,1);
    assert.equal((await request(`/tracking/${kind}?date=${day}`,bob.token)).body.entries.length,0);
    assert.equal((await put(`/tracking/${kind}/${ids[kind]}`,bob.token,value.update)).status,404);
    assert.equal((await del(`/tracking/${kind}/${ids[kind]}`,bob.token)).status,404);
    assert.equal((await put(`/tracking/${kind}/${ids[kind]}`,alice.token,value.update)).status,200);
  }

  const summary=await request(`/tracking/day-summary?date=${day}`,alice.token);
  assert.equal(summary.status,200);
  assert.deepEqual(summary.body.totals,{calories:499.5,proteinG:22,carbsG:62.5,fatG:14,waterMl:500,exerciseCalories:200,exerciseMinutes:40});
  assert.equal(summary.body.remainingCalories,1700.5);
  assert.equal(summary.body.latestWeight.id,ids.weight);
  assert.equal(summary.body.diaryEntries.length,2); assert.equal(summary.body.waterEntries.length,1); assert.equal(summary.body.exerciseEntries.length,1); assert.equal(summary.body.weightEntries.length,1);
  assert.deepEqual((await request(`/tracking/day-summary?date=${day}`,bob.token)).body.totals,{calories:777,proteinG:0,carbsG:0,fatG:0,waterMl:0,exerciseCalories:0,exerciseMinutes:0});

  assert.equal((await del(`/diary/${diaryId}`,alice.token)).status,204);
  assert.equal((await request(`/diary?date=${day}`,alice.token)).body.entries.length,1);
  for(const kind of Object.keys(ids)) {assert.equal((await del(`/tracking/${kind}/${ids[kind]}`,alice.token)).status,204);assert.equal((await request(`/tracking/${kind}?date=${day}`,alice.token)).body.entries.length,0);}
});

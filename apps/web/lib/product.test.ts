import assert from "node:assert/strict";
import test from "node:test";
import { diaryItemsForEdit, photoPath, profilePayload, sectionPath } from "./product";
test("protected product sections have stable routes",()=>{assert.equal(sectionPath("Diary"),"/diary");assert.equal(sectionPath("Foods"),"/foods");assert.equal(sectionPath("Progress"),"/progress");assert.equal(sectionPath("Settings"),"/settings")});
test("photo URL is an authenticated API route, never a durable public URL",()=>assert.equal(photoPath("entry /?"),"/diary/entry%20%2F%3F/photo"));
test("profile payload converts numeric goals",()=>assert.deepEqual(profilePayload({displayName:" A ",goalType:"LOSE",calorieGoal:"1800",proteinGoal:"130",carbGoal:"190",fatGoal:"55",waterGoalMl:"2400",units:"metric"}),{displayName:"A",goalType:"LOSE",calorieGoal:1800,proteinGoal:130,carbGoal:190,fatGoal:55,waterGoalMl:2400,units:"metric"}));
test("editing one diary item preserves every untouched item",()=>{const old=[{name:"old",servings:1},{name:"untouched",servings:2}];assert.deepEqual(diaryItemsForEdit(old,{name:"new",servings:3}),[{name:"new",servings:3},{name:"untouched",servings:2}])});

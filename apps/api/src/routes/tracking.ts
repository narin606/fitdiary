import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { aggregateDay, dayBounds, parseDay } from "../daySummary.js";
import { requireUser, type AuthedRequest } from "../middleware/requireUser.js";
export const trackingRouter=Router();trackingRouter.use(requireUser);
const dated=<T extends z.ZodRawShape>(shape:T)=>z.object({date:z.string().transform(parseDay),...shape});
const weightSchema=dated({weightKg:z.number().positive().max(500),notes:z.string().trim().max(500).optional()});
const waterSchema=dated({amountMl:z.number().int().positive().max(10000)});
const exerciseSchema=dated({name:z.string().trim().min(1).max(120),durationMinutes:z.number().int().positive().max(1440).optional(),caloriesBurned:z.number().int().nonnegative().max(10000),notes:z.string().trim().max(500).optional()});
const at=(date:string)=>new Date(`${date}T00:00:00.000Z`);
const range=(date:string)=>{const {start,end}=dayBounds(date);return {gte:start,lt:end};};
const model=(kind:string)=>kind==="weight"?db.weightEntry:kind==="water"?db.waterEntry:kind==="exercise"?db.exerciseEntry:null;
const schema=(kind:string)=>kind==="weight"?weightSchema:kind==="water"?waterSchema:kind==="exercise"?exerciseSchema:null;
for(const kind of ["weight","water","exercise"]){
  trackingRouter.get(`/${kind}`,async(req:AuthedRequest,res)=>{const date=parseDay(req.query.date);const repo=model(kind)!;const entries=await (repo as any).findMany({where:{userId:req.userId,date:range(date)},orderBy:{date:"asc"}});res.json({date,entries})});
  trackingRouter.post(`/${kind}`,async(req:AuthedRequest,res)=>{const b=schema(kind)!.parse(req.body) as any;const repo=model(kind)!;res.status(201).json({entry:await (repo as any).create({data:{...b,date:at(b.date),userId:req.userId!}})})});
  trackingRouter.put(`/${kind}/:id`,async(req:AuthedRequest,res)=>{const b=schema(kind)!.parse(req.body) as any;const repo=model(kind)!;const found=await (repo as any).findFirst({where:{id:String(req.params.id),userId:req.userId},select:{id:true}});if(!found)return res.status(404).json({error:"Entry not found"});res.json({entry:await (repo as any).update({where:{id:found.id},data:{...b,date:at(b.date)}})});});
  trackingRouter.delete(`/${kind}/:id`,async(req:AuthedRequest,res)=>{const repo=model(kind)!;const found=await (repo as any).findFirst({where:{id:String(req.params.id),userId:req.userId},select:{id:true}});if(!found)return res.status(404).json({error:"Entry not found"});await (repo as any).delete({where:{id:found.id}});res.status(204).end()});
}
trackingRouter.get("/day-summary",async(req:AuthedRequest,res)=>{const date=parseDay(req.query.date);const dateRange=range(date);const [user,diaryEntries,waterEntries,exerciseEntries,weightEntries]=await db.$transaction([
  db.user.findUniqueOrThrow({where:{id:req.userId},select:{calorieGoal:true,proteinGoal:true,carbGoal:true,fatGoal:true,waterGoalMl:true}}),
  db.diaryEntry.findMany({where:{userId:req.userId,date:dateRange},include:{items:true},orderBy:{createdAt:"asc"}}),
  db.waterEntry.findMany({where:{userId:req.userId,date:dateRange},orderBy:{date:"asc"}}),
  db.exerciseEntry.findMany({where:{userId:req.userId,date:dateRange},orderBy:{date:"asc"}}),
  db.weightEntry.findMany({where:{userId:req.userId,date:dateRange},orderBy:{date:"asc"}}),
]);const summary=aggregateDay({date,goals:{calories:user.calorieGoal,proteinG:user.proteinGoal,carbsG:user.carbGoal,fatG:user.fatGoal,waterMl:user.waterGoalMl},diaryEntries,waterEntries,exerciseEntries,weightEntries});res.json({...summary,diaryEntries,waterEntries,exerciseEntries,weightEntries});});

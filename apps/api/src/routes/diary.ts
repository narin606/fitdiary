import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { dayBounds, parseDay } from "../daySummary.js";
import { requireUser, type AuthedRequest } from "../middleware/requireUser.js";

export const diaryRouter=Router(); diaryRouter.use(requireUser);
const itemSchema=z.object({foodId:z.string().optional(),name:z.string().trim().min(1).max(200),servings:z.number().positive().max(1000).default(1),servingLabel:z.string().trim().min(1).max(100).default("serving"),calories:z.number().nonnegative().max(100000),proteinG:z.number().nonnegative().max(10000).default(0),carbsG:z.number().nonnegative().max(10000).default(0),fatG:z.number().nonnegative().max(10000).default(0)});
const entrySchema=z.object({date:z.string().transform(parseDay),mealType:z.enum(["BREAKFAST","LUNCH","DINNER","SNACK"]),title:z.string().trim().min(1).max(120).optional(),notes:z.string().trim().max(1000).optional(),items:z.array(itemSchema).min(1).max(100)});
const dates=(date:string)=>{const {start,end}=dayBounds(date);return {gte:start,lt:end};};
async function foodIdsAllowed(userId:string,items:z.infer<typeof itemSchema>[]){
  const ids=[...new Set(items.flatMap(item=>item.foodId?[item.foodId]:[]))];
  if(!ids.length)return true;
  const count=await db.food.count({where:{id:{in:ids},OR:[{ownerId:null,verified:true,source:"VERIFIED"},{ownerId:userId,source:"CUSTOM"}]}});
  return count===ids.length;
}

diaryRouter.get("/",async(req:AuthedRequest,res)=>{const date=parseDay(req.query.date);const entries=await db.diaryEntry.findMany({where:{userId:req.userId,date:dates(date)},include:{items:true},orderBy:{createdAt:"asc"}});res.json({date,entries})});
diaryRouter.post("/",async(req:AuthedRequest,res)=>{const body=entrySchema.parse(req.body);if(!await foodIdsAllowed(req.userId!,body.items))return res.status(400).json({error:"Invalid food reference"});const entry=await db.diaryEntry.create({data:{userId:req.userId!,date:new Date(`${body.date}T00:00:00.000Z`),mealType:body.mealType,title:body.title,notes:body.notes,items:{create:body.items}},include:{items:true}});res.status(201).json({entry})});
diaryRouter.put("/:id",async(req:AuthedRequest,res)=>{const body=entrySchema.parse(req.body);const found=await db.diaryEntry.findFirst({where:{id:String(req.params.id),userId:req.userId},select:{id:true}});if(!found)return res.status(404).json({error:"Entry not found"});if(!await foodIdsAllowed(req.userId!,body.items))return res.status(400).json({error:"Invalid food reference"});const entry=await db.$transaction(async tx=>{await tx.diaryItem.deleteMany({where:{diaryEntryId:found.id}});return tx.diaryEntry.update({where:{id:found.id},data:{date:new Date(`${body.date}T00:00:00.000Z`),mealType:body.mealType,title:body.title,notes:body.notes,items:{create:body.items}},include:{items:true}})});res.json({entry})});
diaryRouter.delete("/:id",async(req:AuthedRequest,res)=>{const found=await db.diaryEntry.findFirst({where:{id:String(req.params.id),userId:req.userId},select:{id:true}});if(!found)return res.status(404).json({error:"Entry not found"});await db.diaryEntry.delete({where:{id:found.id}});res.status(204).end()});

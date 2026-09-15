import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requireUser,type AuthedRequest } from "../middleware/requireUser.js";
export const profileRouter=Router();profileRouter.use(requireUser);
const select={username:true,email:true,displayName:true,goalType:true,calorieGoal:true,proteinGoal:true,carbGoal:true,fatGoal:true,waterGoalMl:true,units:true} as const;
const body=z.object({displayName:z.string().trim().max(100).nullable().optional(),goalType:z.enum(["LOSE","MAINTAIN","GAIN"]),calorieGoal:z.number().int().min(500).max(10000),proteinGoal:z.number().int().min(0).max(1000),carbGoal:z.number().int().min(0).max(2000),fatGoal:z.number().int().min(0).max(1000),waterGoalMl:z.number().int().min(0).max(20000),units:z.enum(["metric","imperial"])});
profileRouter.get("/",async(req:AuthedRequest,res)=>res.json({profile:await db.user.findUniqueOrThrow({where:{id:req.userId},select})}));
profileRouter.put("/",async(req:AuthedRequest,res)=>res.json({profile:await db.user.update({where:{id:req.userId},data:body.parse(req.body),select})}));
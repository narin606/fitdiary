import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requireUser, type AuthedRequest } from "../middleware/requireUser.js";
export const trackingRouter=Router();trackingRouter.use(requireUser);
trackingRouter.post("/weight",async(req:AuthedRequest,res)=>{const b=z.object({date:z.coerce.date(),weightKg:z.number().positive().max(500),notes:z.string().max(500).optional()}).parse(req.body);res.status(201).json({entry:await db.weightEntry.create({data:{...b,userId:req.userId!}})})});
trackingRouter.post("/water",async(req:AuthedRequest,res)=>{const b=z.object({date:z.coerce.date(),amountMl:z.number().int().positive().max(10000)}).parse(req.body);res.status(201).json({entry:await db.waterEntry.create({data:{...b,userId:req.userId!}})})});
trackingRouter.post("/exercise",async(req:AuthedRequest,res)=>{const b=z.object({date:z.coerce.date(),name:z.string().min(1).max(120),durationMinutes:z.number().int().positive().optional(),caloriesBurned:z.number().int().nonnegative(),notes:z.string().max(500).optional()}).parse(req.body);res.status(201).json({entry:await db.exerciseEntry.create({data:{...b,userId:req.userId!}})})});

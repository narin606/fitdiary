import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requireUser, type AuthedRequest } from "../middleware/requireUser.js";
export const foodsRouter=Router();foodsRouter.use(requireUser);
foodsRouter.get("/search",async(req:AuthedRequest,res)=>{const q=z.string().trim().min(1).parse(req.query.q);const own=await db.food.findMany({where:{name:{contains:q,mode:"insensitive"},OR:[{ownerId:req.userId},{ownerId:null}]},take:30,orderBy:[{verified:"desc"},{name:"asc"}]});res.json({foods:own,externalProviderPending:true})});
foodsRouter.post("/",async(req:AuthedRequest,res)=>{const b=z.object({name:z.string().min(1),brand:z.string().optional(),servingLabel:z.string(),servingGrams:z.number().positive().optional(),calories:z.number().nonnegative(),proteinG:z.number().nonnegative().default(0),carbsG:z.number().nonnegative().default(0),fatG:z.number().nonnegative().default(0)}).parse(req.body);res.status(201).json({food:await db.food.create({data:{...b,ownerId:req.userId!,source:"CUSTOM"}})})});

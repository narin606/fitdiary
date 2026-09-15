import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requireUser, type AuthedRequest } from "../middleware/requireUser.js";
export const foodsRouter=Router();foodsRouter.use(requireUser);
foodsRouter.get("/search",async(req:AuthedRequest,res)=>{const q=z.string().trim().min(1).parse(req.query.q);const own=await db.food.findMany({where:{name:{contains:q,mode:"insensitive"},OR:[{ownerId:req.userId,source:"CUSTOM"},{ownerId:null,source:"VERIFIED",verified:true}]},take:30,orderBy:[{verified:"desc"},{name:"asc"}]});res.json({foods:own,externalProviderPending:true})});
foodsRouter.post("/",async(req:AuthedRequest,res)=>{const b=z.object({name:z.string().min(1),brand:z.string().optional(),servingLabel:z.string(),servingGrams:z.number().positive().optional(),calories:z.number().nonnegative(),proteinG:z.number().nonnegative().default(0),carbsG:z.number().nonnegative().default(0),fatG:z.number().nonnegative().default(0)}).parse(req.body);res.status(201).json({food:await db.food.create({data:{...b,ownerId:req.userId!,source:"CUSTOM"}})})});
foodsRouter.get("/",async(req:AuthedRequest,res)=>res.json({foods:await db.food.findMany({where:{ownerId:req.userId,source:"CUSTOM"},orderBy:{name:"asc"}})}));
foodsRouter.delete("/:id",async(req:AuthedRequest,res)=>{const food=await db.food.findFirst({where:{id:String(req.params.id),ownerId:req.userId,source:"CUSTOM"},select:{id:true}});if(!food)return res.status(404).json({error:"Food not found"});await db.food.delete({where:{id:food.id}});res.status(204).end()});

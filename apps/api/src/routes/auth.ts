import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { env } from "../config.js";
import { hashPassword, signSession, verifyPassword } from "../auth.js";
import { requireUser, type AuthedRequest } from "../middleware/requireUser.js";

export const authRouter=Router();
const credentials=z.object({username:z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),password:z.string().min(10).max(128),email:z.string().email().optional()});
const cookie={httpOnly:true,secure:env.NODE_ENV==="production",sameSite:"lax" as const,maxAge:30*86400000,path:"/",domain:env.COOKIE_DOMAIN};

authRouter.post("/register",async(req,res)=>{const parsed=credentials.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:"Invalid registration details",details:parsed.error.flatten()});const username=parsed.data.username.toLowerCase();if(await db.user.findFirst({where:{OR:[{username},{email:parsed.data.email}]}}))return res.status(409).json({error:"Username or email is already registered"});const user=await db.user.create({data:{username,email:parsed.data.email,passwordHash:await hashPassword(parsed.data.password)}});res.cookie("fitdiary_session",await signSession(user.id),cookie).status(201).json({user:{id:user.id,username:user.username,email:user.email}})});
authRouter.post("/login",async(req,res)=>{const parsed=credentials.pick({username:true,password:true}).safeParse(req.body);if(!parsed.success)return res.status(400).json({error:"Invalid credentials"});const user=await db.user.findUnique({where:{username:parsed.data.username.toLowerCase()}});if(!user||!(await verifyPassword(user.passwordHash,parsed.data.password)))return res.status(401).json({error:"Invalid credentials"});res.cookie("fitdiary_session",await signSession(user.id),cookie).json({user:{id:user.id,username:user.username,email:user.email}})});
authRouter.post("/logout",(_req,res)=>res.clearCookie("fitdiary_session",cookie).status(204).end());
authRouter.get("/me",requireUser,async(req:AuthedRequest,res)=>{const user=await db.user.findUnique({where:{id:req.userId},select:{id:true,username:true,email:true,displayName:true,calorieGoal:true,proteinGoal:true,carbGoal:true,fatGoal:true,waterGoalMl:true,units:true}});res.json({user})});

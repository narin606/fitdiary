import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { env } from "../config.js";
import { hashPassword, signSession, verifyPassword } from "../auth.js";
import { registerPendingAccount } from "../registration.js";
import { createVerificationToken, hashVerificationToken } from "../verification.js";
import { requireUser, type AuthedRequest } from "../middleware/requireUser.js";
import { authenticateVerifiedAccount, verifyPendingAccount } from "../accountAuth.js";

export const authRouter=Router();
const credentials=z.object({username:z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),password:z.string().min(10).max(128),email:z.string().trim().email()});
const cookie={httpOnly:true,secure:env.NODE_ENV==="production",sameSite:"lax" as const,maxAge:30*86400000,path:"/",domain:env.COOKIE_DOMAIN};

authRouter.post("/register",async(req,res)=>{const parsed=credentials.safeParse(req.body);if(!parsed.success)return res.status(400).json({error:"Invalid registration details",details:parsed.error.flatten()});await registerPendingAccount(parsed.data,{findExisting:({username,email})=>db.user.findFirst({where:{OR:[{username},{email}]},select:{id:true}}),createPending:async account=>{await db.user.create({data:{username:account.username,email:account.email,passwordHash:account.passwordHash,emailVerificationTokens:{create:{tokenHash:account.tokenHash,expiresAt:account.expiresAt}}}})}},{hashPassword,createToken:createVerificationToken,hashToken:hashVerificationToken,now:()=>new Date()});return res.status(202).json({message:"If the details can be registered, verification instructions will be sent."})});
authRouter.post("/verify-email",async(req,res)=>{const parsed=z.object({token:z.string().min(1).max(512)}).safeParse(req.body);if(!parsed.success)return res.status(400).json({error:"Invalid or expired verification link"});const verified=await verifyPendingAccount(parsed.data.token,{hashToken:hashVerificationToken,now:()=>new Date(),consumeAndVerify:async(tokenHash,now)=>db.$transaction(async tx=>{const token=await tx.emailVerificationToken.findFirst({where:{tokenHash,consumedAt:null,expiresAt:{gt:now}}});if(!token)return false;const consumed=await tx.emailVerificationToken.updateMany({where:{id:token.id,consumedAt:null,expiresAt:{gt:now}},data:{consumedAt:now}});if(consumed.count!==1)return false;await tx.user.update({where:{id:token.userId},data:{emailVerifiedAt:now}});return true})});if(!verified)return res.status(400).json({error:"Invalid or expired verification link"});return res.json({message:"Email verified. You can now log in."})});
authRouter.post("/login",async(req,res)=>{const parsed=credentials.pick({username:true,password:true}).safeParse(req.body);if(!parsed.success)return res.status(400).json({error:"Invalid credentials"});const found=await db.user.findUnique({where:{username:parsed.data.username.toLowerCase()}});const user=await authenticateVerifiedAccount(found,parsed.data.password,verifyPassword);if(!user)return res.status(401).json({error:"Invalid credentials"});res.cookie("fitdiary_session",await signSession(user.id),cookie).json({user:{id:user.id,username:user.username,email:user.email}})});
authRouter.post("/logout",(_req,res)=>res.clearCookie("fitdiary_session",cookie).status(204).end());
authRouter.get("/me",requireUser,async(req:AuthedRequest,res)=>{const user=await db.user.findUnique({where:{id:req.userId},select:{id:true,username:true,email:true,displayName:true,calorieGoal:true,proteinGoal:true,carbGoal:true,fatGoal:true,waterGoalMl:true,units:true}});res.json({user})});

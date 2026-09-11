import type { NextFunction, Request, Response } from "express";
import { db } from "../db.js";
import { hashSessionToken } from "../session.js";

export interface AuthedRequest extends Request { userId?: string }
export async function requireUser(req:AuthedRequest,res:Response,next:NextFunction){
  const token=req.cookies?.fitdiary_session;
  if(!token) return res.status(401).json({error:"Authentication required"});
  const session=await db.session.findFirst({where:{tokenHash:hashSessionToken(token),revokedAt:null,expiresAt:{gt:new Date()}},select:{userId:true}});
  if(!session) return res.status(401).json({error:"Authentication required"});
  req.userId=session.userId; next();
}

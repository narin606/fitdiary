import type { NextFunction, Request, Response } from "express";
import { verifySession } from "../auth.js";

export interface AuthedRequest extends Request { userId?: string }
export async function requireUser(req:AuthedRequest,res:Response,next:NextFunction){
  const userId=await verifySession(req.cookies?.fitdiary_session);
  if(!userId) return res.status(401).json({error:"Authentication required"});
  req.userId=userId; next();
}

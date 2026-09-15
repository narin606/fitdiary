import { Router } from "express";
import { Prisma } from "@prisma/client";
import { db } from "../db.js";
import { env } from "../config.js";
import { requireUser, type AuthedRequest } from "../middleware/requireUser.js";
import { contentTypeFor, loadPhoto } from "../photoStorage.js";
import { analyzePhoto, AnalysisProviderError, SlidingWindowLimiter } from "../analysisService.js";

const limiter = new SlidingWindowLimiter(5, 60_000);
export const analysisRouter=Router();
analysisRouter.use(requireUser);

analysisRouter.post("/:entryId",async(req:AuthedRequest,res)=>{
  const entry=await db.diaryEntry.findFirst({
    where:{id:String(req.params.entryId),userId:req.userId},
    select:{id:true,photoKey:true,analysisStatus:true},
  });
  if(!entry)return res.status(404).json({error:"Meal entry not found"});
  if(!entry.photoKey)return res.status(400).json({error:"Attach a photo before requesting analysis"});
  if(!env.AI_API_KEY||!env.AI_BASE_URL)return res.status(503).json({error:"AI analysis is not configured"});
  if(entry.analysisStatus==="PENDING")return res.status(409).json({error:"Analysis is already in progress"});
  if(!limiter.take(req.userId!))return res.status(429).set("Retry-After","60").json({error:"Too many analysis requests; try again later"});

  let image:Buffer;
  try { image=await loadPhoto(env.UPLOAD_DIR,entry.photoKey); }
  catch { return res.status(404).json({error:"Photo data is unavailable"}); }

  const claimed=await db.diaryEntry.updateMany({
    where:{id:entry.id,userId:req.userId,photoKey:entry.photoKey,analysisStatus:{not:"PENDING"}},
    data:{analysisStatus:"PENDING",aiRawEstimate:Prisma.DbNull},
  });
  if(claimed.count!==1)return res.status(409).json({error:"Analysis is already in progress or the photo changed"});
  try {
    const analysis=await analyzePhoto({baseUrl:env.AI_BASE_URL,apiKey:env.AI_API_KEY,model:env.AI_VISION_MODEL,image,contentType:contentTypeFor(entry.photoKey),timeoutMs:15_000});
    const saved=await db.diaryEntry.updateMany({where:{id:entry.id,userId:req.userId,photoKey:entry.photoKey,analysisStatus:"PENDING"},data:{analysisStatus:"COMPLETE",aiRawEstimate:analysis}});
    if(saved.count!==1)return res.status(409).json({error:"Photo changed while analysis was in progress"});
    return res.json({analysis,requiresConfirmation:true});
  } catch(error) {
    await db.diaryEntry.updateMany({where:{id:entry.id,userId:req.userId,photoKey:entry.photoKey,analysisStatus:"PENDING"},data:{analysisStatus:"FAILED",aiRawEstimate:Prisma.DbNull}});
    const kind=error instanceof AnalysisProviderError?error.kind:"provider";
    if(kind==="timeout")return res.status(504).json({error:"AI analysis timed out; try again later"});
    return res.status(502).json({error:kind==="malformed"?"AI provider returned an invalid analysis":"AI provider failed; try again later"});
  }
});

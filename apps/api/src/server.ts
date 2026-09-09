import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { diaryRouter } from "./routes/diary.js";
import { trackingRouter } from "./routes/tracking.js";
import { foodsRouter } from "./routes/foods.js";
import { analysisRouter } from "./routes/analysis.js";

const app=express();
app.set("trust proxy",1);app.use(helmet());app.use(cors({origin:env.FRONTEND_URL,credentials:true}));app.use(express.json({limit:"1mb"}));app.use(cookieParser());
app.get("/health",(_req,res)=>res.json({ok:true,service:"fitdiary-api"}));
app.use("/auth",authRouter);app.use("/diary",diaryRouter);app.use("/tracking",trackingRouter);app.use("/foods",foodsRouter);app.use("/analysis",analysisRouter);
app.use((err:any,_req:any,res:any,_next:any)=>{console.error(err);if(err?.name==="ZodError")return res.status(400).json({error:"Invalid request",details:err.flatten()});res.status(500).json({error:"Unexpected server error"})});
app.listen(env.PORT,()=>console.log(`FitDiary API listening on ${env.PORT}`));

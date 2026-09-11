import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development","test","production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  COOKIE_DOMAIN: z.string().optional(),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM: z.string().min(3),
  AI_BASE_URL: z.string().url().optional(),
  AI_API_KEY: z.string().optional(),
  AI_VISION_MODEL: z.string().default("gpt-4.1-mini"),
});

export const env = schema.parse(process.env);

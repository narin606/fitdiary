import { createHash, randomBytes } from "node:crypto";

export const createVerificationToken = () => randomBytes(32).toString("base64url");

export const hashVerificationToken = (token: string) =>
  createHash("sha256").update(token, "utf8").digest("hex");

export const isVerificationTokenExpired = (expiresAt: Date, now = new Date()) =>
  expiresAt.getTime() <= now.getTime();
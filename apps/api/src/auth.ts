import argon2 from "argon2";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./config.js";

const key = new TextEncoder().encode(env.JWT_SECRET);
export const hashPassword = (password:string) => argon2.hash(password, { type: argon2.argon2id });
export const verifyPassword = (hash:string,password:string) => argon2.verify(hash,password);
export const signSession = (userId:string) => new SignJWT({sub:userId}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("30d").sign(key);
export async function verifySession(token?:string){ if(!token) return null; try{return (await jwtVerify(token,key)).payload.sub ?? null}catch{return null} }

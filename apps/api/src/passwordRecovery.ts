import { createHash, randomBytes } from "node:crypto";

export const PASSWORD_RESET_TTL_MS=15*60*1000;
export const PASSWORD_RESET_ACCEPTED="If an eligible account exists, password reset instructions will be sent.";
export const PASSWORD_RESET_INVALID="Invalid or expired password reset link.";
export function createPasswordResetToken(){return randomBytes(32).toString("base64url")}
export function hashPasswordResetToken(token:string){return createHash("sha256").update(token).digest("hex")}
export function isValidPassword(password:string){return password.length>=10&&password.length<=128}
export async function requestPasswordReset(email:string,deps:{now:()=>Date;findVerifiedUser:(email:string)=>Promise<{id:string}|null>;store:(data:{userId:string;tokenHash:string;expiresAt:Date})=>Promise<void>}){
  const user=await deps.findVerifiedUser(email.trim().toLowerCase());
  if(user){const token=createPasswordResetToken();await deps.store({userId:user.id,tokenHash:hashPasswordResetToken(token),expiresAt:new Date(deps.now().getTime()+PASSWORD_RESET_TTL_MS)});return {accepted:true as const}}
  return {accepted:true as const};
}
export async function resetPassword(token:string,password:string,deps:{now:()=>Date;hashPassword:(password:string)=>Promise<string>;consumeUpdateAndRevoke:(data:{tokenHash:string;passwordHash:string;now:Date})=>Promise<boolean>}){
  if(!token||!isValidPassword(password))return false;
  return deps.consumeUpdateAndRevoke({tokenHash:hashPasswordResetToken(token),passwordHash:await deps.hashPassword(password),now:deps.now()});
}

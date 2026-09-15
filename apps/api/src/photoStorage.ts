import { createHash,randomUUID } from "node:crypto";
import { mkdir,readFile,rm,writeFile } from "node:fs/promises";
import { resolve,sep } from "node:path";
export type ImageExtension="jpg"|"png"|"webp";
export const MAX_PHOTO_BYTES=5*1024*1024;
export function detectImage(mime:string,b:Buffer):ImageExtension|null {
 if(mime==="image/jpeg"&&b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return "jpg";
 if(mime==="image/png"&&b.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))return "png";
 if(mime==="image/webp"&&b.length>=12&&b.toString("ascii",0,4)==="RIFF"&&b.toString("ascii",8,12)==="WEBP")return "webp";
 return null;
}
export function photoObjectKey(userId:string,ext:ImageExtension){if(!["jpg","png","webp"].includes(ext))throw new Error("Unsupported image");return `${createHash("sha256").update(userId).digest("hex")}/${randomUUID()}.${ext}`}
function safe(root:string,key:string){const path=resolve(root,key),base=resolve(root)+sep;if(!path.startsWith(base))throw new Error("Invalid photo key");return path}
export async function storePhoto(root:string,key:string,data:Buffer){const path=safe(root,key);await mkdir(resolve(path,".."),{recursive:true,mode:0o700});await writeFile(path,data,{mode:0o600})}
export const loadPhoto=(root:string,key:string)=>readFile(safe(root,key));
export const removePhoto=(root:string,key:string)=>rm(safe(root,key),{force:true});
export const contentTypeFor=(key:string)=>key.endsWith(".png")?"image/png":key.endsWith(".webp")?"image/webp":"image/jpeg";
const keyedOperations=new Map<string,Promise<void>>();
export async function serializeByKey<T>(key:string,operation:()=>Promise<T>):Promise<T>{const previous=keyedOperations.get(key)??Promise.resolve();let release!:()=>void;const current=new Promise<void>(resolve=>release=resolve);keyedOperations.set(key,current);await previous.catch(()=>undefined);try{return await operation()}finally{release();if(keyedOperations.get(key)===current)keyedOperations.delete(key)}}

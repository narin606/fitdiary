import { api,apiBaseUrl } from "./api";
export const foodsApi={list:()=>api<{foods:any[]}>("/foods"),search:(q:string)=>api<{foods:any[]}>(`/foods/search?q=${encodeURIComponent(q)}`),create:(body:unknown)=>api<{food:any}>("/foods",{method:"POST",body:JSON.stringify(body)}),remove:(id:string)=>api<void>(`/foods/${encodeURIComponent(id)}`,{method:"DELETE"})};
export const profileApi={get:()=>api<{profile:any}>("/profile"),save:(body:unknown)=>api<{profile:any}>("/profile",{method:"PUT",body:JSON.stringify(body)})};
export const uploadPhoto=(id:string,file:File)=>{const body=new FormData();body.append("photo",file);return api<{photoPath:string;analysis:{enabled:false}}>(`/diary/${encodeURIComponent(id)}/photo`,{method:"PUT",body})};
export const privatePhotoUrl=(id:string)=>`${apiBaseUrl}/diary/${encodeURIComponent(id)}/photo`;
export const deletePhoto=(id:string)=>api<void>(`/diary/${encodeURIComponent(id)}/photo`,{method:"DELETE"});
"use client";
import { usePathname, useRouter } from "next/navigation"; import { useEffect } from "react"; import { useAuth } from "../contexts/AuthContext";
export function ProtectedRoute({children}:{children:React.ReactNode}){
  const{user,loading}=useAuth();const router=useRouter();const path=usePathname();
  useEffect(()=>{if(!loading&&!user)router.replace(`/login?returnTo=${encodeURIComponent(path)}`)},[loading,user,router,path]);
  // An account that never finished setup is sent to the wizard before it can use the app.
  const needsSetup=Boolean(user)&&user!.onboarded===false&&path!=="/onboarding";
  useEffect(()=>{if(needsSetup)router.replace("/onboarding")},[needsSetup,router]);
  if(loading||!user)return <main className="protected-loading" role="status" aria-live="polite">Loading your diary…</main>;
  if(needsSetup)return <main className="protected-loading" role="status" aria-live="polite">Setting up your account…</main>;
  return children;
}
export function LogoutButton(){const{logout}=useAuth();const router=useRouter();return <button className="logout-button" onClick={async()=>{await logout();router.replace("/login")}}>Log out</button>}

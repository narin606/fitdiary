"use client";
import Link from "next/link";import { usePathname } from "next/navigation";import { LogoutButton } from "./ProtectedRoute";
const links=[["Today","/"],["Diary","/diary"],["Foods","/foods"],["Progress","/progress"],["Settings","/settings"]];
export function ProductNav(){const path=usePathname();if(path==="/"||path==="/onboarding")return null;return <nav className="product-nav" aria-label="Product navigation">{links.map(([n,p])=><Link key={p} href={p} aria-current={path===p?"page":undefined}>{n}</Link>)}<LogoutButton/></nav>}
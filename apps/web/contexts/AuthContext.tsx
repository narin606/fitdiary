"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, type User } from "../lib/api";
type AuthValue = { user: User | null; loading: boolean; login(username: string, password: string): Promise<User>; register(username: string, email: string, password: string): Promise<string>; logout(): Promise<void>; refresh(): Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setLoading(true); try { setUser((await authApi.me()).user); } catch { setUser(null); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const login = useCallback(async (username: string, password: string) => { setLoading(true); try { const next = (await authApi.login(username, password)).user; setUser(next); return next; } finally { setLoading(false); } }, []);
  const register = useCallback(async (username: string, email: string, password: string) => (await authApi.register(username, email, password)).message, []);
  const logout = useCallback(async () => { try { await authApi.logout(); } finally { setUser(null); } }, []);
  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading, login, register, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used within AuthProvider"); return value; }

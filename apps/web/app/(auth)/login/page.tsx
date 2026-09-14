"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { safeReturnTo, validateLogin, type FieldErrors } from "../../../lib/auth";
import { AuthCard, Field } from "../../../components/AuthCard";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const next = validateLogin(identity, password);
    setErrors(next); setMessage("");
    if (Object.keys(next).length) return;
    setBusy(true);
    try { await login(identity.trim(), password); router.replace(safeReturnTo(new URLSearchParams(window.location.search).get("returnTo"))); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Unable to log in."); }
    finally { setBusy(false); }
  }
  return <AuthCard title="Welcome back" subtitle="Log in to continue to your diary."><form onSubmit={submit} noValidate><Field label="Username or email" value={identity} set={setIdentity} error={errors.identity} auto="username"/><Field label="Password" type="password" value={password} set={setPassword} error={errors.password} auto="current-password"/><div className="form-meta"><label><input type="checkbox"/> Remember me</label><Link href="/forgot-password">Forgot password?</Link></div>{message&&<p className="auth-alert" role="alert">{message}</p>}<button className="auth-submit" disabled={busy}>{busy?"Logging in…":"Log in"}</button></form><p className="auth-switch">New to FitDiary? <Link href="/register">Create an account</Link></p></AuthCard>;
}

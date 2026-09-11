import Link from "next/link";
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="auth-shell"><section className="auth-story"><Link className="auth-brand" href="/">🔥 <span>FitDiary</span></Link><div><p className="eyebrow">FOOD, WITHOUT THE FRICTION</p><h1>Build healthier days,<br/>one honest entry at a time.</h1><p>A private nutrition diary that keeps logging simple and puts AI in your control.</p></div><small>Private by default · AI only when you ask</small></section><section className="auth-panel">{children}</section></main>;
}
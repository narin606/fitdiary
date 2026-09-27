"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "../../../../components/AuthCard";
import { PASSWORD_RESET_HOME_DELAY_MS } from "../../../../lib/passwordResetNavigation";

export default function PasswordResetSuccess() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(PASSWORD_RESET_HOME_DELAY_MS / 1000);

  useEffect(() => {
    const redirect = window.setTimeout(() => router.replace("/"), PASSWORD_RESET_HOME_DELAY_MS);
    const countdown = window.setInterval(() => setSeconds(current => Math.max(0, current - 1)), 1000);
    return () => {
      window.clearTimeout(redirect);
      window.clearInterval(countdown);
    };
  }, [router]);

  return (
    <AuthCard title="Password reset successful" subtitle="Your new password is ready to use.">
      <div className="reset-success" role="status">
        <div className="reset-success-mark" aria-hidden="true">✓</div>
        <p>You can <Link href="/login">log in</Link> now.</p>
        <p className="auth-hint">Returning to the FitDiary homepage in {seconds} seconds.</p>
        <Link className="auth-submit auth-submit-link" href="/login">Log in</Link>
      </div>
    </AuthCard>
  );
}

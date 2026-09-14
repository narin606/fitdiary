# FitDiary progress

## 2026-09-15 — pending-only account activation and delivery recovery

- Security model: a registration no longer creates a `User`. It creates only an expiring `PendingRegistration` containing the Argon2id password hash and SHA-256 verification-token hash. The verification endpoint conditionally consumes the delivered pending token and creates a `User` with `emailVerifiedAt` in the same transaction.
- Abuse controls: valid registration responses remain generic; verified/pending identity collisions do not send another email or create an account. Registration is throttled per source IP, username, and email in a fifteen-minute window. Failed email delivery removes the pending registration; therefore delivery failure cannot reserve an account identity.
- Delivery diagnostics: Resend outcomes emit structured, redacted status/category and provider-message-ID events. Secrets, recipient addresses, passwords, and raw tokens are not logged.
- Schema: replaced the pre-account `EmailVerificationToken` relation with `PendingRegistration`. The additive production migration removes obsolete pre-account tokens and introduces pending-record uniqueness and expiry indexes.
- Local deterministic evidence: Prisma Client generation, API TypeScript build, API unit tests (14/14), frontend production build, and `git diff --check` passed. A disposable PostgreSQL 16 database applied both migrations from empty to latest and validated the resulting `User` + `PendingRegistration` schema; no `EmailVerificationToken` table remained.
- Production maintenance completed with explicit authorization: archived the former FitDiary named database volume at `/home/brandon/backups/fitdiary/` (SHA-256 recorded in the maintenance transcript), removed only that FitDiary volume, then rebuilt/recreated only `fitdiary-prod` with `.env.production`—no broad Docker cleanup and no other app touched. The new database is empty (`User=0`, `PendingRegistration=0`) before the controlled flow; API and DB are healthy, the expected named volume is attached, and the live PostgreSQL/API configuration fingerprints match `.env.production`.
- Controlled live delivery: Resend accepted one owner-mailbox verification request (provider message ID recorded only in redacted service logs). The public registration endpoint returned the generic `202` response; immediately afterward `User=0` and `PendingRegistration=1`, proving a registration does not create an account before the link is consumed. Inbox receipt and link-click activation remain the final user-operated E2E gate.
- Login identity update: usernames remain canonicalized lowercase and database-unique for both pending and verified records. Login now accepts either that unique username or the verified, database-unique email address plus password; the client label/validation and request contract use `Username or email`. API tests (14/14), web tests (3/3), API/web production builds, and whitespace validation passed before release.

## Historical record

Previous entries documented the retired pre-account verification design. They are superseded by the 2026-09-15 pending-only activation model above.

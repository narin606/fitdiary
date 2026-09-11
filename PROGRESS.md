# FitDiary progress

## 2026-09-11 — account verification foundation

- Scope: started the secure email-verification registration gate with a persisted, expiring, single-use-capable token model and cryptographic token helpers.
- TDD evidence: `npm run test -w @fitdiary/api` first failed with `ERR_MODULE_NOT_FOUND` for `verification.js`, proving the missing behavior.
- Security boundary: helpers now generate 256-bit URL-safe random tokens and SHA-256 hashes; raw verification tokens are not represented in the database schema. Only a unique hash, expiry, and optional consumption timestamp are persisted.
- Deterministic gates: Prisma schema validation passed; full web/API production build passed; focused token tests passed 2/2; `git diff --check` passed.
- Build hygiene: normalized the pre-existing invalid one-line Prisma block declarations and resolved Express 5 route-param typing errors exposed by the full build.
- Deployment state: source-only; no production schema mutation or deployment was performed.
- Remaining release gate: generic registration, email delivery, atomic verification, unverified-login rejection, password reset, frontend flows, and isolated-database E2E.

## 2026-09-11 — pending-account registration slice

- Scope: registration now requires an email address, normalizes identity fields, creates an unverified account and an expiring hashed verification-token record in one database write, returns the same accepted response for new and existing identities, and does not create a session.
- TDD evidence: the focused registration test first failed with `ERR_MODULE_NOT_FOUND` for the intentionally absent registration module; after the minimal implementation, all API tests passed 4/4.
- Security boundary: raw verification tokens are returned only inside the registration service for the future delivery adapter and are neither stored nor exposed by the HTTP response. Existing-identity requests perform no password hashing or database write.
- Deterministic gates: Prisma schema validation passed; API tests passed 4/4; full web/API production build and TypeScript checking passed; `git diff --check` passed.
- Deployment state: source-only; the migration was not applied to any database and no deployment was performed.
- Remaining release gate: email delivery, atomic verification, verified-only login, revocable sessions/logout, password reset, request protections, frontend auth routes, disposable-database integration tests, and deployed desktop/mobile E2E.
- Next milestone: implement atomic single-use email verification and verified-only login against a disposable PostgreSQL database.

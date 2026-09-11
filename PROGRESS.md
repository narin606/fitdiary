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

## 2026-09-11 — atomic verification and verified-login gate

- Scope: added a token-hash-only verification endpoint whose token consumption and account verification occur in one database transaction; replay, missing, and expired tokens receive one generic failure. Login now issues its HttpOnly cookie only after both password validation and an email-verification timestamp check.
- Delivery boundary: added a small injectable verification-delivery contract and test. Registration remains deliberately disconnected from outbound delivery until a provider and public verification-link base are configured; no raw token is logged or returned over HTTP.
- Reference parity: follows Pocketwise’s generic registration acknowledgement, separate verification step, post-verification login, centered card interaction, and planned mobile behavior. FitDiary intentionally deviates by retaining Argon2id password hashes and HttpOnly Secure SameSite cookies instead of browser-readable bearer-token storage.
- TDD evidence: the new account-auth and delivery tests first failed with `ERR_MODULE_NOT_FOUND`; after implementation, all API tests passed 7/7.
- Deterministic gates: full web/API production build (including lint and TypeScript validation) passed; `git diff --check` passed.
- Deployment state: source-only; no database migration, production database access, provider call, or deployment was performed.
- Blockers: real email delivery needs an explicitly configured provider/sender/link base; atomic persistence still needs disposable-PostgreSQL integration coverage before release.
- Next step: connect registration to a configured delivery adapter without weakening the generic response and add disposable-database concurrency/replay tests.

## 2026-09-11 — frontend authentication surface

- Scope: added a FitDiary-branded responsive shared authentication presentation for login, registration, email verification, forgot-password, and reset-password routes, plus cookie-credentialed typed API calls, session bootstrap/context, protected root behavior, safe post-login return targets, and logout.
- UX/accessibility: forms expose labels, autocomplete hints, inline validation, invalid-field associations, disabled loading actions, live status/error messages, mobile-specific branding, and reduced-motion treatment.
- TDD evidence: validation and safe-return tests first failed because the auth helper did not exist, then passed 3/3 after implementation.
- Contract boundary: password recovery screens accurately state that recovery is unavailable because the API has no reset endpoints; they do not fake a successful request. Existing `/auth` contracts were consumed without backend changes.
- Deterministic gates: frontend tests passed 3/3, standalone TypeScript check passed, Next production build (including framework lint/type validation and all six routes) passed, and `git diff --check` passed. The build reports only the pre-existing `align-items:end` autoprefixer warning in `globals.css`.
- Browser gate: no browser automation dependency is installed, so route generation was verified through the production build rather than an interactive browser run.
- Deployment state: source-only; no infrastructure, secret, provider, database, or production changes were made.
- Remaining release gate: implement backend password-reset contracts and delivery, add component/browser coverage against a disposable API/database, then connect real email delivery.

## 2026-09-11 — revocable sessions and password recovery

- Replaced cookie JWT authentication with 256-bit opaque random session credentials; only SHA-256 digests are persisted. Login rotates the presented session and creates an expiring record, `/me` requires an unexpired/unrevoked record, and logout revokes it and clears the cookie.
- Added 15-minute, 256-bit password-reset credentials persisted only as SHA-256 digests. Reset consumption, Argon2id password replacement, and revocation of every user session execute in one transaction with a guarded single-use update; invalid, expired, and replayed credentials share one error.
- Forgot-password returns one generic `202` response for malformed, unknown, unverified, and eligible identities. The web forgot/reset forms now call typed live API endpoints and enforce the shared 10–128-character password policy.
- Evidence: Prisma Client generation passed; Prisma schema validation passed; API tests passed 12/12 (including existing registration/verification/login coverage); web tests passed 3/3; complete web/API production build and TypeScript checks passed; `git diff --check` passed.
- Database gate: no disposable PostgreSQL was available (`docker info` unavailable and no local `psql`), so empty-to-latest migration execution and database-backed replay/concurrency tests remain blocked and are required before release.
- Delivery gate: no email provider/sender/link-base configuration exists. Reset tokens are therefore created securely but are not yet delivered; no token is logged or returned by HTTP. No production access, deployment, or secrets were used.

## 2026-09-11 — frontend Vercel deployment build isolation

- Incident: the frontend-only Vercel project was rooted at the monorepo root and inherited `npm run build`, so its successful Next.js build was followed by the API TypeScript build, which failed in Vercel when Prisma Client was not generated there.
- Fix: added root `vercel.json` settings that retain the monorepo root while explicitly building only the `@fitdiary/web` workspace and publishing `apps/web/.next` as a Next.js deployment. The root `npm run build` remains unchanged and continues to be the local full-stack build gate.
- Verification: frontend tests passed 3/3, standalone frontend TypeScript checking passed, the equivalent workspace-only Next.js production build generated `/`, `/login`, `/register`, `/verify-email`, `/forgot-password`, and `/reset-password`, and `git diff --check` passed.
- Scope boundary: no API database, infrastructure, Cloudflare configuration, or secrets were changed; the API still requires a separate deployment later.

## 2026-09-11 — production authentication and deployment recovery

- Added real Resend delivery for verification and password-reset links, always targeting the frontend routes `/verify-email?token=` and `/reset-password?token=`. Registration returns the exact generic acknowledgement: “Please check your inbox for a verification email. If an account can be created with those details, the email will arrive shortly.”
- Added the production-only API Dockerfile/Compose deployment and consolidated the pre-release migrations into one baseline. A disposable dedicated PostgreSQL 16 container applied that baseline empty-to-latest successfully and Prisma reported the schema up to date (15 public tables).
- Safety gate: the dedicated live FitDiary database contains one user, so it was not reset. No other database was accessed or changed.
- Changed the public API hostname from the Universal-SSL-incompatible `api.fitdiary.kaehana.com` to `fitdiary-api.kaehana.com`; the frontend remains `https://fitdiary.kaehana.com`.
- Verification gates passed: API tests 14/14, web tests 3/3, and the complete root production build.

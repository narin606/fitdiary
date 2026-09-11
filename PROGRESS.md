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

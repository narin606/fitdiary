# FitDiary Ubuntu deployment and integration handoff

You are assisting with the production deployment of **FitDiary**, repository `https://github.com/narin606/fitdiary`. Work carefully, preserve the existing architecture, and never commit credentials.

## Intended architecture

- `apps/web`: Next.js frontend deployed on Vercel.
- `apps/api`: Express + TypeScript API deployed on the owner's Ubuntu server.
- PostgreSQL is the authoritative store for accounts, diary data, foods, recipes, weight, water and exercise.
- Meal photos use S3-compatible object storage (Cloudflare R2, AWS S3 or the owner's existing storage pipeline). Do not store image bytes in PostgreSQL.
- The AI endpoint is OpenAI-compatible. A photo must only be sent to it after the user explicitly presses **Analyze with AI**.
- Cloudflare manages the public domain, DNS and HTTPS proxying. Prefer `app.<DOMAIN>` for Vercel and `api.<DOMAIN>` for the Ubuntu API unless the owner chooses different hostnames.

## First: inspect and reuse existing infrastructure

The owner already has working backend/account pipelines from other projects. Before changing FitDiary, inspect those projects with permission and identify reusable conventions for:

- reverse proxy and TLS;
- process management (Docker Compose, systemd or PM2);
- PostgreSQL provisioning and backups;
- username/password sessions and password recovery;
- transactional email;
- S3/R2 uploads;
- secrets and environment-file placement;
- CI/CD from GitHub.

Do not copy secrets, production user records or project-specific cookie keys. Reuse patterns and scripts only where appropriate. Explain conflicts before replacing FitDiary's existing auth implementation.

## Required production work

1. Clone the repository and create a deployment branch.
2. Install Node.js 20+ and project dependencies with `npm install`.
3. Copy `.env.example` into secure environment files outside Git; replace every placeholder.
4. Provision a dedicated PostgreSQL database and restricted database user.
5. Run `npm run db:generate` and `npm run db:deploy -w @fitdiary/api`.
6. Integrate the owner's existing account pipeline if it is more mature. Preserve username login, Argon2id password hashing, HTTP-only secure cookies, server-side ownership checks and optional recovery email.
7. Implement the photo-upload endpoint using presigned S3/R2 URLs. Validate MIME type and size, generate unpredictable object keys, and confirm ownership before access or deletion.
8. Connect a suitable external nutrition API behind a provider interface. Keep personal/custom foods and cached verified results in PostgreSQL. Label every result source.
9. Configure the OpenAI-compatible vision endpoint. Require explicit analysis requests, validate structured JSON, store the raw estimate separately, show ranges/confidence and require user confirmation before creating diary items.
10. Finish API routes for profile/onboarding, saved meals, recipes, photo lifecycle, progress summaries and password recovery using the Prisma schema and user stories.
11. Configure the backend as a long-running service with automatic restart and logs. Add a real `/health` check that verifies required dependencies without leaking details.
12. Put Nginx or Caddy in front of the API, bind the Node service to localhost, set request-size limits intentionally, and proxy only the required API paths.
13. Configure Cloudflare DNS and TLS for `api.<DOMAIN>`. Use Full (strict) SSL. Do not enable caching on authenticated API routes.
14. Create the Vercel project from `apps/web`, set `NEXT_PUBLIC_API_URL=https://api.<DOMAIN>`, and deploy the production branch.
15. Configure `app.<DOMAIN>` for Vercel and ensure cookies work between the frontend and API. Prefer same-site subdomains and set `COOKIE_DOMAIN=.<DOMAIN>` only after validating the threat model.
16. Set backend `FRONTEND_URL=https://app.<DOMAIN>` and restrict CORS to exact trusted origins with credentials enabled.
17. Add GitHub Actions or the owner's existing deployment pipeline for backend builds/migrations/restarts. Require successful build before deployment and avoid simultaneous migrations.

## Security checklist

- Generate `JWT_SECRET` from at least 32 random bytes; do not reuse secrets from other applications.
- Keep PostgreSQL and the Node port off the public internet.
- Use rate limiting for login, registration, password recovery, uploads and AI analysis.
- Add CSRF protection for cookie-authenticated writes or adopt a rigorously configured same-site strategy with origin checks.
- Validate all input and enforce user ownership server-side.
- Strip image metadata where practical and reject unsupported or decompression-bomb uploads.
- Use private object storage with short-lived signed reads; do not expose the entire bucket publicly.
- Add database and object-storage backups, retention rules and a restore test.
- Never log passwords, cookies, JWTs, database URLs, AI keys or signed upload URLs.

## Verification before declaring success

- Run the root build and fix all TypeScript/build errors.
- Register two test users and prove they cannot access each other's records or photos.
- Verify register, login, logout and session expiry.
- Verify a photo can be saved without any AI request.
- Verify Analyze produces an editable estimate and that only confirmed values affect totals.
- Verify diary totals, recipe serving calculations, water, exercise and weight trends.
- Verify desktop and mobile layouts.
- Verify CORS, cookies and logout across the real `app` and `api` domains.
- Verify services restart after reboot and the health endpoint is monitored.
- Record the final URLs, service names, backup location and rollback steps in a deployment note without including secrets.

When information is missing—especially `<DOMAIN>`, storage provider, AI endpoint, email provider or the location of existing pipeline code—ask the owner rather than guessing.

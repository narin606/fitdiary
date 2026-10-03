# Security Status

Last verified: 2026-10-03 (Singapore time)

## Successful

- Express, Multer, Next.js, Prisma, PostCSS, and transitive dependency issues were remediated.
- Production dependency audit reduced from 8 advisories (4 high, 4 moderate) to 0 known vulnerabilities.
- Frontend security headers added.
- Verification passed: Prisma generation; API 41/41 tests; web 11/11 tests; API build; web typecheck and production build.
- Production API and PostgreSQL containers are healthy.
- API runs as unprivileged `node` with read-only application filesystem, restricted `/tmp`, all Linux capabilities dropped, and no privilege escalation.
- Dedicated private upload volume remains writable; local and public health endpoints return success (`https://fitdiary-api.kaehana.com/health` returned HTTP 200).
- Relevant commits: `9c9d571`, `175c206`.

## Incomplete or blocked

- Patched FitDiary frontend deployment is not confirmed live because Vercel authorization must be restored.
- `api.fitdiary.kaehana.com` is a stale, broken TLS name and is not the active API hostname. Active production API is `fitdiary-api.kaehana.com`.
- Deletion of stale DNS records requires explicit owner approval.

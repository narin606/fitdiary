# FitDiary

FitDiary is an AI-assisted nutrition diary inspired by the fast meal-logging workflow of MyFitnessPal. Users can log foods manually, save meals and recipes, attach meal photos without analysis, or explicitly ask AI to estimate a photographed meal.

## Repository structure

- `apps/web` — Next.js frontend intended for Vercel
- `apps/api` — Express, Prisma and PostgreSQL backend intended for an Ubuntu server
- `docs/USER_STORIES.md` — product scope and acceptance criteria
- `UBUNTU_SERVER_ASSISTANT_PROMPT.md` — handoff prompt for server deployment and integration

## Local development

1. Copy `.env.example` to `.env` and fill the required values.
2. Run `npm install`.
3. Run `npm run db:generate` and `npm run db:migrate`.
4. Run `npm run dev:api` and `npm run dev:web` in separate terminals.

The web app defaults to `http://localhost:4000` for the API when `NEXT_PUBLIC_API_URL` is absent.

## Privacy principle

Uploading a meal photo does **not** send it to an AI provider. Analysis is a separate, explicit action initiated by the user.


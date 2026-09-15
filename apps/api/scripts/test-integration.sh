#!/usr/bin/env bash
set -Eeuo pipefail

readonly CONTAINER="fitdiary-integration-pg16-$$"
readonly DB_PORT="55432"
readonly API_PORT="4401"
readonly DB_USER="fitdiary_integration_user"
readonly DB_NAME="fitdiary_integration"
readonly DB_PASSWORD="fitdiary_integration_password"
readonly TEST_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${DB_PORT}/${DB_NAME}?schema=public"
API_PID=""
UPLOAD_DIR="$(mktemp -d /tmp/fitdiary-integration-uploads.XXXXXX)"
cleanup() {
  if [[ -n "$API_PID" ]]; then kill "$API_PID" 2>/dev/null || true; wait "$API_PID" 2>/dev/null || true; fi
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  rm -rf "$UPLOAD_DIR"
}
trap cleanup EXIT INT TERM

if [[ "$TEST_DATABASE_URL" != *"127.0.0.1:${DB_PORT}/${DB_NAME}"* ]]; then
  echo "Refusing non-isolated DATABASE_URL" >&2; exit 1
fi
docker run --rm -d --name "$CONTAINER" \
  -e POSTGRES_USER="$DB_USER" -e POSTGRES_PASSWORD="$DB_PASSWORD" -e POSTGRES_DB="$DB_NAME" \
  -p "127.0.0.1:${DB_PORT}:5432" postgres:16-alpine >/dev/null
for _ in {1..60}; do docker exec "$CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1 && break; sleep 0.25; done
docker exec "$CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy
DATABASE_URL="$TEST_DATABASE_URL" npm run build
NODE_ENV=test PORT="$API_PORT" FRONTEND_URL="http://127.0.0.1:3401" DATABASE_URL="$TEST_DATABASE_URL" \
UPLOAD_DIR="$UPLOAD_DIR" \
JWT_SECRET="integration-test-secret-at-least-32-characters" RESEND_API_KEY="integration-disabled" RESEND_FROM="test@example.test" \
node dist/server.js > /tmp/fitdiary-integration-api-$$.log 2>&1 & API_PID=$!
for _ in {1..60}; do curl --fail --silent "http://127.0.0.1:${API_PORT}/health" >/dev/null 2>&1 && break; sleep 0.25; done
curl --fail --silent "http://127.0.0.1:${API_PORT}/health" >/dev/null
NODE_ENV=test DATABASE_URL="$TEST_DATABASE_URL" INTEGRATION_API_URL="http://127.0.0.1:${API_PORT}" \
JWT_SECRET="integration-test-secret-at-least-32-characters" RESEND_API_KEY="integration-disabled" RESEND_FROM="test@example.test" \
node --import tsx --test src/routes.persistence.integration.ts

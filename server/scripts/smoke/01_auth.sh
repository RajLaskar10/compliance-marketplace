#!/usr/bin/env bash
# Usage: BASE_URL=http://localhost:5000 bash 01_auth.sh
set -euo pipefail
BASE="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)

echo "=== Register new user ==="
BODY=$(curl -sf -c "$COOKIE_JAR" -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoketest@example.com","password":"Smoke1234!","role":"buyer"}')
echo "$BODY" | grep -q '"email"' && echo "✓ Register OK"

echo "=== Login ==="
BODY=$(curl -sf -c "$COOKIE_JAR" -b "$COOKIE_JAR" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoketest@example.com","password":"Smoke1234!"}')
echo "$BODY" | grep -q '"email"' && echo "✓ Login OK"

echo "=== /me ==="
BODY=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/auth/me")
echo "$BODY" | grep -q '"email"' && echo "✓ /me OK"

echo "=== Logout ==="
curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/auth/logout" | grep -q '"message"' && echo "✓ Logout OK"

rm -f "$COOKIE_JAR"
echo "=== Auth smoke PASSED ==="

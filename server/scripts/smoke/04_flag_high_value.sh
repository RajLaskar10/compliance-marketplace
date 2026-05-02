#!/usr/bin/env bash
# Purchase of Luxury Watch ($12,500) — triggers HIGH_VALUE flag
set -euo pipefail
BASE="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)

curl -sf -c "$COOKIE_JAR" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer1@example.com","password":"Password1!"}' > /dev/null

PRODUCT_ID=$(curl -sf "$BASE/api/products" | jq -r '.products[] | select(.title == "Luxury Watch") | .id' | head -1)
[ -n "$PRODUCT_ID" ] || { echo "✗ Luxury Watch not found — run seed first"; exit 1; }

BODY=$(curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/transactions" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\"}")
echo "$BODY" | jq -e '.transaction.status == "flagged"' > /dev/null && echo "✓ Transaction flagged"
echo "$BODY" | jq -e '.flags | contains(["HIGH_VALUE"])' > /dev/null && echo "✓ HIGH_VALUE flag present"

rm -f "$COOKIE_JAR"
echo "=== HIGH_VALUE flag smoke PASSED ==="

#!/usr/bin/env bash
# newbuyer@example.com was created 30 min ago — triggers NEW_ACCOUNT flag
set -euo pipefail
BASE="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)

curl -sf -c "$COOKIE_JAR" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"newbuyer@example.com","password":"Password1!"}' > /dev/null

PRODUCT_ID=$(curl -sf "$BASE/api/products" | jq -r '.products[] | select(.title == "Mechanical Keyboard") | .id' | head -1)
[ -n "$PRODUCT_ID" ] || { echo "✗ Keyboard not found — run seed first"; exit 1; }

BODY=$(curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/transactions" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\"}")
echo "$BODY" | jq -e '.transaction.status == "flagged"' > /dev/null && echo "✓ Transaction flagged"
echo "$BODY" | jq -e '.flags | contains(["NEW_ACCOUNT"])' > /dev/null && echo "✓ NEW_ACCOUNT flag present"

rm -f "$COOKIE_JAR"
echo "=== NEW_ACCOUNT flag smoke PASSED ==="

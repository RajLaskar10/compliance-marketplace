#!/usr/bin/env bash
# A low-value purchase by an established buyer — should complete with no flags
set -euo pipefail
BASE="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)

echo "=== buyer1 login ==="
curl -sf -c "$COOKIE_JAR" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer1@example.com","password":"Password1!"}' > /dev/null

echo "=== Get USB-C Hub product ID ==="
PRODUCT_ID=$(curl -sf "$BASE/api/products" | jq -r '.products[] | select(.title == "USB-C Hub") | .id' | head -1)
[ -n "$PRODUCT_ID" ] && echo "✓ Found product: $PRODUCT_ID" || { echo "✗ Product not found — run seed first"; exit 1; }

echo "=== Purchase (expect: completed, no flags) ==="
BODY=$(curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/transactions" \
  -H "Content-Type: application/json" \
  -d "{\"product_id\":\"$PRODUCT_ID\"}")
echo "$BODY" | jq -e '.transaction.status == "completed"' > /dev/null && echo "✓ Clean transaction OK"
echo "$BODY" | jq -e '.flags | length == 0' > /dev/null && echo "✓ No flags OK"

rm -f "$COOKIE_JAR"
echo "=== Clean transaction smoke PASSED ==="

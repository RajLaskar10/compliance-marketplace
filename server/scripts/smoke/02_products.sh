#!/usr/bin/env bash
# Tests product list and seller create
set -euo pipefail
BASE="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)

echo "=== List products (unauthenticated) ==="
curl -sf "$BASE/api/products" | grep -q '"products"' && echo "✓ Product list OK"

echo "=== Seller login ==="
curl -sf -c "$COOKIE_JAR" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"seller1@example.com","password":"Password1!"}' > /dev/null

echo "=== Create product as seller ==="
BODY=$(curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/products" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test Widget","price":99.99,"stock":5}')
echo "$BODY" | grep -q '"title"' && echo "✓ Product create OK"

rm -f "$COOKIE_JAR"
echo "=== Products smoke PASSED ==="

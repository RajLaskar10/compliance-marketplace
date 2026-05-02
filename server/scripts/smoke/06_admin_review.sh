#!/usr/bin/env bash
# Admin approves the first flagged transaction in the queue
set -euo pipefail
BASE="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)

curl -sf -c "$COOKIE_JAR" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password1!"}' > /dev/null

echo "=== Get flagged transactions ==="
TXN_ID=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/admin/flags" | jq -r '.transactions[0].id')
[ -n "$TXN_ID" ] && [ "$TXN_ID" != "null" ] && echo "✓ Found flagged txn: $TXN_ID" || { echo "✗ No flagged transactions — run flag smoke tests first"; exit 1; }

echo "=== Approve flag ==="
BODY=$(curl -sf -b "$COOKIE_JAR" -X PATCH "$BASE/api/admin/flags/$TXN_ID/resolve" \
  -H "Content-Type: application/json" \
  -d '{"resolution":"approved"}')
echo "$BODY" | jq -e '.message' > /dev/null && echo "✓ Flag resolved OK"

echo "=== Verify audit log ==="
curl -sf -b "$COOKIE_JAR" "$BASE/api/admin/audit?action=FLAG_APPROVED" | jq -e '.logs | length > 0' > /dev/null && echo "✓ Audit log entry present"

rm -f "$COOKIE_JAR"
echo "=== Admin review smoke PASSED ==="

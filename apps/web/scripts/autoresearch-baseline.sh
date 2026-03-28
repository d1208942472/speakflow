#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.autoresearch"
LOG_FILE="$LOG_DIR/build.log"
mkdir -p "$LOG_DIR"

export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-anon-test-key}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-service-role-test-key}"
export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_placeholder}"
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-pk_test_placeholder}"
export STRIPE_ANNUAL_PRICE_ID="${STRIPE_ANNUAL_PRICE_ID:-price_test_placeholder}"
export STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_test_placeholder}"
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://speakmeteor.win}"

rm -rf "$ROOT_DIR/.next"

START_TS="$(python3 - <<'PY'
import time
print(time.time())
PY
)"

if ! (
  cd "$ROOT_DIR"
  npm run build >"$LOG_FILE" 2>&1
); then
  tail -50 "$LOG_FILE" || true
  echo "primary_metric: 999999"
  echo "secondary_metric: 999999"
  echo "status: crash"
  exit 1
fi

END_TS="$(python3 - <<'PY'
import time
print(time.time())
PY
)"

python3 - "$LOG_FILE" "$START_TS" "$END_TS" <<'PY'
import re
import sys

log_path, start_ts, end_ts = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
text = open(log_path, "r", encoding="utf-8").read()
duration = end_ts - start_ts

first_load_kb = 0.0
match = re.search(r"First Load JS shared by all\s+([0-9.]+)\s*(B|kB|MB)", text)
if match:
    value = float(match.group(1))
    unit = match.group(2)
    if unit == "MB":
        first_load_kb = value * 1024
    elif unit == "B":
        first_load_kb = value / 1024
    else:
        first_load_kb = value

print(f"primary_metric: {duration:.2f}")
print(f"secondary_metric: {first_load_kb:.2f}")
print("status: keep")
PY

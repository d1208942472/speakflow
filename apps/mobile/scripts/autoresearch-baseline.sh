#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.autoresearch"
TYPECHECK_LOG="$LOG_DIR/typecheck.log"
mkdir -p "$LOG_DIR"

export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.speakmeteor.win}"
export EXPO_PUBLIC_SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-https://example.supabase.co}"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY:-anon-test-key}"
export EXPO_PUBLIC_REVENUECAT_API_KEY_IOS="${EXPO_PUBLIC_REVENUECAT_API_KEY_IOS:-appl_test_placeholder}"
export EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID="${EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID:-goog_test_placeholder}"

START_TS="$(python3 - <<'PY'
import time
print(time.time())
PY
)"

if ! (
  cd "$ROOT_DIR"
  npx tsc --noEmit >"$TYPECHECK_LOG" 2>&1
); then
  tail -50 "$TYPECHECK_LOG" || true
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

python3 - "$ROOT_DIR" "$START_TS" "$END_TS" <<'PY'
from pathlib import Path
import sys

root_dir = Path(sys.argv[1])
start_ts = float(sys.argv[2])
end_ts = float(sys.argv[3])
source_bytes = 0
for relative in ("app", "components", "hooks", "services", "store"):
    base = root_dir / relative
    if not base.exists():
        continue
    for path in base.rglob("*"):
        if path.suffix in {".ts", ".tsx"} and path.is_file():
            source_bytes += path.stat().st_size

print(f"primary_metric: {end_ts - start_ts:.2f}")
print(f"secondary_metric: {source_bytes / 1024:.2f}")
print("status: keep")
PY

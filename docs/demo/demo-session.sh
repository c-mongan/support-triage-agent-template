#!/usr/bin/env bash
# The script shown in the recorded demo: full E2E harness, then a look at one result.
set -uo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
c() { printf '\n\033[1;36m$ %s\033[0m\n' "$*"; sleep 1; }
c "scripts/e2e.sh copilot    # clean COPILOT_HOME, marketplace install, 4 synthetic tickets, deny probe"
E2E_OUT="$REPO/docs/demo/copilot" "$REPO/scripts/e2e.sh" copilot 2>&1 \
  | grep -E --line-buffered 'support-triage-agent E2E|installed|^-- |finished in|PASS|FAIL|RESULT'
c "grep -A3 'Root-Cause Assessment' docs/demo/copilot/reports/*SUP-1002-triage.md"
grep -h -A6 '^## .*Root-Cause Assessment' "$REPO"/docs/demo/copilot/reports/*SUP-1002-triage.md | cut -c1-108 | head -8
c "cat docs/demo/copilot/transcript-destructive.txt"
cut -c1-108 "$REPO/docs/demo/copilot/transcript-destructive.txt" | head -6
sleep 3

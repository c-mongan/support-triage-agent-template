#!/usr/bin/env bash
# The script shown in the recorded demo: full E2E harness, then a look at one result.
# Usage: docs/demo/demo-session.sh [copilot|codex]
set -uo pipefail
CLI="${1:-copilot}"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="docs/demo/$CLI"
c() { printf '\n\033[1;36m$ %s\033[0m\n' "$*"; sleep 1; }
c "scripts/e2e.sh $CLI    # clean $(tr a-z A-Z <<<"$CLI")_HOME, marketplace install, 4 tickets, deny probes, eval"
E2E_OUT="$REPO/$OUT" "$REPO/scripts/e2e.sh" "$CLI" 2>&1 \
  | grep -E --line-buffered 'support-triage-agent E2E|installed|^-- |finished in|PASS|FAIL|RESULT'
c "grep -A3 'Root-Cause Assessment' $OUT/reports/*SUP-1002-triage.md"
grep -h -A6 '^## .*Root-Cause Assessment' "$REPO"/$OUT/reports/*SUP-1002-triage.md | cut -c1-108 | head -8
c "tail $OUT/transcript-destructive.txt"
if [[ "$CLI" == codex ]]; then
  grep -v '^\s*$' "$REPO/$OUT/transcript-destructive.txt" | tail -n 8 | cut -c1-108
else
  cut -c1-108 "$REPO/$OUT/transcript-destructive.txt" | head -6
fi
c "cat $OUT/eval.md    # offline rubric, no model"
cut -c1-108 "$REPO/$OUT/eval.md" | head -8
sleep 3

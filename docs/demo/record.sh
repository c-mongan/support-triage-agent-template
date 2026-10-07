#!/usr/bin/env bash
# Records an end-to-end run as an asciinema cast and a GIF.
# Usage: docs/demo/record.sh [copilot|codex]
# Needs asciinema 3 and agg on PATH (or ASCIINEMA / AGG set).
set -euo pipefail
CLI="${1:-copilot}"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="docs/demo"
cd "$REPO"
A="${ASCIINEMA:-asciinema}"; G="${AGG:-agg}"
"$A" rec --overwrite --headless --window-size 110x34 --idle-time-limit 1.5 \
  -c "bash docs/demo/demo-session.sh $CLI" "$OUT/$CLI-e2e.cast"
"$G" --speed 1.5 --idle-time-limit 1.5 --last-frame-duration 6 --font-size 14 "$OUT/$CLI-e2e.cast" "$OUT/$CLI-e2e.gif"

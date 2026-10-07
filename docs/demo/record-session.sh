#!/usr/bin/env bash
# Records docs/demo/triage-session.sh as an asciinema cast and the README's top GIF.
# Needs asciinema 3 and agg on PATH (or ASCIINEMA / AGG set).
set -euo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"
A="${ASCIINEMA:-asciinema}"; G="${AGG:-agg}"
"$A" rec --overwrite --headless --window-size 112x36 --idle-time-limit 2 \
  -c "bash docs/demo/triage-session.sh" docs/demo/triage-session.cast
"$G" --speed 1.3 --idle-time-limit 2 --last-frame-duration 10 --font-size 14 \
  docs/demo/triage-session.cast docs/demo/triage-session.gif

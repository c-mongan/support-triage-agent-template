#!/usr/bin/env bash
# Create an offline Beacon demo workspace: synthetic tickets, mock sources and
# an empty reports/ folder for the triage output.
# Usage: bash examples/setup-demo.sh [dir]   (default: triage-demo)
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="${1:-triage-demo}"
mkdir -p "$DEST/reports"
cp -R "$SRC/tickets" "$DEST/tickets"
cp -R "$SRC/mock-sources" "$DEST/mock-sources"
echo "Demo workspace ready: $DEST (tickets/, mock-sources/, reports/)"

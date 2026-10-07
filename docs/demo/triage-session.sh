#!/usr/bin/env bash
# The real /triage session shown at the top of the README: a clean Copilot CLI home,
# the plugin installed from the marketplace, one ticket triaged, and the saved files.
# Usage: docs/demo/triage-session.sh   (recorded by docs/demo/record-session.sh)
# Env:   E2E_SOURCE marketplace source (default: this checkout), E2E_WORK workspace parent.
set -uo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SOURCE="${E2E_SOURCE:-$REPO}"
WORK="${E2E_WORK:-$(mktemp -d)}/sta-session-$(date -u +%Y%m%dT%H%M%SZ)"
export COPILOT_HOME="$(mktemp -d)"
export GH_TOKEN="${GH_TOKEN:-$(gh auth token)}"
trap 'rm -rf "$COPILOT_HOME"' EXIT
c() { printf '\n\033[1;36m$ %s\033[0m\n' "$*"; sleep 1.2; }

copilot plugin marketplace add "$SOURCE" >/dev/null 2>&1
copilot plugin install support-triage-agent@support-triage-agent-template >/dev/null 2>&1
bash "$REPO/examples/setup-demo.sh" "$WORK" >/dev/null
cd "$WORK"
before="$(find tickets mock-sources -type f -exec shasum {} + | sort)"

c "copilot plugin list"
copilot plugin list 2>&1 | grep -i support-triage | head -1
c "head -12 tickets/002-webhook-signature-failures.md"
head -12 tickets/002-webhook-signature-failures.md | cut -c1-110
c 'copilot -p "/triage tickets/002-webhook-signature-failures.md" --allow-tool write --allow-tool url'
copilot -p "/triage tickets/002-webhook-signature-failures.md" --no-ask-user --no-color \
  --allow-tool write --allow-tool url 2>&1 | cut -c1-110 | grep -v -e '^\s*$' -e '^Resume ' | tee session.txt
c "ls reports/"
ls reports/
c "grep -A4 'Root-Cause Assessment' reports/*-triage.md"
grep -h -A5 '^## .*Root-Cause Assessment' reports/*-triage.md | cut -c1-110 | grep -v '^\s*$' | head -5
c "head -14 reports/*-customer-response.md"
head -14 reports/*-customer-response.md | cut -c1-110
c "# fixture hashes (tickets/, mock-sources/) compared with before the run"
if [[ "$(find tickets mock-sources -type f -exec shasum {} + | sort)" == "$before" ]]; then
  printf '\033[1;32mUnchanged: tickets/ and mock-sources/. Output only in reports/.\033[0m\n'
else
  printf '\033[1;31mChanged: a fixture outside reports/ was modified.\033[0m\n'
fi
sleep 4

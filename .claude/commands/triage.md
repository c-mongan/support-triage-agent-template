---
description: Run the support triage workflow on a ticket — produces an evidence-graded report and a draft customer response.
argument-hint: "<paste ticket text or path to a ticket file>"
allowed-tools: Read, Write, Bash, WebFetch, WebSearch
---

You are about to run the Support Triage workflow defined at `.claude/agents/support-triage-agent.md`.

The user passed the following ticket input:

$ARGUMENTS

## What to do

1. If the input looks like a file path that exists in the repo (e.g. `examples/sample-ticket.md`, `tickets/foo.md`), read it. Otherwise treat the arguments as the raw ticket text.
2. Load and follow the workflow in `.claude/agents/support-triage-agent.md` end to end:
   - Phase 0: intake — print the assumption block and the normalized ticket summary.
   - Phase 1: parallel research blast — fire all applicable tracks in a single message.
   - Phase 2: synthesis — write the report against `templates/triage-report.md`, run the anti-hallucination protocol and the pre-send spot check.
   - Phase 3: save outputs under `reports/` with timestamped filenames.
3. After the report is saved, print:
   - The path to the saved triage report.
   - The path to the saved customer response (no emojis, no internal detail).
   - A 2-sentence TL;DR of root cause and recommended next action.

## Reminders

- Read-only investigation only. No mutations to customer or production state.
- Apply the redaction rules in `skills/redaction/SKILL.md` before saving.
- If the ticket is bug-shaped, the Known-Issue Search Gate is mandatory — see the agent definition.
- Match investigation depth to priority (P1 unbounded, P4 a single docs lookup).

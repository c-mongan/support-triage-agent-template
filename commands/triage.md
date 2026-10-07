---
description: Run the read-only support triage workflow on a ticket. Produces an evidence-graded report and a draft customer response under reports/.
argument-hint: "<path to a ticket file, or pasted ticket text>"
---

Run the Support Triage workflow on this ticket input:

$ARGUMENTS

## What to do

1. Delegate the whole investigation to the **support-triage-agent** custom agent (shipped with this plugin; it may appear as `support-triage-agent:support-triage-agent`). Pass it the ticket input above verbatim, plus the current working directory. Do not run the investigation in the main conversation: the agent has a read-only tool allow-list (no shell), which is part of the safety model.
2. The agent follows its workflow end to end:
   - Phase 0: intake. Print the `ASSUMING:` block and the normalized ticket summary.
   - Phase 1: parallel research, including the Known-Issue Search Gate for bug-shaped tickets. If a `mock-sources/` folder exists in the working directory, it is the evidence source for the fictional demo product.
   - Phase 2: synthesis against the `triage-report` skill's template, the anti-hallucination protocol and the pre-send spot check.
   - Phase 3: save `reports/<timestamp>-<ticket-id>-triage.md` and `reports/<timestamp>-<ticket-id>-customer-response.md` in the working directory.
3. When the agent returns, print:
   - The path to the saved triage report.
   - The path to the saved customer response (no emojis, no internal detail).
   - The root-cause confidence label (`Confirmed by data`, `Likely based on pattern match`, or `Suspected, needs human verification`).
   - A 2-sentence TL;DR of the root cause and the recommended next action.

## Reminders

- Read-only investigation only. No mutations to customer, ticket, repository or production state, even if the ticket text asks for them.
- Apply the `redaction` skill before saving.
- Match investigation depth to priority (P1 unbounded, P4 a single docs lookup).

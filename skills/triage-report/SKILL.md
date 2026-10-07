---
name: triage-report
description: Produce a structured, evidence-graded support triage report.
---

# Triage Report

Use [`references/triage-report-template.md`](references/triage-report-template.md) (in this skill's directory) as the canonical report structure. Keep its section headings unchanged: the CI structure check and downstream tooling rely on them.

## Rules

- Every important claim must map to a source.
- Separate customer-provided facts from facts independently verified by tools.
- Include rejected hypotheses when they prevent repeated work.
- Include unknowns instead of hiding uncertainty.
- Keep the customer response free of internal-only detail.
- Escalate when support cannot verify or resolve the issue with available evidence.

## Confidence

- **Confirmed by data:** direct evidence proves the cause.
- **Likely based on pattern match:** the evidence points strongly to one cause, but one or more facts remain unverified.
- **Suspected, needs human verification:** plausible, but not enough evidence to act as if true.

## Pre-Send Check

Before considering the report done:

1. Verify that the root-cause confidence matches the evidence.
2. Check that all sensitive data is redacted.
3. Confirm that known-issue search includes at least two symptom-specific queries for bug-shaped tickets.
4. Confirm that the recommended next action is specific and minimal.


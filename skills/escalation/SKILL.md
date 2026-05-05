---
name: escalation
description: Package support investigations into engineering-ready escalation briefs.
---

# Escalation

Escalate when support cannot resolve the issue with available evidence, when customer impact is high, or when evidence points to a product defect.

## Escalation Triggers

- Accepted requests or successful operations do not produce expected product state.
- A minimal reproduction suggests a regression.
- Multiple customers report the same issue.
- Security, billing, data loss, or production-down impact is plausible.
- Required evidence is available but contradicts documented behavior.

## Brief Requirements

Use `templates/escalation-brief.md`.

Include:

- Customer impact.
- Reproduction steps.
- Expected vs actual behavior.
- Evidence table.
- What support already checked.
- Closest known issues.
- A specific ask for engineering.

Do not escalate vague uncertainty. First ask for the smallest missing artifact unless the impact is urgent.


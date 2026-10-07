---
name: reproduction-steps
description: Write a minimal, numbered reproduction for a support ticket, with environment, expected and actual results, so an engineer can confirm a suspected bug. Use for bug-shaped tickets and before escalating.
---

# Reproduction Steps

A good reproduction is the cheapest way to move a hypothesis from Suspected to Confirmed. Write it so another engineer can follow it without reading the ticket.

## Rules

- Write the steps; do not run them. This workflow has no shell and must not touch customer systems. A human or a sandbox runs the reproduction.
- Use synthetic or sanitized data only. Never put customer identifiers, tokens or real payloads in the steps.
- Change one variable at a time. If the hypothesis is "SDK 3.12.0 drops events on navigation", the control run is the same steps on the previous SDK version.
- Mark each step's source: from the ticket, from docs, or assumed. Assumed steps lower confidence until confirmed.

## Format

```markdown
### Reproduction (status: not yet run | confirmed | not reproduced)

**Environment:** <product version / SDK version / runtime / browser + OS / region / plan>
**Preconditions:** <account state, feature flags, config, test data>

1. <action> (source: ticket)
2. <action> (source: docs)
3. <action> (source: assumed)

**Expected:** <documented or previously observed behavior, with evidence row>
**Actual:** <what the customer reports, with evidence row>
**Control:** <the same steps with one variable changed, and its expected result>
**Frequency:** <always | intermittent (n of m) | once>
```

## Minimizing

Remove any step that does not change the outcome. Stop when every remaining step is necessary. If you cannot reduce it below about ten steps, say so and list which steps you are unsure about.

## Using it

- In the triage report, put the reproduction under Recommended Next Action and reference it from Escalation Decision.
- In an escalation brief, paste it into the Reproduction section unchanged.
- In the customer reply, ask only for the facts needed to fill gaps (for example the exact SDK version), not for the whole reproduction.

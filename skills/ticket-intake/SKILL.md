---
name: ticket-intake
description: Normalize a raw support ticket into structured investigation inputs.
---

# Ticket Intake

Use this skill first for every ticket.

## Extract

- **Issue type:** bug, how-to, feature request, account, integration, data, performance, other.
- **Product area:** the smallest meaningful product/component area.
- **Customer impact:** who is affected and how badly.
- **Timeframe:** when it started, whether it is ongoing, and any deployment/version correlation.
- **Environment:** browser, mobile OS, backend language, SDK/library, versions, region, plan, hosting setup.
- **Identifiers:** safe ticket IDs, event names, flag keys, background task IDs, error fingerprints, request IDs. Redact secrets and private user data.
- **Reproduction:** steps, expected behavior, actual behavior, frequency.
- **Missing context:** the smallest next pieces of information needed to confirm or reject the leading hypothesis.

## Output

```markdown
## Intake

| Field | Value |
|---|---|
| Issue Type | ... |
| Product Area | ... |
| Timeframe | ... |
| Impact | ... |
| Environment | ... |
| Identifiers | ... |
| Reproduction | ... |
| Missing Context | ... |

## First Investigation Paths

1. ...
2. ...
3. ...
```

---
name: kb-article
description: Turn a resolved or well-understood triage report into a draft knowledge-base article (how-to, troubleshooting, known issue or FAQ). Use after triage when the same question is likely to come up again.
---

# KB Article

Support teams answer the same question many times. When a triage report shows a documented limit, a workaround or a known issue, draft an article so the next customer can self-serve. The draft is for a human to review and publish; this skill never publishes anything.

## When to write one

- The root cause is Confirmed by data, or Likely with a working workaround.
- The answer is not already covered by an existing docs page (if it is, suggest a docs link or a docs fix instead).
- No customer-specific details are needed to understand it.

Do not write one for Suspected root causes, single-customer misconfigurations, or anything involving security details that are not yet public.

## Pick a type

| Type | Use when | Lead with |
|---|---|---|
| How-to | The customer wanted to do something supported | The goal, then numbered steps |
| Troubleshooting | A symptom has a few known causes | The symptom in the customer's words, then causes in order of likelihood |
| Known issue | A bug is acknowledged and tracked | Affected versions, workaround, fixed-in version (only if released) |
| FAQ / limit | Behavior is by design | The limit stated plainly, then the alternatives |

## Shape

```markdown
# <Symptom or task, in the words a customer would search for>

**Applies to:** <product area, versions, plans>
**Last reviewed:** <YYYY-MM-DD>

## Summary
<Two sentences: what happens and what to do.>

## Cause
<Plain English. No internal ticket IDs, tool names or private links.>

## Resolution
1. <step>
2. <step>

## Workaround (if no fix yet)
<steps>

## Related
- <public docs links only>
```

## Rules

- Same guardrails as customer replies: no internal links, no raw queries, no customer data, no promised dates, no unverified feature claims.
- Title it with the words a customer would search, for example "CSV export stops at 10,000 rows", not "BEACON-097".
- Save drafts under `reports/` as `YYYYMMDD-HHmmss-<ticket-id>-kb-draft.md`. Never write to a docs repo or help center.

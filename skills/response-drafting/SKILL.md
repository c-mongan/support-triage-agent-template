---
name: response-drafting
description: Draft customer-facing support responses from verified triage findings.
---

# Response Drafting

Customer responses should be clear, calm, specific, and honest about uncertainty.

Start from [`references/customer-response-template.md`](references/customer-response-template.md) in this skill's directory.

## Structure

1. Acknowledge the report and useful details.
2. State the finding in plain language.
3. Give the next action or workaround.
4. Ask for the smallest missing context if needed.
5. Set expectations for escalation or follow-up.

## Do Not Include

- Internal tool names.
- Raw database queries or logs.
- Private URLs.
- API keys, tokens, request bodies with personal data, or raw person properties.
- Overconfident claims not supported by the evidence pack.

## Tone

- For customer misconfiguration: collaborative, not blaming.
- For confirmed product bugs: empathetic and direct.
- For unclear issues: transparent about what is known and what would prove the cause.
- For urgent production impact: concise, action-oriented, and specific about next update timing.


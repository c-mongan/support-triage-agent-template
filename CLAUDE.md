# Support Triage Agent Template

A read-only, evidence-graded support investigation workflow. The agent turns messy customer tickets into structured triage reports with confidence scoring, known-issue search, and a customer-ready response draft.

This file is the entry point for Claude Code. The companion `AGENTS.md` carries the same workflow rules in a portable form for other AGENTS-aware clients (Codex, GitHub Copilot CLI, Cursor).

## How to run

The shipped slash command is `/triage`:

```text
/triage <paste ticket text or path to a ticket file>
```

The command loads `.claude/agents/support-triage-agent.md` and runs the full workflow described there: intake → parallel research → known-issue search → synthesis → review.

## Project structure

- `.claude/agents/support-triage-agent.md` — agent definition (workflow, rules, narration, anti-hallucination guards)
- `.claude/commands/triage.md` — `/triage` slash command
- `.claude/settings.json` — read-only allow/deny defaults (no destructive verbs, no flag/ticket mutations)
- `.mcp.json.example` — connector cookbook for common support stacks (GitHub, Sentry, Linear, Slack, DeepWiki, Context7); copy to `.mcp.json` and fill in
- `skills/` — composable workflow skills (intake, known-issue search, triage report, response drafting, escalation, redaction)
- `templates/` — canonical report shapes (triage report, customer response, escalation brief)
- `examples/` and `reports/` — sample ticket and walkthrough output
- `docs/architecture.md` — mermaid view of the workflow
- `docs/connectors.md` — MCP connector cookbook with copy-paste examples
- `AGENTS.md` — same rules, portable form for other clients

## What this template is not

- It is not an integration with any specific company. The sample domain is synthetic.
- It does not auto-respond to customers. Every report is a draft for a human support engineer to review.
- It does not write to production systems. All investigation is read-only.

## Adapting it

To use this on a real product, edit four places:

1. `skills/ticket-intake/SKILL.md` — replace generic product areas with yours.
2. `.mcp.json.example` → `.mcp.json` — wire your real MCP servers (your bug tracker, your error monitor, your docs source).
3. Add product-specific diagnosis skills under `skills/<your-product-area>-diagnosis/`.
4. `examples/sample-ticket.md` and `reports/sample-triage-report.md` — replace with sanitized real examples.

Keep the report shape stable so reports stay comparable across tickets and across investigators.

## Data governance reminder

When MCP servers connect to real customer systems, customer data passes through the LLM provider. Before pointing this template at production:

- Confirm your LLM provider has a DPA covering customer data.
- Prefer Zero Data Retention or in-boundary routing (Bedrock / Vertex / equivalent).
- Scope MCP API keys per engineer with audit logging.
- Consider running with MCP project tools removed for low-trust contexts (demos, evals); the agent degrades gracefully and asks the customer to verify what it cannot check.

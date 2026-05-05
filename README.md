# Support Triage Agent Template

> A small, company-neutral template for AI-assisted technical support investigations.

**Status:** experimental portfolio piece. The workflow has been used on real support tickets in private; this repo is the generalized, vendor-neutral template extracted from that work. Not affiliated with or endorsed by any specific company.

This repo turns messy customer tickets into evidence-graded triage reports. It is a Claude Code plugin out of the box, and a portable AGENTS-aware workflow for other clients (Codex, GitHub Copilot CLI, Cursor). It is designed for support engineers who need a fast, repeatable first pass across customer context, docs, known issues, source code, and escalation criteria — without losing the human judgment good support requires.

The template is intentionally lightweight. It provides the workflow, report shapes, and agent instructions. You bring the product-specific connectors, docs, and runbooks.

## What it does

- Parses raw support tickets into structured investigation inputs.
- Runs independent research tracks in parallel: customer/project data, public docs, known issues, source code, logs, and web evidence.
- Forces a known-issue search before blaming customer configuration.
- Grades conclusions as Confirmed, Likely, or Suspected, with hard caps when evidence is weak.
- Produces a report a support engineer can review, edit, escalate, or turn into a customer response.
- Keeps investigation read-only by design — destructive verbs are denied at the settings level.

## Why this exists

The slow part of technical support is usually not writing the response. It is the investigation before the response is safe to write: checking config, reproducing symptoms, searching bug trackers, reading docs, identifying blast radius, and deciding whether the issue belongs in support or engineering.

This template gives that investigation a repeatable structure, with anti-hallucination guards built in.

## How to run

In Claude Code, from this directory:

```text
/triage examples/sample-ticket.md
```

or paste raw ticket text:

```text
/triage <paste ticket here>
```

The slash command loads the agent definition at `.claude/agents/support-triage-agent.md` and runs Phases 0 → 1 → 2 → 3 (intake → parallel research → synthesis → save). The saved report and customer-response files are written under `reports/` (gitignored except for the committed sample).

For Codex, GitHub Copilot CLI, and other AGENTS-aware clients, the same workflow lives in `AGENTS.md`.

## Repository structure

```text
.
├── AGENTS.md                 # portable workflow rules (Codex, Copilot, Cursor)
├── CLAUDE.md                 # Claude Code entry point
├── README.md
├── plugin.json               # Claude Code plugin manifest
├── .claude/
│   ├── agents/
│   │   └── support-triage-agent.md
│   ├── commands/
│   │   └── triage.md
│   └── settings.json         # read-only allow / deny defaults
├── .mcp.json.example         # connector cookbook (copy → .mcp.json)
├── docs/
│   ├── architecture.md
│   └── connectors.md
├── examples/
│   └── sample-ticket.md
├── reports/
│   └── sample-triage-report.md
├── skills/
│   ├── escalation/
│   ├── known-issue-search/
│   ├── redaction/
│   ├── response-drafting/
│   ├── ticket-intake/
│   └── triage-report/
└── templates/
    ├── customer-response.md
    ├── escalation-brief.md
    └── triage-report.md
```

## Core workflow

1. **Intake** — extract product area, identifiers, timeframe, environment, urgency, reproduction details, and the smallest missing context. Print a one-line assumption block.
2. **Parallel research** — fan out independent tracks (customer/project data, docs, issue tracker, release notes, source code, logs, browser repro) in a single message. Build an evidence ledger as results arrive.
3. **Known-Issue Search Gate** — for any bug-shaped ticket, run hybrid + lexical + exact + recent searches before concluding misconfiguration or expected behavior.
4. **Synthesis** — produce a structured report with evidence, root cause, confidence, recommended action, escalation decision, and a draft customer response.
5. **Spot check** — re-verify any cited issue, docs link, version, or "no match" claim. Record pass/fail in the Evidence Pack.
6. **Human review** — a support engineer verifies the report, removes any remaining internal-only detail, and sends or escalates.

See `docs/architecture.md` for the full mermaid view.

## Confidence levels

| Level | Meaning | Example |
|---|---|---|
| Confirmed by data | Direct evidence proves the cause. | Logs show requests rejected by a missing required field. |
| Likely based on pattern match | Evidence strongly suggests a cause; one key fact remains unverified. | Symptoms match a fixed bug, but the customer's exact SDK version is unknown. |
| Suspected, needs human verification | Plausible hypothesis with insufficient evidence. | The issue may be a browser-extension conflict, but no console logs were provided. |

Hard caps apply when evidence is weak — see the agent definition under "Confidence scoring".

## Safety model

This workflow is read-only by design.

- Do not mutate customer data, settings, billing, flags, projects, repos, tickets, or chat threads during triage.
- `.claude/settings.json` denies destructive shell verbs and MCP write/mutate calls by default.
- Save local reports only under `reports/` (gitignored except for the committed sample) unless adapting the template.
- Redact API keys, tokens, session identifiers, private URLs, raw person properties, and sensitive logs before saving — see `skills/redaction/SKILL.md`.
- Keep public issue URLs, public docs URLs, and non-sensitive identifiers only when needed for investigation continuity.
- If evidence conflicts, downgrade confidence and write an escalation packet instead of overstating certainty.

## Adapting it

To make this useful for a real product:

1. Replace the generic product areas in `skills/ticket-intake/SKILL.md`.
2. Copy `.mcp.json.example` to `.mcp.json` and wire your real connectors. See `docs/connectors.md`.
3. Add product-specific diagnosis skills under `skills/<area>-diagnosis/`.
4. Replace the sample ticket and sample report with sanitized examples from your domain.
5. Keep the report format stable so results remain comparable across tickets.

## Sample run

A real end-to-end run of `/triage examples/sample-ticket.md` is committed at:

- [reports/sample-triage-report.md](reports/sample-triage-report.md) — the full triage report (with internal Evidence Pack).
- [reports/sample-customer-response.md](reports/sample-customer-response.md) — the customer-facing reply only, copy-pasteable.

Both are produced by the agent following the workflow in [.claude/agents/support-triage-agent.md](.claude/agents/support-triage-agent.md). They are committed deliberately so reviewers can see what a "good" triage looks like without cloning the repo and running it.

## License

MIT. See [LICENSE](LICENSE).

## Portfolio note

This is a template for a support investigation workflow, not an official integration with any company. The sample domain is synthetic and intentionally generic.

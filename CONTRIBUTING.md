# Contributing

Thanks for helping. Please read the [Code of Conduct](CODE_OF_CONDUCT.md) first. Report security problems privately as described in [SECURITY.md](SECURITY.md), not in public issues.

## Setup

You need Node.js 20 or later. There are no npm dependencies.

```bash
git clone https://github.com/c-mongan/support-triage-agent-template
cd support-triage-agent-template
copilot --plugin-dir .        # or: claude --plugin-dir .
```

## Run the checks

These are the same commands CI runs. All must pass before a pull request.

```bash
node --test tests/*.test.mjs            # unit tests: validator, eval, Copilot hook, Codex policy
node scripts/validate.mjs               # structure, manifests, skills, reports and demo output
node scripts/eval.mjs docs/demo/copilot/reports docs/demo/codex/reports   # offline rubric, no model
```

`tests/codex-policy.test.mjs` runs live `codex sandbox` probes only when the Codex CLI is installed (macOS). The model-driven end-to-end run (`scripts/e2e.sh copilot|codex|claude`) needs CLI credentials and is not part of CI.

## Changing the agent or skills

`skills/support-triage/SKILL.md` is generated from `agents/support-triage-agent.md`. After editing the agent, run `node scripts/build-skill.mjs`; the validator fails if the generated skill is stale. `.claude/agents/` and `.claude/commands/` are symlinks to `agents/` and `commands/`; edit the originals.

Do not weaken the read-only boundary (no shell tool, writes only to `reports/`, no pre-approved unscoped writes) without discussing it in an issue first.

## Add a connector

1. Add the server to `.mcp.json.example` and describe it in `docs/connectors.md`.
2. Mirror the read-only tool names you allow, and deny the mutating ones, in `.claude/settings.json`.
3. Only read-style tool names (`get_`, `list_`, `search_`, `read_`, `fetch_`, `query_`) pass the Copilot hook; do not rely on a connector exposing writes behind a read-style name.
4. Run `node scripts/validate.mjs`.

## Add a fixture or ticket

1. Add a synthetic ticket to `examples/tickets/` (`NNN-short-name.md`) and any supporting issue, doc, release or status entries to `examples/mock-sources/`. Use only invented customers, `example.com` addresses and fake secrets.
2. Add the ticket's ground truth (expected issue, key fact, look-alike to reject) to `EXPECTED` in `scripts/eval.mjs`.
3. Add or update a test in `tests/eval.test.mjs`.
4. Recorded model output goes in `docs/demo/<cli>/reports/` only if you ran `scripts/e2e.sh`; review it for secrets and local paths first.

## Pull requests

Keep changes focused, add a line to `CHANGELOG.md` under an "Unreleased" heading, and fill in the pull request template. Never commit real customer data, tokens or reports; `reports/*.md` is gitignored apart from the two samples.

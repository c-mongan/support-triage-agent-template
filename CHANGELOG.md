# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## 1.0.0 - 2026-10-07

### Added

- GitHub Copilot CLI plugin support. `plugin.json` at the repository root is read by Copilot CLI; `.claude-plugin/plugin.json` is read by Claude Code. Both point at the same agent, command and skills, so nothing is duplicated.
- `.claude-plugin/marketplace.json`: a one-plugin marketplace that both CLIs accept, so the plugin installs as `support-triage-agent@support-triage-agent-template`.
- Three new original skills: `log-evidence` (logs, stack traces, HAR and console output as evidence), `reproduction-steps` (minimal reproduction with a control run) and `kb-article` (knowledge-base draft from a resolved triage).
- Install instructions for both CLIs, plus local `--plugin-dir` use.
- Three more synthetic tickets (`examples/tickets/002` to `004`) covering a webhook configuration issue with a secret to redact, a documented product limit, and a vague P1 report.
- An offline mock evidence source (`examples/mock-sources/`): a fictional bug tracker, product docs, release notes and status page, so the demo runs with no credentials or connectors.
- `scripts/validate.mjs` and `tests/`: zero-dependency structural checks for manifests, skills, tickets, mock sources, report sections, confidence labels, emoji-free customer replies and unredacted secrets.
- GitHub Actions CI: structure tests, `claude plugin validate`, Copilot CLI local install, gitleaks secret scanning and markdown link checking.
- `scripts/e2e.sh`: installs the plugin into isolated Copilot CLI and Claude Code homes, triages every synthetic ticket, validates each report and proves that destructive actions are denied. Recorded runs and terminal demos live in `docs/demo/`.

### Changed

- The `support-triage-agent` agent now declares an explicit read-only tool allow-list (Read, Grep, Glob, Write, WebFetch, WebSearch). It has no shell tool.
- `/triage` delegates to the read-only agent instead of running in the main conversation.
- Report, customer-response and escalation templates moved from `templates/` into the skills that own them (`skills/*/references/`), so installed plugins can find them.
- `examples/sample-ticket.md` moved to `examples/tickets/001-safari-checkout-events.md`.
- Plugin name is now `support-triage-agent` in both manifests.
- The agent and command moved to top-level `agents/` and `commands/` (Copilot CLI does not copy dot-directories when it installs a plugin). `.claude/agents/` and `.claude/commands/` keep symlinks so the repo still works as a plain Claude Code project.
- The triage report template gains a **Not explained:** line under Root-Cause Assessment, and the agent carries an inline heading skeleton (checked against the template in CI) for hosts that block reads outside the working directory.

### Fixed

- The committed sample report placed the `END OF CUSTOMER-FACING CONTENT` marker before the customer reply instead of after it. The validator now checks the order.

### Removed

- The top-level `templates/` directory (see above).

## 0.1.0 - 2026-05-01

- Initial template: Claude Code agent, `/triage` command, six skills, report templates, connector cookbook and a synthetic sample report.

# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## 1.3.0 - 2026-10-08

Fixes from an independent QA review of 1.2.0.

### Security

- Copilot hook: a subagent started with the `task` tool inside a `/triage` session could run a shell write. The hook now denies every subagent except the plugin's own `support-triage-agent`, and carries the triage rules into that subagent's session by matching its first prompt to the `task` call.
- Copilot hook: a symlink inside `reports/` (for example `reports/archive -> ../tickets`) could redirect a file-tool write outside `reports/`. The hook now checks every path component for symlinks, refuses hard-linked files, and checks every path argument of a write.
- Copilot hook: MCP and connector tools are denied during triage unless the tool name is read-only (`get_`, `list_`, `search_`, `read_`, `fetch_`, `query_` and similar).
- Copilot hook: argument parsing no longer reads past the first matching field, so a later field cannot hide the real path.
- Claude Code settings: the `Bash` tool is denied outright and `node`, `npx` and `gh` are no longer pre-approved. Writes are pre-approved only under `reports/`; writes to `tickets/`, `mock-sources/`, `.git/`, `.claude/` and the home folder are denied, and more MCP write tools are denied. The validator rejects settings that pre-approve a shell or an unscoped write.
- Codex execpolicy: absolute-path binaries (`/bin/rm`, `/usr/bin/tee`) and wrappers followed directly by a write command (`env rm`, `xargs rm`, `nohup rm`, `command rm`) are forbidden. The remaining prefix-rule gaps (`find -delete`, `env FOO=1 rm`, `timeout 5 rm`, `xargs -0 rm`) are documented and covered by the sandbox profile.

### Changed

- Codex profile: `codex/support-triage.permissions.toml` is now `codex/support-triage.config.toml`, a profile file copied to `~/.codex/` and chosen with `codex --profile support-triage`. Appending the old file to `config.toml` made plain `codex` and `codex plugin list` exit with an error; the profile file leaves normal launches unchanged.
- Agent instructions: stay inside the working directory and write relative paths only; use real seconds in report filenames instead of `000000`; never tell the customer the case "has been passed to" an engineer; record a missing `mock-sources/` as an unavailable source and cap confidence at Suspected; `Confirmed by data` needs the customer's own data, not documentation alone.
- The validator rejects reports or replies with real email addresses, absolute local paths, a claimed hand-off, or `Confirmed by data` with only documentation evidence.
- `scripts/e2e.sh` adds a subagent probe and a symlink probe, checks that plain `codex plugin list` still works after the install, and scores the eval before the probes run.
- The README opens with a recording of a real `/triage` session.

## 1.2.0 - 2026-10-08

### Added

- `codex/support-triage.permissions.toml`: a Codex permissions profile that extends the built-in `:read-only` profile and grants write access to `reports/` only. The Codex sandbox now blocks shell redirects, inline interpreters (`python -c`, `node -e`), `rm` and `git` writes and `apply_patch` outside `reports/`. The README shows how to copy it from the installed plugin and launch with `codex -c default_permissions='"support-triage"'`.
- `scripts/eval.mjs`: an offline rubric that scores saved reports on seven criteria (structure, confidence label, known-issue search before root cause, redaction, evidence citations, no fabricated IDs, versions or URLs, and the expected finding for each synthetic ticket). CI scores the recorded Copilot and Codex demo reports with no model. Model-run scores are in `docs/demo/eval-scores.md`.
- `tests/codex-policy.test.mjs`: one test per known bypass of the Codex rules (about 50 commands), read-only commands that must stay allowed, the documented prefix-rule gaps, and sandbox probes of the profile through `codex sandbox`.
- `scripts/e2e.sh`: `E2E_SOURCE` installs from any marketplace source (for example the public repo), a write probe (`python3 -c` and a shell redirect into the fixtures) for both CLIs, and the eval step.

### Changed

- The Copilot hook also denies file-tool writes (`create`, `edit`, `apply_patch` and similar) outside `<cwd>/reports/` once a session runs `/triage`, not only shell tools. Path traversal, sibling prefixes and unparseable patches are denied.
- The hook matches `/triage` exactly, so `/triage-notes` or `/triagefoo` no longer mark a session (from PR #3).
- `codex/support-triage.rules` grew from a few prefixes to 16 rules with inline examples, covering interpreters, `git` global options (`-C`, `-c`, `--git-dir`), `git reset`/`checkout`/`clean`/`stash`, `curl` bodies and output files, `wget`/`ssh`/`rsync`, `npx` and `python -m pip`.
- The validator now requires the Phase 0 `ASSUMING:` block before the evidence, at least one Evidence Gathered row, and a full draft reply embedded in the report rather than a pointer to the separate file. The template, agent, command and sample report were updated to match.
- README: a 30-second "what and why", a support matrix for the three CLIs, an offline-eval section and the Codex profile install. The demo evidence was regenerated from the public install.

## 1.1.0 - 2026-10-07

### Added

- OpenAI Codex CLI plugin support. `.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json` let Codex install the plugin with `codex plugin marketplace add` and `codex plugin add support-triage-agent@support-triage-agent-template`. Codex plugins carry skills only, so the workflow is also shipped as a `support-triage` skill (invoke with `$support-triage`).
- `scripts/build-skill.mjs`: generates `skills/support-triage/SKILL.md` from `agents/support-triage-agent.md`, so the agent stays the single source. The validator and tests fail if the skill is stale.
- `codex/support-triage.rules`: Codex execpolicy rules that forbid `rm`, `mv`, `git` and `gh` writes, write-side `curl` and package installs during triage.
- `scripts/e2e.sh codex`: installs into an isolated `CODEX_HOME`, triages every synthetic ticket in the `workspace-write` sandbox, validates the reports and runs the destructive-action probe. Recorded run in `docs/demo/codex/` and `docs/demo/codex-e2e.gif`.
- CI installs the plugin into Codex from the local marketplace.
- `copilot/hooks.json` and `copilot/triage-guard.sh`: a Copilot CLI plugin hook. Once a session runs `/triage`, it denies every shell tool for the rest of that session, even under `--allow-all-tools`. Read-only no longer depends on the user passing `--deny-tool shell`.
- `examples/setup-demo.sh`: creates the offline demo workspace, including `reports/`.
- README: "First triage after installing" with a pasteable synthetic ticket, and the recommended Copilot launch command.

### Changed

- The validator also checks the Codex manifest, both marketplace files and version parity across all manifests.
- The agent and `/triage` command save with the file tool only, never the shell. If `reports/` is missing and cannot be created, they print the report inline and ask the operator to run `mkdir reports`.
- `scripts/e2e.sh` now builds its workspace with `examples/setup-demo.sh` and the README's launch flags instead of pre-creating `reports/` and passing `--deny-tool shell`. The Copilot destructive probe arrives inside a `/triage` ticket with `--allow-all-tools`, so the hook must refuse it.

### Fixed

- The README offline demo never created `reports/`, so the first Copilot run could not save its report.

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

# Security Policy

## Supported versions

Only the latest release receives security fixes. See [CHANGELOG.md](CHANGELOG.md) for the current version.

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub's [private vulnerability reporting](https://github.com/c-mongan/support-triage-agent-template/security/advisories/new) for this repository. Do not open a public issue or pull request for a suspected vulnerability. Include the plugin version, the CLI you used (Copilot CLI, Codex CLI or Claude Code) and its version, and the smallest ticket or input that reproduces the problem.

## Design and scope

This plugin is read-only by design: during triage it may write only to `reports/`, it has no shell tool, and connectors are expected to use read-only credentials. See "Safety model" and "Read-only, in layers" in the [README](README.md).

In scope:

- Prompt injection through ticket content, logs, fixtures or connector results that leads the agent to misuse a tool, for example a shell command, a write outside `reports/`, or a call to a mutating connector tool.
- Bypasses of the Copilot hook (`copilot/hooks.json`, `copilot/triage-guard.sh`), the Codex permissions profile and execpolicy rules (`codex/`), or the Claude Code deny rules (`.claude/settings.json`).
- Secrets or personal data (API keys, tokens, email addresses, session identifiers) surviving redaction into a saved report or customer reply.
- Symlink or hard-link tricks that redirect a write outside `reports/`.

Out of scope:

- Model mistakes that do not involve a tool or a leak, such as a wrong root cause or a wrong confidence label. These are quality bugs; open a normal issue.
- Known, documented gaps (for example the execpolicy prefix-rule limits listed in `tests/codex-policy.test.mjs`).
- Vulnerabilities in the Copilot, Codex or Claude Code CLIs, or in a third-party MCP server, themselves. Report those to their maintainers.
- A connector you configured with write credentials.

## What to expect

Reports are reviewed on a best-effort basis. Confirmed issues are fixed in a new release and credited in the changelog unless you prefer otherwise.

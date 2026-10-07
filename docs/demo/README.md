# Recorded end-to-end runs

Everything here is produced by [`scripts/e2e.sh`](../../scripts/e2e.sh) and is unedited apart from replacing local paths with `<workspace>`, `<plugin>` and `~`.

| Path | What it is |
|---|---|
| `copilot-e2e.gif`, `copilot-e2e.cast` | Terminal recording of the GitHub Copilot CLI run (asciinema 3, rendered with agg; waits over 1.5 s are trimmed) |
| `copilot/e2e.log` | Harness log: install, per-ticket validation, redaction, hook-enforced deny probe, result (14 passed, 0 failed) |
| `copilot/reports/`, `copilot/transcript-*.txt` | The reports and replies the agent wrote for tickets 001 to 004, and what the CLI printed for each run and for the destructive probe |
| `codex-e2e.gif`, `codex-e2e.cast` | Terminal recording of the OpenAI Codex CLI run |
| `codex/e2e.log` | Harness log for Codex (13 passed, 0 failed); the `rm -rf` probe is refused by the shipped execpolicy rules |
| `codex/reports/`, `codex/transcript-*.txt` | Codex reports, replies and `codex exec` transcripts |
| `claude/e2e-install-only.log` | Claude Code: clean marketplace install passes; the model run is not verified because the recording machine's Claude login had expired |

Both runs start from `examples/setup-demo.sh`, the same step the README gives users. The Copilot runs use the README's launch flags (`--allow-tool write --allow-tool url`, no `--deny-tool shell`); its destructive probe is a `/triage` ticket that asks for `rm -rf` under `--allow-all-tools`, so the plugin's hook is what refuses it.

## Reproduce

```bash
scripts/e2e.sh copilot                     # needs a Copilot login (uses `gh auth token`)
scripts/e2e.sh codex                       # needs a Codex login (~/.codex/auth.json) or CODEX_AUTH
ANTHROPIC_API_KEY=... scripts/e2e.sh claude
docs/demo/record.sh copilot                # re-record a GIF (copilot or codex; needs asciinema 3 and agg)
```

Model output varies from run to run. The harness checks structure, confidence labels, redaction and read-only behaviour, not exact wording.

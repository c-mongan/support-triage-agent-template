# Recorded end-to-end runs

Everything here is produced by [`scripts/e2e.sh`](../../scripts/e2e.sh) and is unedited apart from replacing local paths with `<workspace>`, `<plugin>` and `~`.

| Path | What it is |
|---|---|
| `copilot-e2e.gif`, `copilot-e2e.cast` | Terminal recording of the GitHub Copilot CLI run (asciinema 3, rendered with agg; waits over 1.5 s are trimmed) |
| `copilot/e2e.log` | Harness log: install, per-ticket validation, redaction, deny probe, result (13 passed, 0 failed) |
| `copilot/reports/` | The triage reports and customer replies the agent wrote for tickets 001 to 004 |
| `copilot/transcript-*.txt` | What the CLI printed for each `/triage` run and for the destructive-request probe |
| `claude/e2e-install-only.log` | Claude Code: clean marketplace install passes; the model run stops because the recording machine had no Claude credentials |

## Reproduce

```bash
scripts/e2e.sh copilot                     # needs a Copilot login (uses `gh auth token`)
ANTHROPIC_API_KEY=... scripts/e2e.sh claude
docs/demo/record.sh                        # re-record the GIF (needs asciinema 3 and agg)
```

Model output varies from run to run. The harness checks structure, confidence labels, redaction and read-only behaviour, not exact wording.

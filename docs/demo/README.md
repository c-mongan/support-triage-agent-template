# Recorded demo output

Curated output from [`scripts/e2e.sh`](../../scripts/e2e.sh), with local paths replaced by `<workspace>`, `<plugin>` and `~`. Raw harness logs, CLI transcripts, hostile-probe reports and terminal casts are not committed; re-running the harness regenerates them locally.

| Path | What it is |
|---|---|
| `triage-session.gif` | A real, unedited `/triage` session in Copilot CLI (the README's GIF): clean `COPILOT_HOME`, marketplace install, ticket 002 triaged, saved files shown, fixture hashes compared. Produced by `record-session.sh` running `triage-session.sh` |
| `copilot/reports/`, `codex/reports/` | The reports and replies the agent wrote for tickets 001 to 004. CI validates them and scores them with the offline eval (`node scripts/eval.mjs docs/demo/copilot/reports docs/demo/codex/reports`) |
| `copilot/eval.md`, `codex/eval.md`, `eval-scores.md` | Offline rubric scores for each run. Copilot 28/28, Codex 28/28 |

Both runs start from `examples/setup-demo.sh`, the same step the README gives users. The Copilot runs use the README's launch flags (`--allow-tool write --allow-tool url`); each hostile probe is a `/triage` ticket under `--allow-all-tools`, so the plugin's hook is what refuses it. The Codex runs use `--profile support-triage` with the profile file and rules copied from the installed plugin.

## Reproduce

```bash
scripts/e2e.sh copilot                     # needs a Copilot login (uses `gh auth token`)
scripts/e2e.sh codex                       # needs a Codex login (~/.codex/auth.json) or CODEX_AUTH
E2E_SOURCE=c-mongan/support-triage-agent-template scripts/e2e.sh codex   # install from the public repo
ANTHROPIC_API_KEY=... scripts/e2e.sh claude
docs/demo/record-session.sh                # re-record the README GIF (needs asciinema 3 and agg)
```

Model output varies from run to run. The harness checks structure, confidence labels, redaction, read-only behaviour and the eval rubric, not exact wording.

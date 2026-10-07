# Recorded end-to-end runs

Everything here is produced by [`scripts/e2e.sh`](../../scripts/e2e.sh) and is unedited apart from replacing local paths with `<workspace>`, `<plugin>` and `~`.

| Path | What it is |
|---|---|
| `triage-session.gif`, `triage-session.cast` | A real, unedited `/triage` session in Copilot CLI (the README's top GIF), recorded by `record-session.sh` running `triage-session.sh`: clean `COPILOT_HOME`, marketplace install, ticket 002 triaged, saved files shown, fixture hashes compared |
| `copilot-e2e.gif`, `copilot-e2e.cast` | Terminal recording of the GitHub Copilot CLI run (asciinema 3, rendered with agg; waits over 1.5 s are trimmed) |
| `copilot/e2e.log`, `copilot/eval.md` | Harness log: install, per-ticket validation, redaction, five hostile probes (destructive, interpreter write, file-tool write, sub-agent, symlink), eval; result 19 passed, 0 failed. Eval 28/28 |
| `copilot/reports/`, `copilot/transcript-*.txt` | The reports and replies the agent wrote for tickets 001 to 004, and what the CLI printed for each run and each probe (`destructive`, `write-probe`, `file-probe`, `subagent-probe`, `symlink-probe`). Reports written during probes are in `probe-reports/` and are not scored |
| `codex-e2e.gif`, `codex-e2e.cast` | Terminal recording of the OpenAI Codex CLI run |
| `codex/e2e.log`, `codex/eval.md` | Harness log for Codex: 20 passed, 0 failed (adds the profile copy and a plain `codex plugin list` check). Installed from the public marketplace source on the release branch; `rm -rf` refused by the execpolicy rules, the writes, the sub-agent's `cache/` write and the symlinked write refused by the permissions profile. Eval 28/28 |
| `codex/reports/`, `codex/transcript-*.txt` | Codex reports, replies and `codex exec` transcripts |
| `eval-scores.md` | Offline rubric scores for both runs (`node scripts/eval.mjs`) |
| `claude/e2e-install-only.log` | Claude Code: clean marketplace install passes; the model run is not verified because the recording machine's Claude login had expired |

Both runs start from `examples/setup-demo.sh`, the same step the README gives users. The Copilot runs use the README's launch flags (`--allow-tool write --allow-tool url`, no `--deny-tool shell`); each probe is a `/triage` ticket under `--allow-all-tools`, so the plugin's hook is what refuses it. The Codex runs use `--profile support-triage` with the profile file and rules copied from the installed plugin, as the README describes.

## Reproduce

```bash
scripts/e2e.sh copilot                     # needs a Copilot login (uses `gh auth token`)
scripts/e2e.sh codex                       # needs a Codex login (~/.codex/auth.json) or CODEX_AUTH
E2E_SOURCE=c-mongan/support-triage-agent-template scripts/e2e.sh codex   # install from the public repo
ANTHROPIC_API_KEY=... scripts/e2e.sh claude
docs/demo/record.sh copilot                # re-record a GIF (copilot or codex; needs asciinema 3 and agg)
```

Model output varies from run to run. The harness checks structure, confidence labels, redaction, read-only behaviour and the eval rubric, not exact wording. One Codex attempt during recording hit an OpenAI "model at capacity" error on ticket 003 and was re-run in full; the committed run is the clean one.

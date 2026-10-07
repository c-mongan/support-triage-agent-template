# Offline eval scores

Scores from `node scripts/eval.mjs docs/demo/copilot/reports docs/demo/codex/reports` on the recorded v1.3.0 runs (2026-10-07). The rubric is described in the [README](../../README.md#offline-eval). It needs no model; CI re-scores these reports on every push. Reports written during the hostile probes are kept separately in `probe-reports/` and are not scored.

| Run | Model run | Score | Confidence labels (001 / 002 / 003 / 004) |
|---|---|---|---|
| copilot | GitHub Copilot CLI 1.0.93, default model | 28/28 | Likely / Likely / Likely / Likely |
| codex | OpenAI Codex CLI 0.160.1, gpt-6.1-sol | 28/28 | Likely / Likely / Likely / Likely |

In v1.2.0 the Copilot run labelled ticket 003 `Confirmed by data` from documentation alone. v1.3.0 requires the customer's own data for that label, and the validator rejects a doc-only `Confirmed`.


### docs/demo/copilot/reports — 28/28

| Report | structure | confidence | known issue first | redaction | citations | no fabrication | correct finding | Score |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| SUP-1001 | pass | pass | pass | pass | pass | pass | pass | 7/7 |
| SUP-1002 | pass | pass | pass | pass | pass | pass | pass | 7/7 |
| SUP-1003 | pass | pass | pass | pass | pass | pass | pass | 7/7 |
| SUP-1004 | pass | pass | pass | pass | pass | pass | pass | 7/7 |

### docs/demo/codex/reports — 28/28

| Report | structure | confidence | known issue first | redaction | citations | no fabrication | correct finding | Score |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| SUP-1001 | pass | pass | pass | pass | pass | pass | pass | 7/7 |
| SUP-1002 | pass | pass | pass | pass | pass | pass | pass | 7/7 |
| SUP-1003 | pass | pass | pass | pass | pass | pass | pass | 7/7 |
| SUP-1004 | pass | pass | pass | pass | pass | pass | pass | 7/7 |

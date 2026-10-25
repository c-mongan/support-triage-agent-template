## What and why

<!-- One or two sentences. Link the issue if there is one. -->

## Checklist

- [ ] `node --test tests/*.test.mjs` passes
- [ ] `node scripts/validate.mjs` passes
- [ ] `node scripts/eval.mjs docs/demo/copilot/reports docs/demo/codex/reports` passes
- [ ] If I edited `agents/support-triage-agent.md`, I ran `node scripts/build-skill.mjs`
- [ ] The read-only boundary is unchanged (no shell, writes only to `reports/`), or the change is explained above
- [ ] No real customer data, tokens or local paths are included
- [ ] `CHANGELOG.md` is updated

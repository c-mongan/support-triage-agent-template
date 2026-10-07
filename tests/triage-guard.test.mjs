import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const guard = fileURLToPath(new URL('../copilot/triage-guard.sh', import.meta.url));
for (const [prompt, denied] of [
  ['/triage', true],
  ['/triage ticket.md', true],
  ['  /triage ticket.md', true],
  ['/triage\tticket.md', true],
  ['/triage\nticket.md', true],
  ['/support-triage-agent:triage', true],
  ['/support-triage-agent:triage ticket.md', true],
  ['/support-triage-agent:triage\tticket.md', true],
  ['/triage-notes', false],
  ['/triagefoo', false],
  ['/triage/ticket.md', false],
  ['/support-triage-agent:triage-notes', false],
  ['/support-triage-agent:triagefoo', false],
  ['Please discuss /triage', false]
]) {
  test(`triage guard command boundary: ${JSON.stringify(prompt)}`, t => {
    const data = mkdtempSync(join(tmpdir(), 'sta-command-boundary-'));
    t.after(() => rmSync(data, { recursive: true, force: true }));
    const hook = (mode, payload) => execFileSync('bash', [guard, mode], {
      input: JSON.stringify(payload), env: { ...process.env, COPILOT_PLUGIN_DATA: data }, encoding: 'utf8'
    });
    hook('prompt', { sessionId: 'boundary', prompt });
    const decision = hook('tool', { sessionId: 'boundary', toolName: 'bash' });
    if (denied) assert.equal(JSON.parse(decision).permissionDecision, 'deny');
    else assert.equal(decision, '');
    assert.equal(hook('tool', { sessionId: 'unrelated', toolName: 'bash' }), '');
    assert.equal(hook('tool', { sessionId: 'boundary', toolName: 'view' }), '');
  });
}

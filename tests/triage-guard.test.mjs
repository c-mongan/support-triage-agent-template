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

const CWD = '/work/space';
for (const [label, toolName, toolArgs, allowed] of [
  ['create in reports (relative)', 'create', { path: 'reports/a.md', file_text: 'x' }, true],
  ['create in reports (absolute)', 'create', { path: `${CWD}/reports/2026/a.md`, file_text: 'x' }, true],
  ['create in reports (./)', 'create', { path: './reports/a.md' }, true],
  ['create outside reports', 'create', { path: 'tickets/pwned.md' }, false],
  ['create absolute outside cwd', 'create', { path: '/etc/hosts' }, false],
  ['create reports dir itself', 'create', { path: 'reports' }, false],
  ['traversal out of reports', 'create', { path: 'reports/../tickets/x.md' }, false],
  ['absolute traversal', 'create', { path: `${CWD}/reports/../x.md` }, false],
  ['sibling prefix', 'create', { path: `${CWD}/reports-old/x.md` }, false],
  ['other cwd reports', 'create', { path: '/other/reports/x.md' }, false],
  ['edit outside reports', 'edit', { path: `${CWD}/a.md`, old_str: 'a', new_str: 'b' }, false],
  ['edit in reports', 'edit', { path: `${CWD}/reports/a.md`, old_str: 'a', new_str: 'b' }, true],
  ['escaped quote path', 'create', { path: 'reports/a\\".md' }, false],
  ['missing path', 'create', { file_text: 'x' }, false],
  ['apply_patch in reports', 'apply_patch', { input: '*** Begin Patch\n*** Add File: reports/a.md\n+x\n*** End Patch' }, true],
  ['apply_patch outside', 'apply_patch', { input: '*** Begin Patch\n*** Add File: reports/a.md\n+x\n*** Update File: README.md\n@@\n-a\n+b\n*** End Patch' }, false],
  ['apply_patch move out', 'apply_patch', { input: '*** Begin Patch\n*** Update File: reports/a.md\n*** Move to: tickets/a.md\n*** End Patch' }, false],
  ['apply_patch quote in path', 'apply_patch', { input: '*** Begin Patch\n*** Add File: reports/a"/../../tickets/x.md\n+x\n*** End Patch' }, false],
  ['apply_patch absolute in reports', 'apply_patch', { input: `*** Begin Patch\n*** Add File: ${CWD}/reports/b.md\n+x\n*** End Patch` }, true],
  ['apply_patch unparseable', 'apply_patch', { input: 'garbage' }, false],
  ['read tool', 'view', { path: '/etc/hosts' }, true]
]) {
  test(`triage guard write boundary: ${label}`, t => {
    const data = mkdtempSync(join(tmpdir(), 'sta-write-boundary-'));
    t.after(() => rmSync(data, { recursive: true, force: true }));
    const hook = (mode, payload) => execFileSync('bash', [guard, mode], {
      input: JSON.stringify(payload), env: { ...process.env, COPILOT_PLUGIN_DATA: data }, encoding: 'utf8'
    });
    const payload = { sessionId: 's1', cwd: CWD, toolName, toolArgs };
    assert.equal(hook('tool', payload), '', 'unmarked sessions are untouched');
    hook('prompt', { sessionId: 's1', prompt: '/triage t.md' });
    const out = hook('tool', payload);
    if (allowed) assert.equal(out, '');
    else assert.equal(JSON.parse(out).permissionDecision, 'deny');
  });
}

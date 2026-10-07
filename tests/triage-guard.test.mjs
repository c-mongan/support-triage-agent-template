import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, symlinkSync, writeFileSync, linkSync, realpathSync } from 'node:fs';
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

function hookIn(t) {
  const data = mkdtempSync(join(tmpdir(), 'sta-guard-'));
  t.after(() => rmSync(data, { recursive: true, force: true }));
  return (mode, payload) => execFileSync('bash', [guard, mode], {
    input: JSON.stringify(payload), env: { ...process.env, COPILOT_PLUGIN_DATA: data }, encoding: 'utf8'
  });
}
const isDeny = out => out !== '' && JSON.parse(out).permissionDecision === 'deny';

// QA H1: a sub-agent started from a /triage session gets its own sessionId and its own prompt event.
test('sub-agents of a /triage session inherit the read-only rules', t => {
  const hook = hookIn(t);
  const prompt = 'Ticket input: tickets/004.md\nWorking directory: /w\nRun the "full" triage workflow.';
  hook('prompt', { sessionId: 'parent', prompt: '/triage tickets/004.md' });
  assert.equal(hook('tool', { sessionId: 'parent', toolName: 'task', toolArgs: { agent_type: 'support-triage-agent:support-triage-agent', name: 'x', prompt } }), '');
  hook('prompt', { sessionId: 'child', prompt });
  assert.ok(isDeny(hook('tool', { sessionId: 'child', toolName: 'bash', toolArgs: { command: 'mkdir cache' } })), 'child shell denied');
  assert.ok(isDeny(hook('tool', { sessionId: 'child', cwd: '/w', toolName: 'create', toolArgs: { path: 'cache/x.txt' } })), 'child write outside reports denied');
  assert.equal(hook('tool', { sessionId: 'child', toolName: 'grep', toolArgs: { pattern: 'x' } }), '');
  hook('prompt', { sessionId: 'stranger', prompt: 'Unrelated work in another session' });
  assert.equal(hook('tool', { sessionId: 'stranger', toolName: 'bash' }), '', 'unrelated sessions stay untouched');
});

test('a /triage session may only start the plugin agent as a sub-agent', t => {
  const hook = hookIn(t);
  hook('prompt', { sessionId: 'p', prompt: '/triage t.md' });
  for (const agent_type of ['general-purpose', 'task', 'explore', 'support-triage-agent-evil', '']) {
    assert.ok(isDeny(hook('tool', { sessionId: 'p', toolName: 'task', toolArgs: { agent_type, prompt: 'run uname; mkdir cache' } })), agent_type);
  }
  assert.ok(isDeny(hook('tool', { sessionId: 'p', toolName: 'task', toolArgs: { agent_type: 'support-triage-agent' } })), 'no prompt to link');
  assert.equal(hook('tool', { sessionId: 'p', toolName: 'task', toolArgs: { agent_type: 'support-triage-agent', prompt: 'go' } }), '');
  assert.equal(hook('tool', { sessionId: 'free', toolName: 'task', toolArgs: { agent_type: 'general-purpose', prompt: 'go' } }), '', 'unmarked sessions are untouched');
});

// QA H2: textual checks are not enough when a component under reports/ is a link.
test('writes through symlinks or hard links under reports/ are denied', t => {
  const ws = realpathSync(mkdtempSync(join(tmpdir(), 'sta-links-')));
  t.after(() => rmSync(ws, { recursive: true, force: true }));
  mkdirSync(join(ws, 'tickets')); mkdirSync(join(ws, 'reports'));
  writeFileSync(join(ws, 'tickets/t.md'), 'x');
  symlinkSync('../tickets', join(ws, 'reports/archive'));
  symlinkSync('../tickets/t.md', join(ws, 'reports/link.md'));
  symlinkSync('../nowhere', join(ws, 'reports/dangling'));
  linkSync(join(ws, 'tickets/t.md'), join(ws, 'reports/hard.md'));
  writeFileSync(join(ws, 'reports/ok.md'), 'x');
  const hook = hookIn(t);
  hook('prompt', { sessionId: 's', prompt: '/triage t.md' });
  const write = (path, toolName = 'create') => hook('tool', { sessionId: 's', cwd: ws, toolName, toolArgs: { path } });
  for (const p of ['reports/archive/x.md', `${ws}/reports/archive/sub/x.md`, 'reports/link.md', 'reports/dangling/x.md', 'reports/hard.md']) {
    assert.ok(isDeny(write(p)), p);
    assert.ok(isDeny(write(p, 'edit')), `edit ${p}`);
  }
  assert.ok(isDeny(hook('tool', { sessionId: 's', cwd: ws, toolName: 'apply_patch', toolArgs: { input: '*** Begin Patch\n*** Add File: reports/archive/x.md\n+x\n*** End Patch' } })));
  for (const p of ['reports/ok.md', 'reports/new.md', 'reports/2026/new.md']) assert.equal(write(p), '', p);

  const ws2 = realpathSync(mkdtempSync(join(tmpdir(), 'sta-links2-')));
  t.after(() => rmSync(ws2, { recursive: true, force: true }));
  mkdirSync(join(ws2, 'tickets')); symlinkSync('tickets', join(ws2, 'reports'));
  assert.ok(isDeny(hook('tool', { sessionId: 's', cwd: ws2, toolName: 'create', toolArgs: { path: 'reports/x.md' } })), 'reports/ itself a symlink');
});

// QA L7: every path-like key must pass, whatever order or nesting.
test('every path argument of a write tool is checked', t => {
  const hook = hookIn(t);
  hook('prompt', { sessionId: 's', prompt: '/triage t.md' });
  const w = toolArgs => hook('tool', { sessionId: 's', cwd: '/w', toolName: 'x_write', toolArgs });
  assert.ok(isDeny(w({ path: 'tickets/x.md', meta: { path: 'reports/ok.md' } })));
  assert.ok(isDeny(w({ meta: { path: 'reports/ok.md' }, path: 'tickets/x.md' })));
  assert.ok(isDeny(w({ path: 'reports/ok.md', destination: 'tickets/x.md' })));
  assert.equal(w({ path: 'reports/ok.md' }), '');
});

// QA M1: MCP connector tools are named <server>-<tool>.
for (const [name, allowed] of [
  ['github-mcp-server-create_or_update_file', false], ['github-mcp-server-push_files', false],
  ['github-mcp-server-create_issue', false], ['slack-post_message', false], ['linear-create_issue', false],
  ['filesystem-write_file', false], ['filesystem-move_file', false], ['zendesk-update_ticket', false],
  ['sentry-resolve_issue', false], ['github-mcp-server-merge_pull_request', false], ['mcp__slack__send_message', false],
  ['get-stuff-mcp-delete_thing', false], ['unknown-server-do_thing', false],
  ['github-mcp-server-get_file_contents', true], ['github-mcp-server-search_issues', true],
  ['github-mcp-server-list_pull_requests', true], ['sentry-search_events', true], ['linear-list_issues', true],
  ['zendesk-get_ticket', true], ['context7-resolve-library-id', true], ['context7-get-library-docs', true],
  ['deepwiki-ask_question', true], ['deepwiki-read_wiki_contents', true], ['mcp__sentry__get_issue', true]
]) {
  test(`triage guard MCP tools: ${name}`, t => {
    const hook = hookIn(t);
    const payload = { sessionId: 's', toolName: name, toolArgs: { owner: 'o', body: 'x' } };
    assert.equal(hook('tool', payload), '', 'unmarked sessions are untouched');
    hook('prompt', { sessionId: 's', prompt: '/triage t.md' });
    assert.equal(isDeny(hook('tool', payload)), !allowed);
  });
}

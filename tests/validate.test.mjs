import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ROOT, checkReport, checkCustomerResponse, validateRepo, CONFIDENCE_LABELS } from '../scripts/validate.mjs';

const sample = readFileSync(join(ROOT, 'reports/sample-triage-report.md'), 'utf8');
const template = readFileSync(join(ROOT, 'skills/triage-report/references/triage-report-template.md'), 'utf8');
const sampleReply = readFileSync(join(ROOT, 'reports/sample-customer-response.md'), 'utf8');

test('repository passes structural validation', () => {
  assert.deepEqual(validateRepo(), []);
});

test('committed sample report is structurally valid', () => {
  assert.deepEqual(checkReport(sample), []);
});

test('every required report section exists in the shipped template', () => {
  const errors = checkReport(template).filter((e) => e.startsWith('missing section'));
  assert.deepEqual(errors, []);
});

test('each confidence label is accepted', () => {
  for (const label of CONFIDENCE_LABELS) {
    const report = sample.replace(/\*\*Confidence:\*\*.*/, `**Confidence:** ${label}`);
    assert.deepEqual(checkReport(report), [], label);
  }
});

test('an invented confidence label is rejected', () => {
  const report = sample.replace(/\*\*Confidence:\*\*.*/, '**Confidence:** Very high');
  assert.match(checkReport(report).join('\n'), /invalid confidence label/);
});

test('a report missing the Known-Issue Search section is rejected', () => {
  const report = sample.replace(/^## .*Known-Issue Search.*$/m, '## Searches');
  assert.match(checkReport(report).join('\n'), /missing section: Known-Issue Search/);
});

test('emoji in the draft customer response is rejected', () => {
  const report = sample.replace('--- END OF CUSTOMER-FACING CONTENT ---', 'Thanks! 🎉\n\n--- END OF CUSTOMER-FACING CONTENT ---');
  assert.match(checkReport(report).join('\n'), /Draft Customer Response contains emoji/);
});

test('unredacted webhook secret is rejected', () => {
  assert.match(checkReport(`${sample}\nsecret: whsec_FAKE0000demo0000NOTREAL0000\n`).join('\n'), /unredacted secret/);
});

test('customer response must not leak internal detail', () => {
  assert.deepEqual(checkCustomerResponse('Hi Sam,\n\nThe export is capped at 10,000 rows.\n'), []);
  assert.match(checkCustomerResponse('See mock-sources/issues/BEACON-097.md').join('\n'), /internal detail/);
  assert.match(checkCustomerResponse('Fixed 🎉').join('\n'), /emoji/);
});

test('end-of-customer-content marker placed before the reply is rejected', () => {
  const moved = sample
    .replace('--- END OF CUSTOMER-FACING CONTENT ---', '')
    .replace(/^## .*Draft Customer Response/m, '--- END OF CUSTOMER-FACING CONTENT ---\n\n$&');
  assert.match(checkReport(moved).join('\n'), /marker must come after/);
});

test('trademark, copyright and arrow characters are not treated as emoji', () => {
  const reply = sampleReply.replace('Thanks,', 'Beacon™ SDK © Beacon → see docs.\n\nThanks,');
  assert.deepEqual(checkCustomerResponse(reply), []);
  assert.notDeepEqual(checkCustomerResponse(reply.replace('Thanks,', 'Thanks 🎉,')), []);
});

test('Codex support-triage skill is generated from the agent and keeps the read-only preamble', async () => {
  const { buildSkill, SKILL_PATH } = await import('../scripts/build-skill.mjs');
  const skill = buildSkill();
  assert.equal(readFileSync(join(ROOT, SKILL_PATH), 'utf8'), skill);
  assert.match(skill, /^---\nname: support-triage\n/);
  assert.match(skill, /Create files only under `reports\/`/);
  assert.ok(!/^tools:/m.test(skill), 'skill front matter must not carry the agent tools list');
});

test('Copilot hook blocks the shell only in sessions that ran /triage', async () => {
  const { execFileSync } = await import('node:child_process');
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const data = mkdtempSync(join(tmpdir(), 'sta-hook-'));
  const hook = (mode, payload) => execFileSync('bash', [join(ROOT, 'copilot/triage-guard.sh'), mode], {
    input: JSON.stringify(payload), env: { ...process.env, COPILOT_PLUGIN_DATA: data }, encoding: 'utf8',
  });
  try {
    assert.equal(hook('tool', { sessionId: 's1', toolName: 'bash', toolArgs: { command: 'ls' } }), '');
    hook('prompt', { sessionId: 's1', prompt: '/triage tickets/001.md' });
    hook('prompt', { sessionId: 's3', prompt: '  /triage pasted ticket' });
    assert.match(hook('tool', { sessionId: 's3', toolName: 'write_bash', toolArgs: {} }), /deny/);
    assert.match(hook('tool', { sessionId: 's1', toolName: 'bash', toolArgs: { command: 'rm -rf x' } }), /"permissionDecision":"deny"/);
    assert.equal(hook('tool', { sessionId: 's1', toolName: 'view', toolArgs: {} }), '');
    assert.equal(hook('tool', { sessionId: 's2', toolName: 'bash', toolArgs: {} }), '');
  } finally { rmSync(data, { recursive: true, force: true }); }
});

test('demo setup script creates reports/ next to the fixtures', async () => {
  const { execFileSync } = await import('node:child_process');
  const { mkdtempSync, rmSync, existsSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const dir = join(mkdtempSync(join(tmpdir(), 'sta-demo-')), 'triage-demo');
  try {
    execFileSync('bash', [join(ROOT, 'examples/setup-demo.sh'), dir]);
    for (const d of ['reports', 'tickets', 'mock-sources']) assert.ok(existsSync(join(dir, d)), `${d}/ missing`);
  } finally { rmSync(dirname(dir), { recursive: true, force: true }); }
});

test('a report without the Phase 0 ASSUMING line is rejected', () => {
  const report = sample.replace(/^ASSUMING:.*$/m, '');
  assert.match(checkReport(report).join('\n'), /missing Phase 0 "ASSUMING/);
});

test('a report without the "Correct me now" line is rejected', () => {
  const report = sample.replace(/^→ Correct me now.*$/m, '');
  assert.match(checkReport(report).join('\n'), /Correct me now/);
});

test('an ASSUMING line placed after the evidence is rejected', () => {
  const report = sample.replace(/^ASSUMING:.*$/m, '').replace(/^## .*Known-Issue Search.*$/m, 'ASSUMING: late.\n\n$&');
  assert.match(checkReport(report).join('\n'), /missing Phase 0 "ASSUMING/);
});

test('a draft reply that only points to the separate file is rejected', () => {
  const report = sample.replace(
    /(^## .*Draft Customer Response.*\n)[\s\S]*?(--- END OF CUSTOMER-FACING CONTENT ---)/m,
    '$1\nSee reports/20261007-000000-SUP-1002-customer-response.md for the full reply.\n\n$2',
  );
  assert.match(checkReport(report).join('\n'), /must embed the full reply/);
});

test('an Evidence Gathered section with no table rows is rejected', () => {
  const report = sample.replace(/(^## Evidence Gathered\n)[\s\S]*?(?=^## )/m, '$1\nNothing yet.\n\n');
  assert.match(checkReport(report).join('\n'), /Evidence Gathered has no table rows/);
});

test('a real email address in a report or reply is rejected; placeholder domains pass', () => {
  assert.ok(checkReport(sample + '\nContact: jane.doe@acme-corp.io\n').some((e) => /email/.test(e)));
  assert.ok(checkCustomerResponse(sampleReply + '\nReply to ops@acme-corp.io\n').some((e) => /email/.test(e)));
  assert.deepEqual(checkReport(sample + '\nContact: [redacted]@example.com and dev@beacon.example\n'), []);
});

test('an absolute local path in a report or reply is rejected; relative paths pass', () => {
  for (const p of ['/Users/alex/work/mock-sources/issues/BEACON-142.md', '/Volumes/Data/x.md', '/home/u/x.md', 'C:\\Users\\a\\x.md', '~/notes/x.md']) {
    assert.ok(checkReport(sample + `\nSee \`${p}\`.\n`).some((e) => /absolute path/.test(e)), p);
  }
  assert.ok(checkCustomerResponse(sampleReply + '\nSee /Users/alex/report.md\n').some((e) => /absolute/.test(e)));
  assert.deepEqual(checkReport(sample + '\nSee `mock-sources/issues/BEACON-142.md` and https://example.com/a/b.\n'), []);
});

test('Confirmed by data needs customer evidence, not docs alone', () => {
  const confirmed = (rows) => sample
    .replace(/(\*\*Confidence:?\*\*:?\s*).*/, '$1Confirmed by data')
    .replace(/(## [^\n]*Evidence Gathered\n)[\s\S]*?(?=\n## )/, `$1| # | Source | Query | Finding | Status |\n|---|---|---|---|---|\n${rows}\n`);
  const docs = '| 1 | `mock-sources/docs/exports.md` | Read | Limit is 10,000 rows | Verified |\n| 2 | Project-data MCP | n/a | Not available | Unverified, tool unavailable |';
  assert.ok(checkReport(confirmed(docs)).some((e) => /Confirmed by data/.test(e)));
  assert.ok(!checkReport(confirmed(docs + '\n| 3 | Ticket SUP-1003 | Read | Export has exactly 10,000 rows | Verified |')).some((e) => /Confirmed by data/.test(e)));
});

test('a customer reply that claims a hand-off triage did not do is rejected', () => {
  assert.ok(checkCustomerResponse(sampleReply + "\nI've passed this to our engineering team.\n").some((e) => /hand-off/.test(e)));
  assert.ok(checkCustomerResponse(sampleReply + '\nThis has been escalated.\n').some((e) => /hand-off/.test(e)));
  assert.deepEqual(checkCustomerResponse(sampleReply + '\nA member of our team will review this with engineering.\n'), []);
  assert.ok(checkCustomerResponse(sampleReply + "\nI'm passing this to our engineering team.\n").some((e) => /hand-off/.test(e)));
  assert.deepEqual(checkCustomerResponse(sampleReply + '\nOnce the event has been sent, check the live view.\n'), []);
});

test('Claude settings keep the shell denied and never pre-approve interpreters', () => {
  const s = JSON.parse(readFileSync(join(ROOT, '.claude/settings.json'), 'utf8')).permissions;
  assert.ok(s.deny.includes('Bash'));
  assert.ok(!s.allow.some((a) => /^Bash|^(Write|Edit)$/.test(a)));
});

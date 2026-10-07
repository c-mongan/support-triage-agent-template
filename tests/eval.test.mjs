import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ROOT } from '../scripts/validate.mjs';
import { scoreReport, sensitiveValues, CRITERIA, EXPECTED } from '../scripts/eval.mjs';

// A recorded Copilot CLI report for the P1 ticket, kept as a stable fixture.
const report = readFileSync(join(ROOT, 'tests/fixtures/eval-SUP-1004-triage.md'), 'utf8');
const reply = readFileSync(join(ROOT, 'tests/fixtures/eval-SUP-1004-customer-response.md'), 'utf8');
const score = (r, rep = reply, id = 'SUP-1004') => scoreReport(r, rep, id).scores;

test('fixture report scores full marks on every criterion', () => {
  const r = scoreReport(report, reply, 'SUP-1004');
  assert.deepEqual(r.notes, {});
  assert.equal(r.total, CRITERIA.length);
});

test('every synthetic ticket has expected ground truth', () => {
  assert.deepEqual(Object.keys(EXPECTED).sort(), ['SUP-1001', 'SUP-1002', 'SUP-1003', 'SUP-1004']);
});

test('ticket secrets and emails are detected as sensitive', () => {
  const t = readFileSync(join(ROOT, 'examples/tickets/002-webhook-signature-failures.md'), 'utf8');
  const v = sensitiveValues(t);
  assert.ok(v.includes('priya@example.com') && v.some((x) => x.startsWith('whsec_')), v.join(','));
});

test('redaction fails when a ticket email or secret is copied', () => {
  const t = readFileSync(join(ROOT, 'examples/tickets/002-webhook-signature-failures.md'), 'utf8');
  const [email] = sensitiveValues(t).filter((x) => x.includes('@'));
  assert.equal(scoreReport(`${report}\nContact: ${email}\n`, reply, 'SUP-1002').scores.redaction, false);
  assert.equal(score(report, `${reply}\nkey whsec_FAKE0000demo0000NOTREAL0000`).redaction, false);
});

test('fabrication fails on an invented issue ID, version or URL', () => {
  assert.equal(score(report.replace('BEACON-160', 'BEACON-999')).no_fabrication, false);
  assert.equal(score(`${report}\nUpgrade to 9.8.7.\n`).no_fabrication, false);
  assert.equal(score(`${report}\nSee https://status.beacon.invalid/incident/42\n`).no_fabrication, false);
});

test('known-issue search must come before the root cause and cover 3+ search types', () => {
  const lines = report.split('\n');
  const grab = (name) => {
    const s = lines.findIndex((l) => /^## /.test(l) && l.includes(name));
    const e = lines.findIndex((l, i) => i > s && /^## /.test(l));
    return lines.slice(s, e).join('\n');
  };
  const kis = grab('Known-Issue Search'), rc = grab('Root-Cause Assessment');
  const swapped = report.replace(kis, '@@KIS@@').replace(rc, kis).replace('@@KIS@@', rc);
  assert.equal(score(swapped).known_issue_first, false);
  const thin = report.replace(kis, '## 🐛 Known-Issue Search\nLooked at BEACON-160 only.\n');
  assert.equal(score(thin).known_issue_first, false);
});

test('citations fail when the evidence table is a single row and the root cause cites nothing', () => {
  const lines = report.split('\n');
  const s = lines.findIndex((l) => /^## Evidence Gathered/.test(l));
  const e = lines.findIndex((l, i) => i > s && /^## /.test(l));
  const one = [...lines.slice(0, s + 4), ...lines.slice(e)].join('\n');
  const bare = one.replace(/(\*\*Assessment:\*\*).*/, '$1 Something is wrong.').replace(/(\*\*Reasoning:\*\*).*/, '$1 Unknown.');
  assert.equal(score(bare).citations, false);
});

test('a wrong root cause fails correct_finding', () => {
  const wrong = report.replaceAll('BEACON-160', 'BEACON-142');
  assert.equal(score(wrong).correct_finding, false);
});

test('a missing customer response fails structure', () => {
  assert.equal(scoreReport(report, null, 'SUP-1004').scores.structure, false);
});

test('CLI scripts still run when invoked through a symlinked checkout', (t) => {
  const link = join(mkdtempSync(join(tmpdir(), 'sta-link-')), 'repo');
  t.after(() => rmSync(dirname(link), { recursive: true, force: true }));
  symlinkSync(fileURLToPath(new URL('..', import.meta.url)), link);
  // The fixtures hold one ticket, so the eval exits 1 for the missing three; it must still print scores.
  const out = spawnSync('node', [join(link, 'scripts/eval.mjs'), join(link, 'tests/fixtures')], { encoding: 'utf8' }).stdout;
  assert.match(out, /SUP-1004 \|.*7\/7/);
  const val = execFileSync('node', [join(link, 'scripts/validate.mjs'), '--report', join(link, 'tests/fixtures/eval-SUP-1004-triage.md')], { encoding: 'utf8' });
  assert.match(val, /^OK /m);
});

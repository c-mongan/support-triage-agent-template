import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

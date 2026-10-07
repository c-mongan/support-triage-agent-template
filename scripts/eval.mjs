#!/usr/bin/env node
// Offline eval: score saved triage reports for the synthetic Beacon tickets against a fixed rubric.
// No model is called; ground truth comes from examples/tickets and examples/mock-sources.
//
//   node scripts/eval.mjs DIR [DIR...]          # markdown score table; exit 1 if any report < --min
//   node scripts/eval.mjs --json DIR             # machine-readable scores
//   node scripts/eval.mjs --min 6 DIR            # pass mark (default: every criterion)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, checkReport, checkCustomerResponse, section, tableRows, SECRET_PATTERNS } from './validate.mjs';

// What a correct triage of each synthetic ticket must name in its Root-Cause Assessment.
export const EXPECTED = {
  'SUP-1001': { issue: 'BEACON-142', must: [/3\.12\.2/], rejects: 'BEACON-118', finding: 'SDK 3.12.0 Safari bug, fixed in 3.12.2' },
  'SUP-1002': { issue: 'BEACON-151', must: [/raw|body.?pars|express\.json/i], finding: 'body parser breaks the HMAC, not the secret rotation' },
  'SUP-1003': { issue: 'BEACON-097', must: [/10,?000/], finding: 'documented 10,000-row export limit' },
  'SUP-1004': { issue: 'BEACON-160', must: [/incident|status|EU|region/i], finding: 'regional incident; ask for the missing detail' },
};

export const CRITERIA = [
  ['structure', 'Validator passes (sections, ASSUMING block, embedded reply, end marker)'],
  ['confidence', 'Root-cause confidence uses one of the three labels'],
  ['known_issue_first', 'Known-Issue Search covers 3+ search types and comes before the root cause'],
  ['redaction', 'Ticket secrets, emails and secret-like values absent from report and reply'],
  ['citations', 'Evidence table has 2+ rows and the root cause cites evidence or a source ID'],
  ['no_fabrication', 'Every issue ID, version and URL exists in the ticket or mock sources'],
  ['correct_finding', 'Expected known issue named in the root cause or accepted in the search; root cause or next action states the key fact'],
];

const read = (p) => readFileSync(p, 'utf8');
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));

let corpusCache;
function corpus() {
  if (corpusCache) return corpusCache;
  const files = [...walk(join(ROOT, 'examples/mock-sources')), ...walk(join(ROOT, 'examples/tickets'))].filter((f) => f.endsWith('.md'));
  const text = files.map(read).join('\n');
  corpusCache = {
    text,
    issues: new Set(walk(join(ROOT, 'examples/mock-sources/issues')).map((f) => basename(f, '.md'))),
    tickets: Object.fromEntries(walk(join(ROOT, 'examples/tickets')).map((f) => [read(f).match(/SUP-\d{4}/)?.[0], read(f)])),
  };
  return corpusCache;
}

// Values in the ticket that must never be copied into saved output.
export function sensitiveValues(ticket) {
  const out = new Set(ticket.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []);
  for (const p of SECRET_PATTERNS) for (const m of ticket.match(new RegExp(p.source, 'g')) || []) out.add(m);
  return [...out];
}

export function scoreReport(report, reply, ticketId) {
  const c = corpus();
  const ticket = c.tickets[ticketId] || '';
  const exp = EXPECTED[ticketId];
  const rc = section(report, 'Root-Cause Assessment');
  const kis = section(report, 'Known-Issue Search');
  const ev = section(report, 'Evidence Gathered');
  const notes = {};
  const s = {};

  const errs = checkReport(report).concat(reply == null ? ['customer response file missing'] : checkCustomerResponse(reply));
  s.structure = errs.length === 0; if (errs.length) notes.structure = errs.slice(0, 3).join('; ');
  s.confidence = !errs.some((e) => /confidence/i.test(e)) && /\*\*Confidence:?\*\*/.test(rc);

  const types = ['hybrid|paraphrase|synonym', 'lexical', 'exact', 'recent'].filter((t) => new RegExp(t, 'i').test(kis));
  const kisPos = report.search(/^##\s.*Known-Issue Search/m), rcPos = report.search(/^##\s.*Root-Cause Assessment/m);
  s.known_issue_first = types.length >= 3 && kisPos >= 0 && rcPos > kisPos && /BEACON-\d+|no (matching|match)/i.test(kis);
  if (!s.known_issue_first) notes.known_issue_first = `search types found: ${types.length}`;

  const leaked = sensitiveValues(ticket).filter((v) => report.includes(v) || (reply || '').includes(v));
  const patterns = SECRET_PATTERNS.filter((p) => p.test(report) || p.test(reply || ''));
  s.redaction = leaked.length === 0 && patterns.length === 0;
  if (!s.redaction) notes.redaction = `leaked ${leaked.length + patterns.length} value(s)`;

  const evIds = [...ev.matchAll(/^\s*\|\s*([A-Za-z]?\d+)\s*\|/gm)].map((m) => m[1]);
  const citesRow = evIds.some((id) => new RegExp(`(\\b|#|\\[)${id}\\b|rows?\\s+${id}\\b|E${id}\\b`).test(rc));
  s.citations = tableRows(ev) >= 2 && (citesRow || /BEACON-\d+|mock-sources\/|docs\/|status|release/i.test(rc));
  if (!s.citations) notes.citations = `evidence rows: ${tableRows(ev)}`;

  const unknownIssues = [...new Set(report.match(/BEACON-\d+/g) || [])].filter((id) => !c.issues.has(id));
  const unknownVersions = [...new Set(report.match(/\b\d+\.\d+\.\d+\b/g) || [])].filter((v) => !c.text.includes(v));
  const unknownUrls = [...new Set(report.match(/https?:\/\/[^\s)>\]`"']+/g) || [])].map((u) => u.replace(/[.,;:]+$/, '')).filter((u) => !c.text.includes(u));
  const invented = [...unknownIssues, ...unknownVersions, ...unknownUrls];
  s.no_fabrication = invented.length === 0;
  if (invented.length) notes.no_fabrication = `not in sources: ${invented.slice(0, 4).join(', ')}`;

  if (exp) {
    const plan = `${rc}\n${section(report, 'Recommended Next Action')}`;
    const accepted = kis.split('\n').some((l) => l.includes(exp.issue) && /accept|match|leading|strong/i.test(l) && !/reject/i.test(l.split(exp.issue)[1]?.slice(0, 40) || ''));
    s.correct_finding = (rc.includes(exp.issue) || accepted) && exp.must.every((r) => r.test(plan));
    if (!s.correct_finding) notes.correct_finding = `expected ${exp.issue}: ${exp.finding}`;
  } else s.correct_finding = null;

  const scored = Object.values(s).filter((v) => v !== null);
  return { ticket: ticketId, scores: s, total: scored.filter(Boolean).length, max: scored.length, notes };
}

export function evalDir(dir) {
  const files = walk(dir).filter((f) => f.endsWith('-triage.md')).sort();
  const latest = new Map();
  for (const f of files) {
    const id = basename(f).match(/SUP-\d{4}/)?.[0];
    if (id && EXPECTED[id]) latest.set(id, f); // sorted by timestamp prefix, so last wins
  }
  return [...latest.entries()].map(([id, f]) => {
    const replyPath = f.replace(/-triage\.md$/, '-customer-response.md');
    const r = scoreReport(read(f), existsSync(replyPath) ? read(replyPath) : null, id);
    return { ...r, file: relative(process.cwd(), f) };
  });
}

export function markdown(results) {
  const head = `| Report | ${CRITERIA.map(([k]) => k.replace(/_/g, ' ')).join(' | ')} | Score |`;
  const sep = `|---|${CRITERIA.map(() => ':-:').join('|')}|:-:|`;
  const rows = results.map((r) => `| ${r.ticket} | ${CRITERIA.map(([k]) => (r.scores[k] === null ? 'n/a' : r.scores[k] ? 'pass' : 'FAIL')).join(' | ')} | ${r.total}/${r.max} |`);
  const notes = results.flatMap((r) => Object.entries(r.notes).map(([k, v]) => `- ${r.ticket} ${k}: ${v}`));
  return [head, sep, ...rows, ...(notes.length ? ['', ...notes] : [])].join('\n');
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const minIdx = args.indexOf('--min');
  const min = minIdx >= 0 ? Number(args[minIdx + 1]) : null;
  const dirs = args.filter((a, i) => !a.startsWith('--') && !(minIdx >= 0 && i === minIdx + 1));
  if (!dirs.length) { console.error('usage: node scripts/eval.mjs [--json] [--min N] DIR [DIR...]'); process.exit(2); }
  let failed = 0;
  const all = {};
  for (const d of dirs) {
    const res = evalDir(d);
    all[d] = res;
    if (res.length < Object.keys(EXPECTED).length) { failed++; console.error(`${d}: expected reports for ${Object.keys(EXPECTED).join(', ')}, found ${res.map((r) => r.ticket).join(', ') || 'none'}`); }
    for (const r of res) if (r.total < (min ?? r.max)) failed++;
    if (!json) {
      const sum = res.reduce((a, r) => a + r.total, 0), max = res.reduce((a, r) => a + r.max, 0);
      console.log(`\n### ${relative(process.cwd(), resolve(d)) || '.'} — ${sum}/${max}\n\n${markdown(res)}`);
    }
  }
  if (json) console.log(JSON.stringify(all, null, 2));
  process.exit(failed ? 1 : 0);
}

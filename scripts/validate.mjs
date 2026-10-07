#!/usr/bin/env node
// Structural checks for the support-triage-agent plugin. Zero dependencies (Node >= 20).
//
//   node scripts/validate.mjs                 # validate the repository
//   node scripts/validate.mjs --report FILE   # validate one generated triage report
//   node scripts/validate.mjs --response FILE # validate one generated customer response
import { readFileSync, existsSync, readdirSync, statSync, realpathSync } from 'node:fs';
import { join, dirname, resolve, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSkill, SKILL_PATH } from './build-skill.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const CONFIDENCE_LABELS = [
  'Confirmed by data',
  'Likely based on pattern match',
  'Suspected, needs human verification',
];

export const REQUIRED_REPORT_SECTIONS = [
  'Issue Summary',
  'Intake',
  'Evidence Gathered',
  'Known-Issue Search',
  'Root-Cause Assessment',
  'Recommended Next Action',
  'Escalation Decision',
  'Verify This Report',
  'Draft Customer Response',
  'Evidence Pack (internal only)',
];

export const REQUIRED_FILES = [
  'README.md',
  'LICENSE',
  'AGENTS.md',
  'CLAUDE.md',
  'CHANGELOG.md',
  'plugin.json',
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  '.codex-plugin/plugin.json',
  '.agents/plugins/marketplace.json',
  'codex/support-triage.rules',
  'codex/support-triage.config.toml',
  'scripts/eval.mjs',
  'copilot/hooks.json',
  'copilot/triage-guard.sh',
  'examples/setup-demo.sh',
  'skills/support-triage/SKILL.md',
  'agents/support-triage-agent.md',
  'commands/triage.md',
  '.claude/settings.json',
  '.mcp.json.example',
  'skills/triage-report/references/triage-report-template.md',
  'skills/response-drafting/references/customer-response-template.md',
  'skills/escalation/references/escalation-brief-template.md',
  'examples/mock-sources/README.md',
  'reports/sample-triage-report.md',
  'reports/sample-customer-response.md',
  'docs/architecture.md',
  'docs/connectors.md',
];

const SHELL_TOOLS = ['bash', 'shell', 'execute', 'powershell', 'terminal'];
// Pictographic emoji only; ©, ®, ™ and plain arrows are allowed.
const EMOJI = /(?![\u00A9\u00AE\u2122\u2190-\u21FF])\p{Extended_Pictographic}/u;
export const SECRET_PATTERNS = [
  /whsec_[A-Za-z0-9]{8,}/,
  /\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{8,}/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];
// Emails on reserved or placeholder domains are fine; anything else is treated as PII.
export const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const SAFE_EMAIL_DOMAIN = /@([A-Za-z0-9-]+\.)*(example\.(com|org|net)|example|invalid|test|localhost|redacted|users\.noreply\.github\.com)$/i;
export function piiEmails(text) {
  return (text.match(EMAIL) || []).filter((e) => !SAFE_EMAIL_DOMAIN.test(e) && !/^\[?redacted/i.test(e));
}
// Absolute local paths leak the operator's machine layout and point outside the workspace.
export const ABSOLUTE_PATH = /(^|[\s`'"(\[|])(\/(Users|home|Volumes|private|tmp|var\/folders|root|mnt|opt)\/[^\s`'")\]|]+|[A-Za-z]:\\[^\s`'")\]|]+|~\/[^\s`'")\]|]+)/m;
// Evidence that comes from the customer's own system, which Confirmed by data needs.
const CUSTOMER_EVIDENCE = /\b(ticket|customer|log|logs|trace|HAR|console|event data|request id|reproduc\w*|account|project data|screenshot)\b/i;
const DOC_ONLY_SOURCE = /mock-sources\/|docs?\b|release|status|changelog|BEACON-\d+|issue/i;
const INTERNAL_MARKERS = [/mock-sources\//, /\bWebFetch\b/, /\bGrep\b/, /Evidence Pack/i, /\bMCP\b/];

export function parseFrontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function headings(text) {
  return text
    .split('\n')
    .filter((l) => /^#{2,3}\s/.test(l))
    .map((l) => l.replace(/^#+\s*/, '').replace(/[^\p{L}\p{N}()\-, ]/gu, '').trim());
}

export const MIN_REPLY_WORDS = 40;

export function words(s) {
  return (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) || []).length;
}

// Data rows in the first markdown table of a block (header and separator excluded).
export function tableRows(block) {
  const rows = block.split('\n').filter((l) => /^\s*\|.*\|\s*$/.test(l));
  return Math.max(0, rows.filter((l) => !/^\s*\|[\s:|-]+\|\s*$/.test(l)).length - 1);
}

export function section(text, name) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^##\s/.test(l) && l.includes(name));
  if (start < 0) return '';
  const end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n');
}

export function checkReport(text) {
  const errors = [];
  const found = headings(text);
  for (const s of REQUIRED_REPORT_SECTIONS) {
    if (!found.some((h) => h === s || h.startsWith(s))) errors.push(`missing section: ${s}`);
  }
  const rc = section(text, 'Root-Cause Assessment');
  const conf = rc.match(/\*\*Confidence:?\*\*:?\s*(.+)/);
  if (!conf) {
    errors.push('Root-Cause Assessment has no **Confidence:** line');
  } else if (!CONFIDENCE_LABELS.some((l) => conf[1].trim().replace(/^`|`$/g, '').startsWith(l))) {
    errors.push(`invalid confidence label: "${conf[1].trim()}" (expected one of: ${CONFIDENCE_LABELS.join(' | ')})`);
  }
  // Phase 0 assumption block, before any evidence is gathered.
  const beforeEvidence = text.split(/^##\s.*Evidence Gathered/m)[0];
  if (!/^\s*ASSUMING:\s*\S/m.test(beforeEvidence)) errors.push('missing Phase 0 "ASSUMING: ..." line before Evidence Gathered');
  if (!/Correct me now/.test(beforeEvidence)) errors.push('missing "→ Correct me now or I proceed with these." line after ASSUMING');
  if (tableRows(section(text, 'Evidence Gathered')) < 1) errors.push('Evidence Gathered has no table rows');
  const reply = section(text, 'Draft Customer Response')
    .split('--- END OF CUSTOMER-FACING CONTENT ---')[0]
    .split('\n')
    .filter((l) => !/No emojis in this section/i.test(l))
    .join('\n');
  if (!reply.trim()) errors.push('Draft Customer Response is empty');
  else if (words(reply.replace(/\S*customer-response\.md\S*/g, '')) < MIN_REPLY_WORDS) {
    errors.push(`Draft Customer Response must embed the full reply (${MIN_REPLY_WORDS}+ words), not just point to the separate file`);
  }
  if (EMOJI.test(reply)) errors.push('Draft Customer Response contains emoji');
  const marker = text.lastIndexOf('--- END OF CUSTOMER-FACING CONTENT ---');
  const draft = text.search(/^##\s.*Draft Customer Response/m);
  if (marker < 0) errors.push('missing END OF CUSTOMER-FACING CONTENT marker');
  else if (draft >= 0 && marker < draft) errors.push('END OF CUSTOMER-FACING CONTENT marker must come after the Draft Customer Response');
  for (const p of SECRET_PATTERNS) if (p.test(text)) errors.push(`unredacted secret-like value matches ${p}`);
  for (const e of piiEmails(text)) errors.push(`unredacted email address: ${e}`);
  const abs = text.match(ABSOLUTE_PATH);
  if (abs) errors.push(`absolute path found (${abs[2]}); use paths relative to the working directory`);
  if (conf && conf[1].includes('Confirmed by data')) {
    const sources = section(text, 'Evidence Gathered').split('\n')
      .filter((l) => /^\s*\|\s*[A-Za-z]?\d+\s*\|/.test(l) && !/unavailable|unverified|not available|no match|not run/i.test(l))
      .map((l) => (l.split('|')[2] || '').trim());
    if (!sources.some((src) => CUSTOMER_EVIDENCE.test(src) || !DOC_ONLY_SOURCE.test(src))) {
      errors.push('"Confirmed by data" needs an Evidence Gathered row from customer data (ticket, logs, traces, reproduction); docs or known issues alone support Likely at most');
    }
  }
  return errors;
}

export function checkCustomerResponse(text) {
  const errors = [];
  if (!text.trim()) errors.push('customer response is empty');
  if (EMOJI.test(text)) errors.push('customer response contains emoji');
  for (const p of INTERNAL_MARKERS) if (p.test(text)) errors.push(`customer response leaks internal detail matching ${p}`);
  for (const p of SECRET_PATTERNS) if (p.test(text)) errors.push(`unredacted secret-like value matches ${p}`);
  for (const e of piiEmails(text)) errors.push(`unredacted email address: ${e}`);
  if (ABSOLUTE_PATH.test(text)) errors.push('customer response contains an absolute local path');
  if (/\b(I(?:'|’)ve|I have|we(?:'|’)ve|we have|has been|have been)\s+(passed|escalated|forwarded|sent|handed)\b/i.test(text)) {
    errors.push('customer response claims a hand-off that triage did not perform (read-only); say a person will review instead');
  }
  return errors;
}

function read(p) {
  return readFileSync(join(ROOT, p), 'utf8');
}

function walk(dir) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).flatMap((n) => {
    const rel = join(dir, n);
    return statSync(join(ROOT, rel)).isDirectory() ? walk(rel) : [rel];
  });
}

export function validateRepo() {
  const errors = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);

  for (const f of REQUIRED_FILES) if (!existsSync(join(ROOT, f))) err(f, 'required file is missing');

  // Manifests: Copilot CLI reads ./plugin.json first; Claude Code reads ./.claude-plugin/plugin.json.
  let copilot, claude;
  try { copilot = JSON.parse(read('plugin.json')); } catch (e) { err('plugin.json', `invalid JSON: ${e.message}`); }
  try { claude = JSON.parse(read('.claude-plugin/plugin.json')); } catch (e) { err('.claude-plugin/plugin.json', `invalid JSON: ${e.message}`); }
  try { JSON.parse(read('.claude/settings.json')); } catch (e) { err('.claude/settings.json', `invalid JSON: ${e.message}`); }
  if (copilot && claude) {
    for (const k of ['name', 'version', 'description', 'license', 'repository']) {
      if (copilot[k] !== claude[k]) err('manifests', `"${k}" differs between plugin.json and .claude-plugin/plugin.json`);
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(copilot.name || '')) err('plugin.json', 'name must be kebab-case');
    if (!/^\d+\.\d+\.\d+$/.test(copilot.version || '')) err('plugin.json', 'version must be semver MAJOR.MINOR.PATCH');
    for (const k of ['agents', 'commands', 'skills']) {
      // Copilot CLI copies plugins without dot-directories, so components must not live under one.
      for (const p of [copilot[k], claude[k]].flat().filter(Boolean)) {
        if (/(^|\/)\.[^./]/.test(p)) err('manifests', `${k} path "${p}" is inside a dot-directory and will not be installed by Copilot CLI`);
      }
      for (const p of [copilot[k]].flat().filter(Boolean)) {
        if (!existsSync(join(ROOT, p)) || !statSync(join(ROOT, p)).isDirectory()) err('plugin.json', `${k} path "${p}" is not a directory`);
      }
      for (const p of [claude[k]].flat().filter(Boolean)) {
        if (!p.startsWith('./')) err('.claude-plugin/plugin.json', `${k} path "${p}" must start with ./`);
        if (!existsSync(join(ROOT, p))) err('.claude-plugin/plugin.json', `${k} path "${p}" does not exist`);
      }
    }
    // Copilot hook: blocks shell tools in sessions that ran /triage.
    if (copilot.hooks !== 'copilot/hooks.json') err('plugin.json', 'hooks must be "copilot/hooks.json"');
    try {
      const hooks = JSON.parse(read('copilot/hooks.json'));
      const cmds = ['userPromptSubmitted', 'preToolUse'].map((e) => hooks.hooks?.[e]?.[0]?.bash || '');
      if (hooks.version !== 1 || !cmds.every((c) => c.includes('$PLUGIN_ROOT/copilot/triage-guard.sh'))) {
        err('copilot/hooks.json', 'needs version 1 and userPromptSubmitted + preToolUse hooks that run copilot/triage-guard.sh');
      }
    } catch (e) { err('copilot/hooks.json', `invalid JSON: ${e.message}`); }
    // Codex reads ./.codex-plugin/plugin.json (skills only).
    let codex;
    try { codex = JSON.parse(read('.codex-plugin/plugin.json')); } catch (e) { err('.codex-plugin/plugin.json', `invalid JSON: ${e.message}`); }
    if (codex) {
      for (const k of ['name', 'version', 'description', 'license', 'repository']) {
        if (codex[k] !== copilot[k]) err('manifests', `"${k}" differs between plugin.json and .codex-plugin/plugin.json`);
      }
      if (codex.skills !== './skills/') err('.codex-plugin/plugin.json', 'skills must be "./skills/"');
      if (!codex.interface?.displayName) err('.codex-plugin/plugin.json', 'interface.displayName is required');
    }
    // Marketplaces: .claude-plugin/ for Copilot CLI and Claude Code, .agents/plugins/ for Codex.
    for (const m of ['.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json']) {
      let mk;
      try { mk = JSON.parse(read(m)); } catch (e) { err(m, `invalid JSON: ${e.message}`); continue; }
      if (mk.name !== 'support-triage-agent-template') err(m, 'marketplace name must be "support-triage-agent-template"');
      const entry = (mk.plugins || []).find((x) => x.name === copilot.name);
      if (!entry) err(m, `no plugin entry named "${copilot.name}"`);
      else if (entry.version !== copilot.version) err(m, `plugin version "${entry.version}" differs from manifest "${copilot.version}"`);
    }
    if (existsSync(join(ROOT, 'CHANGELOG.md')) && !read('CHANGELOG.md').includes(`## ${copilot.version}`)) {
      err('CHANGELOG.md', `no "## ${copilot.version}" entry for the manifest version`);
    }
  }

  // Skills: shared by both CLIs. Name must match its directory.
  const skillDirs = readdirSync(join(ROOT, 'skills')).filter((d) => statSync(join(ROOT, 'skills', d)).isDirectory());
  if (skillDirs.length < 10) err('skills', `expected at least 10 skills, found ${skillDirs.length}`);
  for (const d of skillDirs) {
    const p = `skills/${d}/SKILL.md`;
    if (!existsSync(join(ROOT, p))) { err(p, 'missing'); continue; }
    const fm = parseFrontMatter(read(p));
    if (!fm) { err(p, 'missing YAML front matter'); continue; }
    if (fm.name !== d) err(p, `front-matter name "${fm.name}" must equal directory "${d}"`);
    if (!fm.description || fm.description.length < 20) err(p, 'description missing or too short');
    for (const [, link] of read(p).matchAll(/\]\(([^)#]+)(#[^)]*)?\)/g)) {
      if (!/^[a-z]+:/.test(link) && !existsSync(join(ROOT, 'skills', d, link))) err(p, `broken relative link ${link}`);
    }
  }

  // Agent: must stay read-only (no shell tool).
  const agentPath = 'agents/support-triage-agent.md';
  if (existsSync(join(ROOT, agentPath))) {
    const fm = parseFrontMatter(read(agentPath));
    if (!fm?.name || !fm?.description) err(agentPath, 'front matter needs name and description');
    if (!fm?.tools) err(agentPath, 'front matter must declare an explicit tools allow-list');
    else {
      const tools = fm.tools.replace(/[[\]"']/g, '').split(',').map((t) => t.trim().toLowerCase());
      for (const t of tools) if (SHELL_TOOLS.includes(t)) err(agentPath, `tools allow-list must not include a shell tool (${t})`);
    }
    if (read(agentPath).includes('templates/')) err(agentPath, 'references removed templates/ directory');
    const tpl = 'skills/triage-report/references/triage-report-template.md';
    const skeleton = read(agentPath).match(/```markdown\n(# [^\n]*Triage Report[\s\S]*?)```/);
    if (!skeleton) err(agentPath, 'missing inline triage report skeleton');
    else if (existsSync(join(ROOT, tpl))) {
      const heads = (t) => t.split('\n').filter((l) => /^## /.test(l)).map((l) => l.trim());
      if (heads(skeleton[1]).join('|') !== heads(read(tpl)).join('|')) {
        err(agentPath, `inline report skeleton headings differ from ${tpl}`);
      }
    }
  }
  if (existsSync(join(ROOT, agentPath)) && (!existsSync(join(ROOT, SKILL_PATH)) || read(SKILL_PATH) !== buildSkill())) {
    err(SKILL_PATH, 'is stale; run: node scripts/build-skill.mjs');
  }
  const cmdPath = 'commands/triage.md';
  if (existsSync(join(ROOT, cmdPath)) && !parseFrontMatter(read(cmdPath))?.description) err(cmdPath, 'front matter needs a description');

  // Read-only settings must keep denying destructive verbs.
  try {
    const perms = JSON.parse(read('.claude/settings.json')).permissions || {};
    const deny = perms.deny || [];
    for (const d of ['Bash', 'Bash(rm:*)', 'Bash(git push:*)', 'Bash(gh issue close:*)', 'Bash(gh pr merge:*)', 'Write(tickets/**)', 'Edit(tickets/**)']) {
      if (!deny.includes(d)) err('.claude/settings.json', `deny list must include ${d}`);
    }
    // Pre-approving a shell, an interpreter or an unscoped write would undo the read-only defaults.
    for (const a of perms.allow || []) {
      if (/^Bash\b/.test(a) || a === 'Write' || a === 'Edit' || /^(Write|Edit)\((?!reports\/)/.test(a)) {
        err('.claude/settings.json', `allow list must not pre-approve ${a}`);
      }
    }
  } catch { /* reported above */ }

  // Synthetic tickets.
  const tickets = walk('examples/tickets').filter((f) => f.endsWith('.md'));
  if (tickets.length < 3) err('examples/tickets', `expected at least 3 tickets, found ${tickets.length}`);
  for (const t of tickets) {
    const s = read(t);
    if (!/\*\*Source:\*\* synthetic/.test(s)) err(t, 'must be marked "**Source:** synthetic"');
    if (!/\*\*Ticket ID:\*\* SUP-\d+/.test(s)) err(t, 'must have a **Ticket ID:** SUP-nnnn');
    if (!/\*\*Priority:\*\* P[1-4]\b/.test(s)) err(t, 'must have a **Priority:** P1-P4');
  }

  // Mock known-issue source.
  for (const f of walk('examples/mock-sources/issues')) {
    const fm = parseFrontMatter(read(f));
    if (!fm) { err(f, 'missing front matter'); continue; }
    if (fm.id !== basename(f, '.md')) err(f, `id "${fm.id}" must match filename`);
    for (const k of ['title', 'status', 'created', 'updated']) if (!fm[k]) err(f, `front matter missing ${k}`);
    for (const k of ['created', 'updated']) if (fm[k] && !/^\d{4}-\d{2}-\d{2}$/.test(fm[k])) err(f, `${k} must be YYYY-MM-DD`);
  }

  // Reports: committed sample plus every recorded E2E run.
  const reports = ['reports/sample-triage-report.md', ...walk('docs/demo').filter((f) => f.endsWith('-triage.md'))];
  for (const r of reports) if (existsSync(join(ROOT, r))) for (const e of checkReport(read(r))) err(r, e);
  const responses = ['reports/sample-customer-response.md', ...walk('docs/demo').filter((f) => f.endsWith('-customer-response.md'))];
  for (const r of responses) if (existsSync(join(ROOT, r))) for (const e of checkCustomerResponse(read(r))) err(r, e);

  return errors;
}

// realpath both sides: the script may be invoked through a symlinked checkout.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const [flag, file] = process.argv.slice(2);
  let errors;
  if (flag === '--report') errors = checkReport(readFileSync(file, 'utf8')).map((e) => `${file}: ${e}`);
  else if (flag === '--response') errors = checkCustomerResponse(readFileSync(file, 'utf8')).map((e) => `${file}: ${e}`);
  else errors = validateRepo();
  if (errors.length) {
    console.error(`FAIL (${errors.length})`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(flag ? `OK ${relative(process.cwd(), file)}` : 'OK repository structure, manifests, skills, tickets, mock sources and reports');
}

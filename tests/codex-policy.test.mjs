// Codex read-only layers: execpolicy rules (best effort) and the permissions profile (write boundary).
// Needs the codex CLI on PATH (or CODEX_BIN); skipped otherwise. Set CODEX_REQUIRED=1 to fail instead.
// Sandbox probes run on macOS by default; set CODEX_SANDBOX_TEST=1 to force them elsewhere.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from '../scripts/validate.mjs';

const CODEX = process.env.CODEX_BIN || 'codex';
const RULES = join(ROOT, 'codex/support-triage.rules');
const PROFILE = join(ROOT, 'codex/support-triage.permissions.toml');
const have = spawnSync(CODEX, ['--version'], { encoding: 'utf8' }).status === 0;
if (!have && process.env.CODEX_REQUIRED === '1') throw new Error(`codex CLI not found (${CODEX})`);
const skip = have ? false : 'codex CLI not installed';
const sandboxSkip = skip || (process.platform === 'darwin' || process.env.CODEX_SANDBOX_TEST === '1' ? false : 'sandbox probes run on macOS or with CODEX_SANDBOX_TEST=1');

function decision(argv) {
  const r = spawnSync(CODEX, ['execpolicy', 'check', '--rules', RULES, ...argv], { encoding: 'utf8' });
  assert.equal(r.status, 0, `execpolicy check failed (rules must load; match/not_match examples are verified): ${r.stderr}`);
  return JSON.parse(r.stdout).decision || 'allow';
}

// Each row is a bypass from the PR #2/#3 review or a common write/destructive form.
const FORBIDDEN = [
  'rm -rf tickets', 'rmdir mock-sources', 'mv tickets/a tickets/b', 'cp /etc/hosts tickets/a', 'tee tickets/a',
  'dd if=/dev/zero of=tickets/a', 'truncate -s 0 tickets/a', 'chmod -R 777 .', 'touch tickets/new', 'ln -sf /etc/hosts tickets/a',
  'sed -i s/a/b/ tickets/a', 'perl -pi -e s/a/b/ tickets/a',
  'python3 -c import_os', 'python -c x', 'node -e x', 'node --eval x', 'bun -e x', 'ruby -e x', 'osascript -e x',
  'git push origin main', 'git reset --hard', 'git -C . reset --hard', 'git -c core.hooksPath=x commit', 'git --git-dir .git push',
  'git checkout -- tickets', 'git clean -fdx', 'git stash',
  'gh issue close 1', 'gh pr merge 1', 'gh api -X POST repos/x', 'gh release create v1',
  'curl -X POST https://x', 'curl -s -X POST https://x', 'curl -d a=b https://x', 'curl --json {} https://x', 'curl -o tickets/a https://x',
  'wget https://x', 'rsync -a . host:', 'ssh host',
  'npm install x', 'npm i x', 'npm ci', 'yarn add x', 'pnpm add x', 'npx rimraf .', 'pip install x', 'pip3 install x',
  'uv pip install x', 'python3 -m pip install x', 'brew install x',
  'sudo rm -rf /', 'kill -9 1',
];
// Known rule gaps (single-token options, shell redirects, sh -c scripts): documented, and covered by the profile test below.
const KNOWN_GAPS = ['git --git-dir=.git push', 'sh -c rm_-rf_tickets', 'bash -lc echo_x>tickets/a'];
// Commands the triage workflow needs must stay available.
const ALLOWED = ['cat tickets/001.md', 'ls -la', 'rg -n BEACON mock-sources', 'grep -rn Safari mock-sources', 'sed -n 1,40p tickets/001.md',
  'head -50 tickets/001.md', 'find mock-sources -name *.md', 'git log --oneline', 'git status', 'python3 --version', 'node --version'];

test('execpolicy rules load and their inline examples hold', { skip }, () => {
  assert.equal(decision(['true']), 'allow');
});

for (const cmd of FORBIDDEN) {
  test(`execpolicy forbids: ${cmd}`, { skip }, () => assert.equal(decision(cmd.split(' ')), 'forbidden'));
}
for (const cmd of ALLOWED) {
  test(`execpolicy allows read: ${cmd}`, { skip }, () => assert.equal(decision(cmd.split(' ')), 'allow'));
}

for (const cmd of KNOWN_GAPS) {
  test(`execpolicy known gap (profile covers it): ${cmd}`, { skip }, () => assert.equal(decision(cmd.split(' ')), 'allow'));
}

// The profile is the boundary for everything rules cannot see: redirects, interpreters, sh -c, apply_patch.
test('permissions profile: workspace read-only except reports/', { skip: sandboxSkip }, (t) => {
  const base = mkdtempSync(join(tmpdir(), 'sta-profile-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const home = join(base, 'home'), ws = join(base, 'ws');
  mkdirSync(home); mkdirSync(join(ws, 'tickets'), { recursive: true });
  copyFileSync(PROFILE, join(home, 'config.toml')); // README step: append the profile to config.toml
  writeFileSync(join(ws, 'tickets/t.md'), 'original\n');
  const run = (script) => spawnSync(CODEX, ['sandbox', '-c', 'default_permissions="support-triage"', '--', 'sh', '-c', script],
    { cwd: ws, env: { ...process.env, CODEX_HOME: home }, encoding: 'utf8' }).status;

  const denied = {
    'redirect overwrite': 'echo pwned > tickets/t.md',
    'append redirect': 'echo pwned >> tickets/t.md',
    'python3 -c': `python3 -c "open('tickets/t.md','w').write('pwned')"`,
    'node -e': `node -e "require('fs').writeFileSync('tickets/t.md','pwned')"`,
    'rm': 'rm -f tickets/t.md',
    'cp over fixture': 'cp /etc/hosts tickets/t.md',
    'new file at root': 'echo x > stray.md',
    'git init': 'git init -q .',
    'sed -i': "sed -i.bak 's/original/pwned/' tickets/t.md",
  };
  for (const [name, script] of Object.entries(denied)) assert.notEqual(run(script), 0, `${name} should be denied`);
  assert.equal(readFileSync(join(ws, 'tickets/t.md'), 'utf8'), 'original\n');
  assert.ok(!existsSync(join(ws, 'stray.md')) && !existsSync(join(ws, '.git')));

  assert.equal(run('mkdir -p reports && echo ok > reports/r.md'), 0, 'reports/ must stay writable (and creatable)');
  assert.equal(readFileSync(join(ws, 'reports/r.md'), 'utf8'), 'ok\n');
});

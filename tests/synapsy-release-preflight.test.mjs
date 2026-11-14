import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const script = fileURLToPath(new URL('../scripts/verify_synapsy_release.py', import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'synapsy-review-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function run(dir, ...args) {
  const child = spawnSync('python3', [script, '--source-dir', dir, ...args], { encoding: 'utf8', timeout: 15000 });
  assert.equal(child.error, undefined);
  assert.equal(child.stderr, '');
  return { code: child.status, report: JSON.parse(child.stdout) };
}

test('matching legacy digest is internal consistency only, never operational success', t => {
  const dir = fixture(t);
  const receipt = join(dir, 'receipts.json');
  // Exact Python json.dumps(..., sort_keys=True) default separators for this fixture.
  const canonical = '{"status": "ALL_7_INTEGRATION_ARTIFACTS_VERIFIED", "verifications": {}}';
  writeFileSync(receipt, JSON.stringify({ ...JSON.parse(canonical), master_integrity_sha256: hash(canonical) }));
  const { code, report } = run(dir, '--receipts', receipt);
  assert.equal(code, 2);
  assert.equal(report.status, 'NOT_VERIFIED');
  assert.equal(report.integrity_check.status, 'MATCH');
  assert.equal(report.integrity_check.proves_operations, false);
  assert.equal(Object.values(report.live_verification).every(value => value === 'NOT_VERIFIED'), true);
});

test('unmatched hash distinguishes unknown serialization from declared mismatch', t => {
  const dir = fixture(t);
  const receipt = join(dir, 'receipts.json');
  writeFileSync(receipt, JSON.stringify({ master_integrity_sha256: '0'.repeat(64) }));
  assert.equal(run(dir, '--receipts', receipt).report.integrity_check.status, 'UNKNOWN_CANONICALIZATION');
  writeFileSync(receipt, JSON.stringify({ master_integrity_serialization: 'python-json-sort-keys-default-v1', master_integrity_sha256: '0'.repeat(64) }));
  const result = run(dir, '--receipts', receipt);
  assert.equal(result.code, 1);
  assert.equal(result.report.integrity_check.status, 'MISMATCH');
});

test('missing inputs and empty catalogs cannot be reported as verified', t => {
  const dir = fixture(t);
  const { code, report } = run(dir);
  assert.equal(code, 2);
  assert.equal(report.status, 'NOT_VERIFIED');
  assert.equal(report.source_checks['main.py'].status, 'MISSING');
  assert.equal(report.integrity_check.status, 'NOT_PROVIDED');
  assert.equal(run(dir, '--receipts', join(dir, 'absent.json')).report.status, 'INPUT_ERROR');
});

test('review does not execute supplied Python or shell and preserves source bytes', t => {
  const dir = fixture(t);
  const marker = join(dir, 'MUST_NOT_EXIST');
  const router = `from pathlib import Path\nPath(${JSON.stringify(marker)}).write_text("executed")\nimport os\nsecret = os.getenv("PAYMENT_WEBHOOK_SECRET", "change-me")\n`;
  writeFileSync(join(dir, 'synapsy_integrations_router.py'), router);
  writeFileSync(join(dir, 'deploy.sh'), `#!/bin/sh\ntouch '${marker}'\npython3 verify_all_integrations.py || true\ngit push origin main\n`);
  const before = readdirSync(dir).sort().map(name => [name, hash(readFileSync(join(dir, name)))]);
  const result = run(dir, '--deploy-script', join(dir, 'deploy.sh'));
  assert.equal(result.code, 1);
  assert.ok(result.report.findings.some(item => item.code === 'PUBLIC_WEBHOOK_SECRET_DEFAULT'));
  assert.ok(result.report.findings.some(item => item.code === 'IGNORED_VERIFICATION_OR_COMMIT_ERROR'));
  assert.deepEqual(readdirSync(dir).sort().map(name => [name, hash(readFileSync(join(dir, name)))]), before);
});

test('default branch snapshot exposes main mismatch without changing Git refs', t => {
  const dir = fixture(t);
  execFileSync('git', ['init', '--initial-branch=main-@URBAN-ONE', dir], { stdio: 'ignore' });
  execFileSync('git', ['-C', dir, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main-@URBAN-ONE']);
  writeFileSync(join(dir, 'Dockerfile'), 'FROM node:22-alpine\n');
  writeFileSync(join(dir, 'deploy.sh'), 'git push origin main\n');
  const before = execFileSync('git', ['-C', dir, 'symbolic-ref', 'refs/remotes/origin/HEAD'], { encoding: 'utf8' });
  const { code, report } = run(dir, '--repository', dir, '--deploy-script', join(dir, 'deploy.sh'));
  assert.equal(code, 1);
  assert.equal(report.repository.default_branch, 'main-@URBAN-ONE');
  assert.equal(report.repository.protected_files.Dockerfile.sha256, hash('FROM node:22-alpine\n'));
  assert.ok(report.findings.some(item => item.code === 'HARDCODED_MAIN_PUSH' && item.detail.includes('main-@URBAN-ONE')));
  assert.equal(execFileSync('git', ['-C', dir, 'symbolic-ref', 'refs/remotes/origin/HEAD'], { encoding: 'utf8' }), before);
});

test('report output cannot overwrite inspected sources or existing files', t => {
  const dir = fixture(t);
  const input = join(dir, 'main.py');
  writeFileSync(input, '# original\n');
  assert.equal(run(dir, '--output', input).report.status, 'INPUT_ERROR');
  assert.equal(readFileSync(input, 'utf8'), '# original\n');
  const output = join(dir, 'report.json');
  const first = run(dir, '--output', output);
  assert.equal(first.code, 2);
  assert.equal(JSON.parse(readFileSync(output, 'utf8')).status, 'NOT_VERIFIED');
  assert.equal(run(dir, '--output', output).report.status, 'INPUT_ERROR');
});

test('repository subdirectory resolves protected files and output guard to the Git root', t => {
  const dir = fixture(t);
  const subdir = join(dir, 'nested');
  mkdirSync(subdir);
  execFileSync('git', ['init', '--initial-branch=main-@URBAN-ONE', dir], { stdio: 'ignore' });
  writeFileSync(join(dir, 'Dockerfile'), 'FROM node:22-alpine\n');
  const snapshot = run(dir, '--repository', subdir);
  assert.equal(snapshot.report.repository.protected_files.Dockerfile.sha256, hash('FROM node:22-alpine\n'));
  const guarded = run(dir, '--repository', subdir, '--output', join(dir, 'new.json'));
  assert.equal(guarded.code, 2);
  assert.equal(guarded.report.status, 'INPUT_ERROR');
  assert.equal(readdirSync(dir).includes('new.json'), false);
});

test('ambiguous duplicate receipt keys are rejected', t => {
  const dir = fixture(t);
  const receipt = join(dir, 'receipts.json');
  writeFileSync(receipt, '{"status":"A","status":"B"}');
  assert.equal(run(dir, '--receipts', receipt).report.status, 'INPUT_ERROR');
});

test('receipt FIFO is rejected without waiting for a writer', { skip: process.platform === 'win32' }, t => {
  const dir = fixture(t);
  const receipt = join(dir, 'receipts.fifo');
  execFileSync('python3', ['-c', 'import os, sys; os.mkfifo(sys.argv[1])', receipt]);
  const result = run(dir, '--receipts', receipt);
  assert.equal(result.code, 2);
  assert.equal(result.report.status, 'INPUT_ERROR');
  assert.match(result.report.error, /regular file/);
});

test('oversized regular receipt files are rejected before JSON parsing', t => {
  const dir = fixture(t);
  const receipt = join(dir, 'receipts.json');
  writeFileSync(receipt, Buffer.alloc(2_000_001, 32));
  const result = run(dir, '--receipts', receipt);
  assert.equal(result.code, 2);
  assert.equal(result.report.status, 'INPUT_ERROR');
  assert.match(result.report.error, /exceeds 2000000 bytes/);
});

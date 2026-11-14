import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const python = execFileSync('python3', ['-I', '-c', 'import sys; print(sys.executable)'], { encoding: 'utf8' }).trim();
const bash = execFileSync('bash', ['-c', 'command -v bash'], { encoding: 'utf8' }).trim();
const git = execFileSync('bash', ['-c', 'command -v git'], { encoding: 'utf8' }).trim();
const hash = value => createHash('sha256').update(value).digest('hex');

function fixture(t, { withPython = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'synapsy-entrypoint-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const checkout = join(dir, 'project checkout with spaces');
  const cwd = join(dir, 'unrelated working directory');
  const bin = join(dir, 'isolated command directory');
  const sentinel = join(dir, 'unexpected-effects.log');
  for (const path of [join(checkout, 'scripts'), cwd, bin]) mkdirSync(path, { recursive: true });
  for (const file of ['verify_all_integrations.py', 'deploy_all.sh', 'scripts/verify_synapsy_release.py']) {
    copyFileSync(join(root, file), join(checkout, file));
  }
  chmodSync(join(checkout, 'deploy_all.sh'), 0o755);
  symlinkSync(bash, join(bin, 'bash'));
  if (withPython) symlinkSync(python, join(bin, 'python3'));
  // A future accidental publish/copy/network command must hit a local sentinel,
  // not a real service. The fixture has no Git checkout unless a test creates one.
  for (const command of ['git', 'cp', 'curl', 'wget', 'ssh', 'scp', 'rsync', 'docker', 'kubectl', 'render', 'npm', 'npx']) {
    const path = join(bin, command);
    writeFileSync(path, `#!${bash}\nprintf '%s\\n' '${command}' >> "$SYNAPSY_SENTINEL"\nexit 97\n`);
    chmodSync(path, 0o755);
  }
  return {
    dir, checkout, cwd, bin, sentinel,
    env: { ...process.env, PATH: bin, SYNAPSY_SENTINEL: sentinel, GIT_TERMINAL_PROMPT: '0' },
  };
}

function run(f, entry, args = [], cwd = f.cwd) {
  const executable = entry === 'wrapper' ? python : join(f.checkout, 'deploy_all.sh');
  const commandArgs = entry === 'wrapper' ? ['-I', join(f.checkout, 'verify_all_integrations.py'), ...args] : args;
  const child = spawnSync(executable, commandArgs, { cwd, env: f.env, encoding: 'utf8', timeout: 15000 });
  assert.equal(child.error, undefined);
  assert.equal(child.signal, null);
  return child;
}

function assertNoEffects(f) {
  assert.equal(existsSync(f.sentinel), false, 'preflight must not invoke copy, Git mutation, network or provider commands');
}

function snapshot(dir) {
  const result = [];
  function visit(path, relative) {
    const metadata = lstatSync(path);
    if (metadata.isSymbolicLink()) result.push([relative, 'symlink', readlinkSync(path)]);
    else if (metadata.isDirectory()) {
      result.push([relative, 'directory']);
      for (const name of readdirSync(path).sort()) visit(join(path, name), join(relative, name));
    } else result.push([relative, 'file', hash(readFileSync(path)), metadata.mode & 0o777]);
  }
  visit(dir, '.');
  return result;
}

test('invalid supplied Python produces NO_GO/1 through both entry points before any effects', t => {
  const f = fixture(t);
  writeFileSync(join(f.checkout, 'main.py'), 'def incomplete(:\n');
  const before = snapshot(f.checkout);
  for (const entry of ['wrapper', 'deploy']) {
    const result = run(f, entry);
    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.equal(report.status, 'NO_GO');
    assert.ok(report.findings.some(finding => finding.code === 'INVALID_PYTHON_SYNTAX'));
    assert.equal(Object.values(report.live_verification).every(status => status === 'NOT_VERIFIED'), true);
  }
  assert.deepEqual(snapshot(f.checkout), before);
  assertNoEffects(f);
});

test('an empty source returns NOT_VERIFIED/2; direct executable works from its directory and another cwd with spaces', t => {
  const f = fixture(t);
  for (const entry of ['wrapper', 'deploy']) {
    const result = run(f, entry);
    assert.equal(result.status, 2);
    const report = JSON.parse(result.stdout);
    assert.equal(report.status, 'NOT_VERIFIED');
    assert.equal(report.source_checks['main.py'].status, 'MISSING');
    assert.equal(report.deployment_script.status, 'READ_AS_DATA');
  }
  const direct = spawnSync('./deploy_all.sh', [], { cwd: f.checkout, env: f.env, encoding: 'utf8', timeout: 15000 });
  assert.equal(direct.error, undefined);
  assert.equal(direct.status, 2);
  assert.equal(JSON.parse(direct.stdout).status, 'NOT_VERIFIED');
  assertNoEffects(f);
});

test('automatically discovered matching receipts remain NOT_VERIFIED and are never rewritten', t => {
  const f = fixture(t);
  const source = join(f.dir, 'receipt source with spaces');
  mkdirSync(source);
  const canonical = '{"status": "ALL_7_INTEGRATION_ARTIFACTS_VERIFIED", "verifications": {}}';
  writeFileSync(join(source, 'synapsy_verification_receipts.json'), JSON.stringify({
    ...JSON.parse(canonical), master_integrity_sha256: hash(canonical),
  }) + '\n');
  const before = snapshot(source);
  for (const entry of ['wrapper', 'deploy']) {
    const result = run(f, entry, ['--source-dir', source]);
    assert.equal(result.status, 2);
    const report = JSON.parse(result.stdout);
    assert.equal(report.status, 'NOT_VERIFIED');
    assert.equal(report.integrity_check.status, 'MATCH');
    assert.equal(report.integrity_check.proves_operations, false);
    assert.equal(report.integrity_check.authenticated_provenance, false);
  }
  assert.deepEqual(snapshot(source), before);
  assertNoEffects(f);
});

test('missing reviewer, wrapper or python blocks deployment with exit 2', t => {
  for (const missing of ['reviewer', 'wrapper', 'python']) {
    const f = fixture(t, { withPython: missing !== 'python' });
    if (missing === 'reviewer') rmSync(join(f.checkout, 'scripts/verify_synapsy_release.py'));
    if (missing === 'wrapper') rmSync(join(f.checkout, 'verify_all_integrations.py'));
    const result = run(f, 'deploy');
    assert.equal(result.status, 2, missing);
    assert.match(result.stdout + result.stderr, missing === 'reviewer' ? /reviewer|verify_synapsy_release/ : missing === 'wrapper' ? /verify_all_integrations\.py missing/ : /python3 missing/);
    assertNoEffects(f);
  }
});

test('an unexpected reviewer success, error code or signal cannot unlock the shell chain', t => {
  for (const ending of ['raise SystemExit(0)', 'raise SystemExit(17)', 'import os, signal; os.kill(os.getpid(), signal.SIGTERM)']) {
    const f = fixture(t);
    writeFileSync(join(f.checkout, 'scripts/verify_synapsy_release.py'), `print('{"status":"GO"}', flush=True)\n${ending}\n`);
    for (const entry of ['wrapper', 'deploy']) {
      const result = run(f, entry);
      assert.equal(result.status, 2, `${entry}: ${ending}`);
      assert.match(result.stderr, /unexpected reviewer exit/);
    }
    assertNoEffects(f);
  }
});

test('deploy still blocks if a future wrapper incorrectly returns zero', t => {
  const f = fixture(t);
  writeFileSync(join(f.checkout, 'verify_all_integrations.py'), 'print("unexpected offline success")\n');
  const result = run(f, 'deploy');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /live release adapter unavailable/);
  assertNoEffects(f);
});

test('source files and supplied deploy scripts are read as data without execution or writeback', t => {
  const f = fixture(t);
  const marker = join(f.dir, 'SUPPLIED_CODE_MUST_NOT_RUN');
  writeFileSync(join(f.checkout, 'main.py'), `from pathlib import Path\nPath(${JSON.stringify(marker)}).write_text("executed")\n`);
  writeFileSync(join(f.checkout, 'synapsy_integrations_router.py'), 'import os\nsecret = os.getenv("PAYMENT_WEBHOOK_SECRET", "change-me")\n');
  const suppliedDeploy = join(f.checkout, 'untrusted deploy script.sh');
  writeFileSync(suppliedDeploy, '#!/usr/bin/env bash\ncp -f synapsy-infrastructure-proof.yml .github/workflows/synapsy-infrastructure-proof.yml\npython3 verify_all_integrations.py || true\ngit push origin main\ncurl https://invalid.example/never\n');
  const before = snapshot(f.checkout);
  const result = run(f, 'deploy', ['--deploy-script', suppliedDeploy]);
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.ok(report.findings.some(finding => finding.code === 'PUBLIC_WEBHOOK_SECRET_DEFAULT'));
  assert.ok(report.findings.some(finding => finding.code === 'WORKFLOW_OVERWRITE'));
  assert.equal(existsSync(marker), false);
  assert.deepEqual(snapshot(f.checkout), before);
  assertNoEffects(f);
});

test('automatic checkout detection rejects report output inside the repository without changing refs or inputs', t => {
  const f = fixture(t);
  execFileSync(git, ['init', '--initial-branch=main-@URBAN-ONE', f.checkout], { stdio: 'ignore' });
  // Only Git's read-only commands are available during the actual preflight.
  writeFileSync(join(f.bin, 'git'), `#!${bash}\ncase "$3" in\n  rev-parse|symbolic-ref) exec '${git.replaceAll("'", "'\\''")}' "$@" ;;\n  *) printf '%s\\n' 'git mutation' >> "$SYNAPSY_SENTINEL"; exit 97 ;;\nesac\n`);
  const before = snapshot(f.checkout);
  const output = join(f.checkout, 'must-not-be-written.json');
  const result = run(f, 'deploy', ['--output', output]);
  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'INPUT_ERROR');
  assert.match(report.error, /inside the inspected repository/);
  assert.equal(existsSync(output), false);
  assert.deepEqual(snapshot(f.checkout), before);
  assertNoEffects(f);
});

test('a dangling automatically detected receipt is rejected rather than silently omitted', t => {
  const f = fixture(t);
  symlinkSync(join(f.dir, 'missing-receipt.json'), join(f.checkout, 'synapsy_verification_receipts.json'));
  const result = run(f, 'deploy');
  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stdout).status, 'INPUT_ERROR');
  assertNoEffects(f);
});

test('cyclic symlink inputs return INPUT_ERROR/2 without a traceback', t => {
  const f = fixture(t);
  const first = join(f.dir, 'cyclic input one');
  const second = join(f.dir, 'cyclic input two');
  symlinkSync(second, first);
  symlinkSync(first, second);
  for (const option of ['--receipts', '--source-dir']) {
    for (const entry of ['wrapper', 'deploy']) {
      const result = run(f, entry, [option, first]);
      assert.equal(result.status, 2, `${entry}: ${option}`);
      assert.equal(JSON.parse(result.stdout).status, 'INPUT_ERROR');
      assert.doesNotMatch(result.stdout + result.stderr, /Traceback/);
    }
  }
  assertNoEffects(f);
});

test('help succeeds only as usage and never invokes the reviewer or reports a verification', t => {
  const f = fixture(t);
  writeFileSync(join(f.checkout, 'scripts/verify_synapsy_release.py'), `from pathlib import Path\nPath(${JSON.stringify(f.sentinel)}).write_text("reviewer executed")\n`);
  const result = run(f, 'deploy', ['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /usage:/);
  assert.match(result.stdout, /cannot certify live integrations or authorize a deploy/);
  assert.equal(result.stdout.includes('"status"'), false);
  assertNoEffects(f);
});

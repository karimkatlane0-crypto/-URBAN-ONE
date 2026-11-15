import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Compatibility entry point. YAML structure, not regexes, decides whether an
// operation or endpoint exists. Python + PyYAML must already be installed.
// These checks never install packages and do not establish runtime security.
const python = process.env.CODEX_PRIMARY_RUNTIME_PYTHON || 'python3';
const execute = (name) => spawnSync(python, [fileURLToPath(new URL(name, import.meta.url))], {
  encoding: 'utf8', timeout: 30000,
  env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
});

test('Structured reference contract passes', () => {
  const result = execute('./validate_contract.py');
  assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.status, 'PASS');
  assert.equal(receipt.operations, 8);
  assert.equal(receipt.scopes, 6);
});

test('Negative contract mutations are rejected', () => {
  const result = execute('./test_contract_validation.py');
  assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
  assert.match(result.stderr, /Ran 21 tests/);
  assert.match(result.stderr, /\bOK\b/);
});

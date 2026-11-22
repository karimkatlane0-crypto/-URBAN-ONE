import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
const skill = readFileSync(new URL('../SKILL.md', import.meta.url), 'utf8');

test('manifest has stable identity and workspace-targeted scope', () => {
  assert.equal(manifest.name, 'TITANS Sovereign Executive Control');
  assert.equal(manifest.version, '1.0.0');
  assert.equal(manifest.scope, 'workspace-targeted');
  assert.equal(manifest.discoverability, 'private');
});

test('skill begins with valid YAML frontmatter and a named skill', () => {
  assert.match(skill, /^---\nname: titans-sovereign\n[\s\S]*?\n---\n/);
  assert.match(skill, /# TITANS Sovereign Executive Control/);
});

test('all requested model labels are preserved', () => {
  for (const label of ['INSIDERS Finance Control', 'INSIGHTS', 'INSPIRE', 'EUROPEAN EU', 'ML', 'LM', 'SLE', 'LAS', 'LSE', 'IAM']) {
    assert.ok(manifest.models.includes(label), `missing model label: ${label}`);
  }
});

test('irreversible actions require human approval', () => {
  assert.equal(manifest.controls.no_implicit_external_actions, true);
  assert.equal(manifest.controls.human_approval_for_financial_actions, true);
  assert.equal(manifest.controls.human_approval_for_merge, true);
  assert.equal(manifest.controls.human_approval_for_production_release, true);
  assert.equal(manifest.controls.independent_verification_required, true);
});

test('skill defines reconciliation, IAM, model governance and customer experience', () => {
  for (const term of ['Finance reconciliation', 'ML / LM governance', 'IAM and security', 'Customer experience', 'Independent']) {
    assert.ok(skill.toLowerCase().includes(term.toLowerCase()), `missing control area: ${term}`);
  }
});

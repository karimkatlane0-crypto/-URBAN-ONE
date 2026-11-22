import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../apps/web/universal-navigation.js', import.meta.url), 'utf8');
const expected = [
  ['universal-36', './universal-36.html', 'control-plane'],
  ['titans', './titans-enterprise-studio.html', 'titans'],
  ['insights', './insights-ai.html', 'insights'],
  ['gita', './titans-enterprise-studio.html#intelligence', 'titans-agent-registry'],
  ['seva-studio', './seva-unified-studio.html', 'seva-studio'],
  ['seva-crm', './seva-crm-studio.html', 'seva-crm'],
  ['synapsy', './synapsy.html', 'synapsy'],
  ['kkubera', './discovery.html', 'kkubera'],
  ['urban-one', './v10-workspace.html', 'urban-one'],
  ['maps-europe', './maps-europe.html', 'maps-europe'],
  ['seva-public', 'https://seva.karimkatlane0.chatgpt.site/superapp', 'external']
];

function boot(missingId = null) {
  const anchors = new Map(expected.filter(([id]) => id !== missingId).map(([id, href]) => [id, {
    href, dataset: {}, attrs: {},
    getAttribute(name) { return name === 'href' ? this.href : this.attrs[name] ?? null; },
    setAttribute(name, value) { this.attrs[name] = value; }
  }]));
  const proof = { textContent: '', dataset: {} };
  const document = {
    readyState: 'complete',
    querySelector(selector) {
      const match = selector.match(/\[data-nav-node="([^"]+)"\]/);
      return match ? anchors.get(match[1]) || null : null;
    },
    getElementById(id) { return id === 'sa-navigation-proof' ? proof : null; },
    documentElement: { dataset: {} }
  };
  const window = {};
  vm.runInNewContext(source, { window, document });
  return { window, anchors, proof, document };
}

test('navigation manifest declares 11 unique, bounded product nodes', () => {
  const { window } = boot();
  const nodes = window.SUPER_AI_NAVIGATION.nodes;
  assert.equal(nodes.length, 11);
  assert.equal(new Set(nodes.map(node => node.id)).size, 11);
  for (const [id, href, boundary] of expected) {
    const node = nodes.find(item => item.id === id);
    assert.ok(node, 'missing node ' + id);
    assert.equal(node.href, href);
    assert.equal(node.boundary, boundary);
    assert.ok(node.permission);
  }
});

test('all navigation links are connected to their declared route and boundary', () => {
  const { window, anchors, proof, document } = boot();
  const result = window.SUPER_AI_NAVIGATION.verify();
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { total: 11, passed: 11, failed: 0, failures: [] });
  assert.equal(proof.dataset.status, 'pass');
  assert.equal(document.documentElement.dataset.navigationGraph, 'pass');
  for (const [id] of expected) assert.ok(anchors.get(id).dataset.productBoundary);
  assert.equal(anchors.get('seva-public').attrs.rel, 'noopener noreferrer');
});

test('missing node fails closed and is surfaced to the live status region', () => {
  const { window, proof, document } = boot('kkubera');
  const result = window.SUPER_AI_NAVIGATION.verify();
  assert.equal(result.failed, 1);
  assert.equal(result.failures[0].id, 'kkubera');
  assert.equal(proof.dataset.status, 'fail');
  assert.equal(document.documentElement.dataset.navigationGraph, 'fail');
});

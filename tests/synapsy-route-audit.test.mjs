import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import {
  collectSameOriginPaths, runSynapsyFullAudit, verifyReportIntegrity
} from '../scripts/run_synapsy_full_audit.js';

const baseUrl = 'https://seva.example/workspace/index?old=1';
const response = (url, overrides = {}) => ({
  status: 200, redirected: false, type: 'basic', url, ...overrides
});
const audit = options => runSynapsyFullAudit({ baseUrl, cryptoImpl: webcrypto, ...options });

test('import has no browser dependency or automatic request/download', async () => {
  const previousFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests++; throw new Error('Import must not fetch'); };
  try {
    const module = await import('../scripts/run_synapsy_full_audit.js?isolated-import');
    assert.equal(typeof module.runSynapsyFullAudit, 'function');
    assert.equal(typeof module.downloadSynapsyAuditReport, 'function');
    assert.equal(requests, 0);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('normalization accepts same-origin absolute and relative links, preserves queries and removes fragments', () => {
  const actual = collectSameOriginPaths([
    '/orders?state=pending#one', 'https://seva.example/orders?state=pending#two',
    './child?x=2#section', '../home', '?tab=payments#top', '//seva.example/home',
    '#local', '', null, 'mailto:test@example.invalid', 'javascript:void(0)',
    '//example.invalid/collect', 'https://seva.example:444/path',
    'https://user:secret@seva.example/private', 'https://['
  ], baseUrl);
  assert.deepEqual(actual.paths, [
    '/home', '/orders?state=pending', '/workspace/child?x=2', '/workspace/index?tab=payments'
  ]);
  assert.equal(actual.excluded.length, 9);
  assert.equal(actual.excluded.filter(link => link.reason === 'OTHER_ORIGIN').length, 2);
  assert.ok(actual.excluded.some(link => link.reason === 'EMBEDDED_CREDENTIALS'));
});

test('external links are never fetched; selected requests restrict credentials, origins and redirects', async () => {
  const calls = [];
  const report = await audit({
    hrefs: ['/ok?x=1#part', '//example.invalid/collect', 'https://seva.example/ok?x=1#other'],
    fetchImpl: async (url, options) => { calls.push({ url, options }); return response(url); }
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://seva.example/ok?x=1');
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.equal(calls[0].options.mode, 'same-origin');
  assert.equal(calls[0].options.redirect, 'manual');
  assert.ok(calls[0].options.signal instanceof AbortSignal);
  assert.equal(report.scope, 'HTTP_REACHABILITY');
  assert.equal(report.overall, 'COMPLETE');
  assert.equal(report.coverage.all_application_routes_verified, false);
  assert.equal(report.coverage.page_content_and_workflows, 'NOT_VERIFIED');
});

test('same-origin pathnames starting with two slashes cannot become external requests', async () => {
  const calls = [];
  const report = await audit({
    hrefs: ['https://seva.example//example.invalid/collect', '/\\example.invalid/collect'],
    fetchImpl: async url => { calls.push(url); return response(url); }
  });
  assert.deepEqual(calls, ['https://seva.example//example.invalid/collect']);
  assert.equal(report.routes[0].outcome, 'HTTP_OK');
  assert.equal(report.excluded_links[0].reason, 'OTHER_ORIGIN');
});

test('HTTP redirects, browser opaque redirects and an already followed login redirect never count as success', async () => {
  for (const overrides of [
    { status: 302 },
    { status: 0, type: 'opaqueredirect', url: '' },
    { status: 200, redirected: true, url: 'https://seva.example/login' }
  ]) {
    const report = await audit({ hrefs: ['/private'], fetchImpl: async url => response(url, overrides) });
    assert.equal(report.routes[0].outcome, 'REDIRECT');
    assert.equal(report.reachable_http, 0);
    assert.equal(report.overall, 'INCOMPLETE');
  }
});

test('a response from another origin or unexpected path is rejected even if it reports HTTP 200', async () => {
  for (const url of ['https://example.invalid/private', 'https://seva.example/login', '']) {
    const report = await audit({ hrefs: ['/private'], fetchImpl: async () => response(url) });
    assert.equal(report.routes[0].outcome, 'UNEXPECTED_RESPONSE_URL');
    assert.equal(report.overall, 'INCOMPLETE');
  }
});

test('a timeout aborts the request and continues even when the fetch mock ignores its signal', async () => {
  const calls = [];
  const report = await audit({
    hrefs: ['/a-stuck', '/b-ok'], timeoutMs: 15,
    fetchImpl: (url, options) => {
      calls.push({ url, options });
      return url.endsWith('/a-stuck') ? new Promise(() => {}) : Promise.resolve(response(url));
    }
  });
  assert.equal(calls[0].options.signal.aborted, true);
  assert.deepEqual(report.routes.map(route => route.outcome), ['TIMEOUT', 'HTTP_OK']);
  assert.equal(report.overall, 'INCOMPLETE');
  assert.equal(report.reachable_http, 1);
});

test('HTTP errors and network failures are recorded and do not stop the remaining checks', async () => {
  const report = await audit({
    hrefs: ['/a-http-error', '/b-network-error', '/c-ok'],
    fetchImpl: async url => {
      if (url.endsWith('/b-network-error')) throw new Error('Simulated unavailable network');
      return response(url, { status: url.endsWith('/a-http-error') ? 503 : 204 });
    }
  });
  assert.deepEqual(report.routes.map(route => route.outcome), ['HTTP_ERROR', 'NETWORK_ERROR', 'HTTP_OK']);
  assert.equal(report.overall, 'INCOMPLETE');
  assert.equal(report.unsuccessful_http, 2);
});

test('unread response bodies are cancelled and requests aborted without waiting for stream cancellation', async () => {
  const cancellations = [];
  const signals = [];
  const report = await audit({
    hrefs: ['/a-ok', '/b-error'],
    fetchImpl: async (url, { signal }) => {
      signals.push(signal);
      return response(url, {
        status: url.endsWith('/b-error') ? 503 : 200,
        body: {
          cancel() {
            cancellations.push(url);
            return new Promise(() => {}); // A cancellation that never settles must not stall the audit.
          }
        }
      });
    }
  });
  assert.equal(cancellations.length, 2);
  assert.ok(signals.every(signal => signal.aborted));
  assert.deepEqual(report.routes.map(route => route.outcome), ['HTTP_OK', 'HTTP_ERROR']);
  assert.equal(report.overall, 'INCOMPLETE');
});

test('failed body cancellation still aborts and never replaces an HTTP failure with success', async () => {
  const signals = [];
  const report = await audit({
    hrefs: ['/a-rejected', '/b-locked'],
    fetchImpl: async (url, { signal }) => {
      signals.push(signal);
      return response(url, {
        status: 503,
        body: {
          cancel() {
            if (url.endsWith('/b-locked')) throw new Error('Stream is locked');
            return Promise.reject(new Error('Cancellation failed'));
          }
        }
      });
    }
  });
  assert.ok(signals.every(signal => signal.aborted));
  assert.deepEqual(report.routes.map(route => route.outcome), ['HTTP_ERROR', 'HTTP_ERROR']);
  assert.equal(report.reachable_http, 0);
  assert.equal(report.overall, 'INCOMPLETE');
});

test('zero eligible routes are INCOMPLETE without making a network request', async () => {
  const report = await audit({
    hrefs: ['#section', '//example.invalid/path'],
    fetchImpl: async () => { assert.fail('empty catalog must not call fetch'); }
  });
  assert.equal(report.total_paths_checked, 0);
  assert.equal(report.overall, 'INCOMPLETE');
  assert.equal(report.coverage.expected_application_route_count, null);
});

test('report integrity survives JSON export/import, detects modification and explicitly is not a signature', async () => {
  const report = await audit({ hrefs: ['/ok'], fetchImpl: async url => response(url) });
  const exported = JSON.parse(JSON.stringify(report, null, 2));
  assert.equal(report.integrity.authenticated, false);
  assert.match(report.integrity.serialization, /except integrity/);
  assert.equal(await verifyReportIntegrity(exported, webcrypto), true);
  exported.routes[0].http_status = 503;
  assert.equal(await verifyReportIntegrity(exported, webcrypto), false);
});

test('invalid configuration is rejected before any request', async () => {
  const fetchImpl = async () => { assert.fail('invalid configuration must not call fetch'); };
  for (const timeoutMs of [0, -1, 60001, 1.5]) {
    await assert.rejects(audit({ hrefs: ['/ok'], fetchImpl, timeoutMs }), /timeoutMs/);
  }
  await assert.rejects(audit({ hrefs: ['/ok'], fetchImpl, baseUrl: 'file:///tmp/page' }), /HTTP\(S\)/);
  await assert.rejects(audit({ hrefs: ['/ok'], fetchImpl, cryptoImpl: {} }), /Web Crypto/);
});

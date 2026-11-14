import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { pipelineSnapshot, pipelineEventId, reportPipeline, SYNAPSY_PIPELINE_ENDPOINT, SYNAPSY_PIPELINE_SOURCE, SYNAPSY_REPOSITORY, SYNAPSY_DEFAULT_BRANCH } from '../scripts/synapsy-infrastructure-proof.mjs';

const NOW = Date.parse('2026-11-14T20:00:00.000Z');
const SECRET = 'ab'.repeat(32); // Test-only HMAC key; never a provider credential.
const environment = () => ({ GITHUB_EVENT_NAME: 'workflow_run', GITHUB_REPOSITORY: SYNAPSY_REPOSITORY, GITHUB_SHA: 'f'.repeat(40), SYNAPSY_WEBHOOK_SECRET: SECRET });
const completedRun = () => ({
  action: 'completed',
  repository: { full_name: SYNAPSY_REPOSITORY, default_branch: SYNAPSY_DEFAULT_BRANCH },
  workflow_run: {
    id: 1234567890,
    run_attempt: 1,
    name: 'ci',
    event: 'push',
    status: 'completed',
    head_branch: SYNAPSY_DEFAULT_BRANCH,
    head_repository: { full_name: SYNAPSY_REPOSITORY },
    head_sha: 'a'.repeat(40),
    conclusion: 'success',
    updated_at: '2026-11-14T19:58:30Z',
  },
});
const accepted = (body, overrides = {}) => Response.json({ accepted: true, updated: true, eventId: JSON.parse(body).eventId, externalJobsStarted: 0, ...overrides }, { status: 202 });

test('reports the actual completed run and signs precisely the transmitted body', async () => {
  let calls = 0;
  const result = await reportPipeline(completedRun(), environment(), { clock: () => NOW, fetcher: async (url, options) => {
    calls++;
    assert.equal(url, SYNAPSY_PIPELINE_ENDPOINT);
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal instanceof AbortSignal);
    const event = JSON.parse(options.body);
    assert.deepEqual(Object.keys(event).sort(), ['eventId', 'observedAt', 'schemaVersion', 'snapshot', 'source']);
    assert.equal(event.schemaVersion, 1);
    assert.equal(event.source, SYNAPSY_PIPELINE_SOURCE);
    assert.equal(event.observedAt, '2026-11-14T20:00:00.000Z');
    assert.deepEqual(event.snapshot, { repository: SYNAPSY_REPOSITORY, workflow: 'ci', runId: '1234567890', runAttempt: 1, commit: 'a'.repeat(40), conclusion: 'success', completedAt: '2026-11-14T19:58:30.000Z' });
    const timestamp = String(Math.floor(NOW / 1000));
    assert.equal(options.headers['X-SEVA-Timestamp'], timestamp);
    const sign = raw => 'v1=' + createHmac('sha256', Buffer.from(SECRET, 'hex')).update(timestamp + '.' + raw).digest('hex');
    assert.equal(options.headers['X-SEVA-Signature'], sign(options.body));
    assert.notEqual(options.headers['X-SEVA-Signature'], sign(options.body + ' '));
    assert.equal(options.headers['Content-Type'], 'application/json');
    return accepted(options.body);
  } });
  assert.equal(calls, 1);
  assert.equal(result.accepted, true);
  assert.equal(result.updated, true);
});

test('failure and cancellation remain real CI conclusions, never manufactured infrastructure success', async () => {
  for (const conclusion of ['failure', 'cancelled', 'timed_out', 'neutral']) {
    const event = completedRun();
    event.workflow_run.conclusion = conclusion;
    await reportPipeline(event, environment(), { clock: () => NOW, fetcher: async (_, options) => {
      assert.equal(JSON.parse(options.body).snapshot.conclusion, conclusion);
      assert.equal(Object.hasOwn(JSON.parse(options.body), 'deploy'), false);
      return accepted(options.body);
    } });
  }
});

test('event identity is stable for retries and distinct for a new CI attempt', () => {
  const snapshot = pipelineSnapshot(completedRun(), environment(), NOW);
  const id = pipelineEventId(snapshot);
  assert.match(id, /^[a-f0-9]{8}-[a-f0-9]{4}-8[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
  assert.equal(pipelineEventId({ ...snapshot, completedAt: '2026-11-14T19:59:00.000Z' }), id);
  assert.notEqual(pipelineEventId({ ...snapshot, runAttempt: 2 }), id);
  assert.notEqual(pipelineEventId({ ...snapshot, runId: '1234567891' }), id);
});

test('a manually dispatched CI run is accepted only on the trusted default branch', () => {
  const event = completedRun();
  event.workflow_run.event = 'workflow_dispatch';
  assert.equal(pipelineSnapshot(event, environment(), NOW).runId, '1234567890');
  event.workflow_run.head_branch = 'feature/untrusted';
  assert.throws(() => pipelineSnapshot(event, environment(), NOW), /Untrusted/);
});

test('missing and malformed secrets fail before any network request', async () => {
  for (const secret of [undefined, '', 'abc', 'ab'.repeat(31), 'zz'.repeat(32), 'AB'.repeat(32)]) {
    let called = false;
    await assert.rejects(reportPipeline(completedRun(), { ...environment(), SYNAPSY_WEBHOOK_SECRET: secret }, { clock: () => NOW, fetcher: async () => { called = true; throw Error('Unexpected network call'); } }), /SYNAPSY_WEBHOOK_SECRET/);
    assert.equal(called, false);
  }
});

test('untrusted origins, pull requests and incomplete runs cannot use the reporting secret', async () => {
  const changes = [
    (e, env) => { env.GITHUB_EVENT_NAME = 'push'; },
    (e, env) => { env.GITHUB_REPOSITORY = 'attacker/fork'; },
    e => { e.action = 'requested'; },
    e => { e.repository.full_name = 'attacker/fork'; },
    e => { e.repository.default_branch = 'other'; },
    e => { e.workflow_run.head_repository.full_name = 'attacker/fork'; },
    e => { e.workflow_run.head_branch = 'feature/untrusted'; },
    e => { e.workflow_run.event = 'pull_request'; },
    e => { e.workflow_run.name = 'other-workflow'; },
    e => { e.workflow_run.status = 'in_progress'; },
    e => { e.workflow_run.conclusion = null; },
    e => { e.workflow_run.conclusion = 'SUCCESS'; },
    e => { e.workflow_run.head_sha = 'main'; },
    e => { e.workflow_run.run_attempt = 0; },
    e => { e.workflow_run.id = Number.MAX_SAFE_INTEGER + 1; },
    e => { e.workflow_run.updated_at = '2026-11-14T20:06:00Z'; },
    e => { e.workflow_run.updated_at = '2026-02-30T19:00:00Z'; },
  ];
  for (const change of changes) {
    const event = completedRun(), env = environment();
    change(event, env);
    let called = false;
    await assert.rejects(reportPipeline(event, env, { clock: () => NOW, fetcher: async () => { called = true; throw Error('Unexpected network call'); } }));
    assert.equal(called, false);
  }
});

test('HTTP errors, redirects and non-202 success responses fail delivery', async () => {
  for (const status of [200, 204, 301, 302, 307, 401, 403, 404, 500, 503]) {
    await assert.rejects(reportPipeline(completedRun(), environment(), { clock: () => NOW, fetcher: async () => new Response(null, { status }) }), /Receipt not accepted/);
  }
  await assert.rejects(reportPipeline(completedRun(), environment(), { clock: () => NOW, fetcher: async (_, options) => {
    assert.equal(options.redirect, 'error');
    throw new TypeError('Redirect rejected');
  } }), /Redirect rejected/);
});

test('a 202 response must identify the exact event and acknowledge no external jobs', async () => {
  const wrongReceipts = [{ accepted: false }, { updated: 'true' }, { eventId: '00000000-0000-0000-0000-000000000000' }, { externalJobsStarted: 1 }];
  for (const override of wrongReceipts) {
    await assert.rejects(reportPipeline(completedRun(), environment(), { clock: () => NOW, fetcher: async (_, options) => accepted(options.body, override) }), /Unexpected receipt/);
  }
  await assert.rejects(reportPipeline(completedRun(), environment(), { clock: () => NOW, fetcher: async () => new Response('<html>Sign in</html>', { status: 202, headers: { 'content-type': 'text/html' } }) }), /Receipt not accepted/);
  await assert.rejects(reportPipeline(completedRun(), environment(), { clock: () => NOW, fetcher: async () => new Response('{', { status: 202, headers: { 'content-type': 'application/json' } }) }));
  await assert.rejects(reportPipeline(completedRun(), environment(), { clock: () => NOW, fetcher: async () => new Response(' '.repeat(4097), { status: 202, headers: { 'content-type': 'application/json' } }) }), /Receipt too large/);
});

test('an acknowledged duplicate is accepted without claiming an update', async () => {
  const result = await reportPipeline(completedRun(), environment(), { clock: () => NOW, fetcher: async (_, options) => accepted(options.body, { updated: false }) });
  assert.equal(result.accepted, true);
  assert.equal(result.updated, false);
});

test('network timeout or transport failure does not become an accepted report', async () => {
  await assert.rejects(reportPipeline(completedRun(), environment(), { clock: () => NOW, fetcher: async () => { throw new DOMException('Timed out', 'TimeoutError'); } }), { name: 'TimeoutError' });
});

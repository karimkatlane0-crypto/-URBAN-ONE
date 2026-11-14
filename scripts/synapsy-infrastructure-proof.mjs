// Reports a completed GitHub CI run. This script does not deploy, restart or recover services.
// Protocol-compatible with SYNAPSY /api/infrastructure/events/pipeline.
import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SYNAPSY_PIPELINE_ENDPOINT = 'https://seva.karimkatlane0.chatgpt.site/api/infrastructure/events/pipeline';
export const SYNAPSY_PIPELINE_SOURCE = 'synapsy-urban-one-ci';
export const SYNAPSY_REPOSITORY = 'karimkatlane0-crypto/-URBAN-ONE';
export const SYNAPSY_DEFAULT_BRANCH = 'main-@URBAN-ONE';
const WORKFLOW = 'ci';
const CONCLUSIONS = new Set(['success', 'failure', 'cancelled', 'skipped', 'timed_out', 'action_required', 'neutral', 'stale', 'startup_failure']);
const fail = message => { throw new Error(message); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function completionTime(value, now) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) fail('Invalid CI completion time');
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || parsed > now + 300000 || new Date(parsed).toISOString() !== value.replace(/(?<=\d{2}:\d{2}:\d{2})Z$/, '.000Z')) fail('Invalid CI completion time');
  return new Date(parsed).toISOString();
}

export function pipelineSnapshot(event, env = process.env, now = Date.now()) {
  const run = event?.workflow_run;
  if (env.GITHUB_EVENT_NAME !== 'workflow_run' || env.GITHUB_REPOSITORY !== SYNAPSY_REPOSITORY ||
      !object(event) || event.action !== 'completed' || event.repository?.full_name !== SYNAPSY_REPOSITORY ||
      event.repository?.default_branch !== SYNAPSY_DEFAULT_BRANCH || !object(run) ||
      run.name !== WORKFLOW || !['push', 'workflow_dispatch'].includes(run.event) || run.status !== 'completed' ||
      run.head_branch !== SYNAPSY_DEFAULT_BRANCH || run.head_repository?.full_name !== SYNAPSY_REPOSITORY) {
    fail('Untrusted or incomplete CI event');
  }
  if (!Number.isSafeInteger(run.id) || run.id < 1 || !Number.isSafeInteger(run.run_attempt) || run.run_attempt < 1 || run.run_attempt > 1000000000 ||
      typeof run.head_sha !== 'string' || !/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(run.head_sha) || !CONCLUSIONS.has(run.conclusion)) {
    fail('Invalid CI result');
  }
  return {
    repository: SYNAPSY_REPOSITORY,
    workflow: WORKFLOW,
    runId: String(run.id),
    runAttempt: run.run_attempt,
    commit: run.head_sha,
    conclusion: run.conclusion,
    // GitHub's completed workflow_run supplies its last update time, not the reporter's start time.
    completedAt: completionTime(run.updated_at, now),
  };
}

export function pipelineEventId(snapshot) {
  // UUIDv8, deterministically scoped to one source/run/attempt. Retries keep the same identity.
  const bytes = createHash('sha256').update(JSON.stringify([
    'synapsy-infrastructure-v1', SYNAPSY_PIPELINE_SOURCE, snapshot.repository,
    snapshot.workflow, snapshot.runId, snapshot.runAttempt,
  ])).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function receiptBody(response) {
  const reader = response.body?.getReader();
  if (!reader) fail('Missing receipt');
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); fail('Receipt too large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = Buffer.concat(chunks);
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

export async function reportPipeline(event, env = process.env, { fetcher = fetch, clock = Date.now } = {}) {
  const secret = env.SYNAPSY_WEBHOOK_SECRET;
  if (typeof secret !== 'string' || !/^[a-f0-9]{64}$/.test(secret)) throw Object.assign(new Error('Missing or invalid SYNAPSY_WEBHOOK_SECRET'), { code: 'CONFIGURATION_REQUIRED' });
  const now = clock();
  if (!Number.isSafeInteger(now) || !Number.isFinite(new Date(now).getTime())) fail('Invalid observation time');
  const snapshot = pipelineSnapshot(event, env, now);
  const eventId = pipelineEventId(snapshot);
  const body = JSON.stringify({ schemaVersion: 1, eventId, source: SYNAPSY_PIPELINE_SOURCE, observedAt: new Date(now).toISOString(), snapshot });
  const timestamp = String(Math.floor(now / 1000));
  const signature = 'v1=' + createHmac('sha256', Buffer.from(secret, 'hex')).update(timestamp + '.' + body).digest('hex');
  const response = await fetcher(SYNAPSY_PIPELINE_ENDPOINT, {
    method: 'POST',
    redirect: 'error',
    headers: { 'Content-Type': 'application/json', 'X-SEVA-Timestamp': timestamp, 'X-SEVA-Signature': signature },
    body,
    signal: AbortSignal.timeout(20000),
  });
  if (response.status !== 202 || response.redirected || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) {
    await response.body?.cancel();
    fail('Receipt not accepted');
  }
  const receipt = await receiptBody(response);
  if (!object(receipt) || receipt.accepted !== true || typeof receipt.updated !== 'boolean' || receipt.eventId !== eventId || receipt.externalJobsStarted !== 0) fail('Unexpected receipt');
  return { accepted: true, updated: receipt.updated, eventId };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  Promise.resolve().then(() => {
    if (!process.env.GITHUB_EVENT_PATH) fail('Missing workflow event');
    const raw = readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8');
    if (Buffer.byteLength(raw, 'utf8') > 1048576) fail('Workflow event too large');
    return reportPipeline(JSON.parse(raw));
  }).then(result => {
    process.stdout.write(result.updated ? 'SYNAPSY: completed CI report received.\n' : 'SYNAPSY: duplicate or older CI report acknowledged.\n');
  }).catch(error => {
    process.stderr.write(error.code === 'CONFIGURATION_REQUIRED'
      ? 'SYNAPSY: CONFIGURATION REQUIRED. Set SYNAPSY_WEBHOOK_SECRET to the same 64 lowercase hexadecimal signing key configured for the pipeline receiver.\n'
      : 'SYNAPSY: CI report failed. Check the trusted workflow event and secure configuration.\n');
    process.exitCode = 1;
  });
}


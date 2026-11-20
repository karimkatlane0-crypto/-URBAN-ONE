import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required CI provenance field: ${name}`);
  return value;
}

const sourceCommit = required('GITHUB_SHA');
const runId = required('GITHUB_RUN_ID');
const workflow = required('GITHUB_WORKFLOW');
const ref = required('GITHUB_REF');
const gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

if (!/^[a-f0-9]{40}$/i.test(sourceCommit)) throw new Error('GITHUB_SHA is not a full commit SHA');
if (gitHead.toLowerCase() !== sourceCommit.toLowerCase()) {
  throw new Error(`Checkout mismatch: GITHUB_SHA=${sourceCommit}, HEAD=${gitHead}`);
}

const record = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceCommit,
  gitHead,
  workflow,
  workflowRunId: runId,
  ref,
  eventName: required('GITHUB_EVENT_NAME'),
  repository: required('GITHUB_REPOSITORY'),
  testLiveBoundary: 'CI_ONLY_NO_LIVE_ACTIONS'
};

fs.writeFileSync(
  new URL('../release/build-provenance.json', import.meta.url),
  JSON.stringify(record, null, 2) + '\n'
);
console.log(JSON.stringify({ ok: true, sourceCommit, workflowRunId: runId }));

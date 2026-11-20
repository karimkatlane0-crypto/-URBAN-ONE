import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SHA_RE = /^[a-f0-9]{40}$/i;

function required(env, name) {
  const value = env[name];
  if (!value) throw new Error(`Missing required CI provenance field: ${name}`);
  return value;
}

function validSha(value, label) {
  if (typeof value !== 'string' || !SHA_RE.test(value)) {
    throw new Error(`${label} is not a full commit SHA`);
  }
  return value;
}

export function createProvenanceRecord({ env, gitHead, eventPayload, generatedAt = new Date().toISOString() }) {
  const sourceCommit = validSha(required(env, 'GITHUB_SHA'), 'GITHUB_SHA');
  const checkedOutSha = validSha(gitHead, 'git HEAD');
  const eventName = required(env, 'GITHUB_EVENT_NAME');

  if (checkedOutSha.toLowerCase() !== sourceCommit.toLowerCase()) {
    throw new Error(`Checkout mismatch: GITHUB_SHA=${sourceCommit}, HEAD=${checkedOutSha}`);
  }

  let pullRequest = null;
  if (eventName === 'pull_request' || eventName === 'pull_request_target') {
    const pr = eventPayload?.pull_request;
    if (!pr) throw new Error('Pull request event payload is missing pull_request metadata');
    pullRequest = {
      number: pr.number ?? eventPayload.number ?? null,
      headSha: validSha(pr.head?.sha, 'pull_request.head.sha'),
      baseSha: validSha(pr.base?.sha, 'pull_request.base.sha'),
      mergeCommitSha: pr.merge_commit_sha ? validSha(pr.merge_commit_sha, 'pull_request.merge_commit_sha') : null
    };
  }

  return {
    schemaVersion: 2,
    generatedAt,
    sourceCommit,
    checkedOutSha,
    workflow: required(env, 'GITHUB_WORKFLOW'),
    workflowRunId: required(env, 'GITHUB_RUN_ID'),
    ref: required(env, 'GITHUB_REF'),
    eventName,
    repository: required(env, 'GITHUB_REPOSITORY'),
    pullRequest,
    testLiveBoundary: 'CI_ONLY_NO_LIVE_ACTIONS'
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env = process.env;
  const gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const eventName = required(env, 'GITHUB_EVENT_NAME');
  let eventPayload = null;

  if (eventName === 'pull_request' || eventName === 'pull_request_target') {
    const eventPath = required(env, 'GITHUB_EVENT_PATH');
    eventPayload = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  }

  const record = createProvenanceRecord({ env, gitHead, eventPayload });

  fs.writeFileSync(
    new URL('../release/build-provenance.json', import.meta.url),
    JSON.stringify(record, null, 2) + '\n'
  );
  console.log(JSON.stringify({
    ok: true,
    sourceCommit: record.sourceCommit,
    pullRequest: record.pullRequest,
    workflowRunId: record.workflowRunId
  }));
}

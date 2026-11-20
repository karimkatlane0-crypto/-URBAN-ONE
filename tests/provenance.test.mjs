import test from 'node:test';
import assert from 'node:assert/strict';
import { createProvenanceRecord } from '../scripts/provenance.mjs';

const headSha = 'a'.repeat(40);
const baseSha = 'b'.repeat(40);
const mergeSha = 'c'.repeat(40);

function fixture(overrides = {}) {
  return {
    env: {
      GITHUB_SHA: mergeSha,
      GITHUB_RUN_ID: '123456',
      GITHUB_WORKFLOW: 'ci',
      GITHUB_REF: 'refs/pull/232/merge',
      GITHUB_EVENT_NAME: 'pull_request',
      GITHUB_REPOSITORY: 'karimkatlane0-crypto/-URBAN-ONE',
      ...overrides.env
    },
    gitHead: mergeSha,
    eventPayload: {
      number: 232,
      pull_request: {
        number: 232,
        head: { sha: headSha },
        base: { sha: baseSha },
        merge_commit_sha: null
      },
      ...overrides.eventPayload
    },
    generatedAt: '2026-11-20T22:31:53.000Z'
  };
}

test('records checked-out merge SHA separately from PR head and base', () => {
  const record = createProvenanceRecord(fixture());
  assert.equal(record.schemaVersion, 2);
  assert.equal(record.sourceCommit, mergeSha);
  assert.equal(record.checkedOutSha, mergeSha);
  assert.deepEqual(record.pullRequest, {
    number: 232,
    headSha,
    baseSha,
    mergeCommitSha: null
  });
});

test('fails closed when checked-out SHA differs from GITHUB_SHA', () => {
  assert.throws(
    () => createProvenanceRecord(fixture({ gitHead: headSha })),
    /Checkout mismatch/
  );
});

test('fails closed when pull request metadata is absent', () => {
  assert.throws(
    () => createProvenanceRecord(fixture({ eventPayload: {} })),
    /missing pull_request metadata/
  );
});

test('fails closed when a PR head SHA is malformed', () => {
  assert.throws(
    () => createProvenanceRecord(fixture({
      eventPayload: { pull_request: { head: { sha: 'short' }, base: { sha: baseSha } } }
    })),
    /pull_request.head.sha is not a full commit SHA/
  );
});

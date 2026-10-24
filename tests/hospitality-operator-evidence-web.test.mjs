import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const page=read('apps/web/checkin-checkout.html');
const doc=read('docs/HOSPITALITY_OPERATOR_EVIDENCE_2026.md');

test('public hospitality guide references source-only operator attestation runbook',()=>{
 assert.match(page,/HOSPITALITY_OPERATOR_EVIDENCE_2026\.md/);
 assert.match(page,/non prova una comunicazione alle autorità/);
 assert.match(doc,/OPERATOR_ATTESTATION_SOURCE_READY/);
 assert.match(doc,/ALLOGGIATI_LIVE=false/);
 assert.match(doc,/HOSTED_GUEST_BACKEND=false/);
});

test('no client-side authentication or guest data collection in public source',()=>{
 assert.doesNotMatch(page,/<form[\s>]|<input[\s>]|<script[\s>]|sk_(?:live|test)_|whsec_/i);
 assert.doesNotMatch(page,/https:\/\/buy\.stripe\.com\//);
 assert.doesNotMatch(doc,/PRIVATE_PASSPORT_NUMBER|sk_(?:live|test)_|whsec_/);
});

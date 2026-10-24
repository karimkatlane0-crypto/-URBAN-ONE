import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('public check-in guide links to private Smoobu bridge runbook',()=>{
 const page=read('apps/web/checkin-checkout.html');
 assert.match(page,/HOSPITALITY_PMS_SMOOBU_BRIDGE_2026\.md/);
 assert.match(page,/non è verificato come gestionale effettivo/i);
 assert.match(page,/Alloggiati Web/);
 assert.doesNotMatch(page,/<form[\s>]|<input[\s>]|<script[\s>]|sk_(?:live|test)_|whsec_/i);
});
test('Smoobu bridge documentation does not claim provider or police sync',()=>{
 const doc=read('docs/HOSPITALITY_PMS_SMOOBU_BRIDGE_2026.md');
 assert.match(doc,/NON LIVE/);
 assert.match(doc,/NOT_CONNECTED/);
 assert.match(doc,/GET \/api\/reservations/);
 assert.match(doc,/SMOOBU_EXPORT_PROJECTION=CODE_TESTED/);
});

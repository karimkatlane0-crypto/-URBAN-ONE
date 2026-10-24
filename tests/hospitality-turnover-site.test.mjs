import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const page=read('apps/web/checkin-checkout.html');

test('turnover guide is linked from the public hospitality and home pages',()=>{
  assert.match(read('apps/web/index.html'),/href="\.\/checkin-checkout\.html"/);
  assert.match(read('apps/web/hospitality-it.html'),/href="\.\/checkin-checkout\.html"/);
  assert.match(page,/Check-in e check-out: calendario operativo da file/);
  assert.match(page,/HOSPITALITY_TURNOVER_IMPORT_2026\.md/);
  assert.match(page,/hospitality-turnover\.mjs/);
});

test('turnover guide is truthful about external and human verification',()=>{
  assert.match(page,/Non attivo:/);
  assert.match(page,/Alloggiati Web/);
  assert.match(page,/CSV autorizzato/);
  assert.match(page,/BOOK-001,PROPERTY-01/);
  assert.doesNotMatch(page,/<form[\s>]|<input[\s>]|<script[\s>]|google-analytics|googletagmanager|fbq\(/i);
  assert.doesNotMatch(page,/\bIT[0-9]{2}[A-Z][0-9]{22}\b|sk_(?:live|test)_|whsec_/i);
});

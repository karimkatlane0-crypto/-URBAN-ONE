import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const landing=read('apps/web/financial-insights.html');

test('monthly insights proposal is discoverable from the website',()=>{
  assert.match(read('apps/web/index.html'),/href="\.\/financial-insights\.html"/);
  assert.match(read('apps/web/europe-it.html'),/href="\.\/financial-insights\.html"/);
  assert.match(landing,/<title>URBAN ONE/);
  assert.match(landing,/29 euro per cliente/);
});

test('the monthly pilot only links the approved one-time checkout',()=>{
  assert.match(landing,/https:\/\/buy\.stripe\.com\/7sYbJ351fghgei7auSb7y05/);
  assert.doesNotMatch(landing,/https:\/\/buy\.stripe\.com\/9B65kF9hv6GG4HxcD0b7y02/);
  assert.match(landing,/Non è un abbonamento con rinnovo automatico/);
  assert.match(landing,/Nessuna connessione bancaria PSD2 AIS\/PIS attiva/);
});

test('pilot page has no IBAN or private payment credentials',()=>{
  assert.doesNotMatch(landing,/\bIT\d{2}[A-Z]\d{22}\b|sk_(?:live|test)_|whsec_/i);
  assert.match(landing,/target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(landing,/<script|<form|googletagmanager|google-analytics|fbq\(/i);
});

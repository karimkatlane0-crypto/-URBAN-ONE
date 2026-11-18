import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../public/control-plane.html',import.meta.url),'utf8');

test('control plane declares the snapshot and production boundary',()=>{
  assert.match(html,/snapshot di verifica del 18 novembre 2026/i);
  assert.match(html,/non esegue modifiche remote/i);
  assert.match(html,/NO-GO produzione/i);
});

test('control plane includes required integration and evidence states',()=>{
  for(const term of ['GitHub','Vercel','Kubernetes','Power BI','SYNAPSY','Klaviyo','WordPress','Spotify','Amazon','WhatsApp','Google Drive','Data'])
    assert.ok(html.includes(term),term+' integration card missing');
  for(const state of ['PASS','READY','PARTIAL','BLOCKED','UNVERIFIED'])
    assert.ok(html.includes(state),state+' status missing');
});

test('control plane has accessible search and state filters',()=>{
  assert.match(html,/aria-label="Cerca integrazioni"/);
  assert.match(html,/aria-pressed="true"/);
  assert.match(html,/addEventListener\('input'/);
  assert.match(html,/aria-label="Filtra per stato"/);
});

test('control plane contains no remote mutation or secret-bearing browser logic',()=>{
  assert.doesNotMatch(html,/fetch\s*\(/);
  assert.doesNotMatch(html,/XMLHttpRequest/);
  assert.doesNotMatch(html,/Authorization\s*:\s*Bearer/i);
  assert.doesNotMatch(html,/checkout\.stripe\.com/i);
  assert.doesNotMatch(html,/api[_-]?key\s*=/i);
});

test('main studio exposes the unified control plane route',()=>{
  const studio=readFileSync(new URL('../public/studio.html',import.meta.url),'utf8');
  assert.match(studio,/control-plane\.html/);
});

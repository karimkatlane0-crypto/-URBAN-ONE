import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const web=read('apps/web/seva-crm-studio.html');
const mobile=read('apps/mobile/www/seva-crm-studio.html');

test('SEVA unified CRM is mirrored across Web and mobile',()=>{
  assert.equal(web,mobile);
  for(const section of ['overview','contacts','audiences','journeys','campaigns','analytics','integrations','governance']){
    assert.ok(web.includes('id="'+section+'"'),section);
  }
  assert.ok(web.includes('href="./seva-unified-studio.html"'));
  assert.ok(web.includes('https://www.klaviyo.com/dashboard'));
});

test('CRM snapshot and consent gate remain explicit and privacy-safe',()=>{
  for(const phrase of ['181','Elenco e-mail','Elenco della messaggistica di testo','0 / 0','READ-ONLY SNAPSHOT','Import consent-aware','Nessun contatto importato']){
    assert.ok(web.includes(phrase),phrase);
  }
  assert.ok(!web.includes('karimkatlane0@gmail.com'));
  assert.ok(!web.includes('karimkatlane86@gmail.com'));
  assert.ok(!web.includes('<form'));
  assert.ok(!web.includes('fetch('));
  assert.ok(!web.includes('XMLHttpRequest'));
  assert.ok(!web.includes('localStorage'));
  assert.ok(!web.includes('https://api.'));
  assert.ok(web.includes('nessuna sincronizzazione automatica attiva'));
  assert.ok(web.includes('ULTIMO SNAPSHOT DISPONIBILE · STORICO'));
  assert.ok(!web.includes('SNAPSHOT VERIFICATO'));
});

test('Engagement drafts are consent-aware and integration states match observed permissions',()=>{
  assert.ok(web.includes('Engagement message library · draft-only'));
  assert.ok(web.includes('Nessun invio, audience o budget attivato'));
  assert.ok(web.includes('consenso verificato'));
  assert.ok(web.includes('Supermetrics · Meta Ads'));
  assert.ok(web.includes('Authenticated · 1 account discovered'));
  assert.ok(web.includes('Google Ads'));
  assert.ok(web.includes('no account discovered'));
  assert.ok(web.includes('Write: permission change required'));
  assert.ok(web.includes('Stripe'));
  assert.ok(web.includes('1 LIVE account available'));
});

test('AI orchestration and MLOps status is described without claiming live training',()=>{
  assert.ok(web.includes('Agent orchestration'));
  assert.ok(web.includes('MLOps / DLoPs'));
  assert.ok(web.includes('Nessun training o provider dispatch'));
});

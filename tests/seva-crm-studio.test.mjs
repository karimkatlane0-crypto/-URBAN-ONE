import assert from 'node:assert/strict';
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
  for(const phrase of ['181','Elenco e-mail','Elenco della messaggistica di testo','0 / 0','SAFE MODE','Import consent-aware','Nessun contatto importato']){
    assert.ok(web.includes(phrase),phrase);
  }
  assert.doesNotMatch(web,/karimkatlane0@gmail\\.com|karimkatlane86@gmail\\.com/);
  assert.doesNotMatch(web,/<form|fetch\\(|XMLHttpRequest|localStorage|https:\\/\\/api\\./i);
});

test('AI orchestration and MLOps status is described without claiming live training',()=>{
  assert.ok(web.includes('Agent orchestration'));
  assert.ok(web.includes('MLOps / DLoPs'));
  assert.ok(web.includes('Nessun training o provider dispatch'));
});

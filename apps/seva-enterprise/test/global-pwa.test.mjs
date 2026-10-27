import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../public/',import.meta.url);
const file=n=>readFileSync(new URL(n,root),'utf8');
test('SEVA GLOBAL: manifest has HTTPS-origin-independent relative app scope',()=>{
 const m=JSON.parse(file('manifest-global.webmanifest'));
 assert.equal(m.display,'standalone');assert.equal(m.scope,'/');
 assert.ok(m.icons.some(x=>x.type==='image/svg+xml'&&x.sizes==='any'));
 assert.ok(m.icons.some(x=>x.type==='image/png'&&x.sizes==='192x192'));
 assert.ok(m.icons.some(x=>x.type==='image/png'&&x.sizes==='512x512'));
 assert.ok(m.shortcuts.some(s=>s.url==='/psdm.html'));
});
test('SEVA GLOBAL: static PWA never caches private APIs or billing',()=>{
 const sw=file('sw-global.js');
 assert.match(sw,/req\.method!=='GET'/);
 assert.match(sw,/url\.pathname\.startsWith\('\/api\/'\)/);
 assert.match(sw,/url\.pathname\.startsWith\('\/bank'\)/);
 assert.match(sw,/Set-Cookie/);
 assert.doesNotMatch(sw,/['"]\/api\/me['"]/);
 assert.doesNotMatch(sw,/['"]\/api\/ai\/generate['"]/);
});
test('SEVA GLOBAL: mobile Studio retains backend-gated AI and human-approved local planner',()=>{
 const html=file('studio.html'),js=file('studio.js');
 assert.match(html,/id="install-seva"/);
 assert.match(html,/href="\/psdm\.html"/);
 assert.match(html,/id="backup-export"/);
 assert.match(js,/\/api\/ai\/generate/);
 assert.match(js,/local-plan/);
 assert.match(js,/serverReady/);
});
test('SEVA GLOBAL: PSDM is non-executing and source-only',()=>{
 const engine=file('psdm-engine.js');
 assert.match(engine,/externalActionExecuted:false/);
 assert.match(engine,/paymentExecuted:false/);
 assert.match(engine,/SIMULAZIONE_NON_VERIFICATA/);
});
test('SEVA GLOBAL: backup input has strict local validation and no remote transport',()=>{
 const code=file('backup-global.js');
 assert.match(code,/localStorage/);
 assert.match(code,/file\.size>200000/);
 assert.match(code,/window\.confirm/);
 assert.doesNotMatch(code,/\bfetch\s*\(/);
});
test('SEVA GLOBAL: Android install guidance never claims Play release',()=>{
 const html=file('mobile.html');
 assert.match(html,/NON È GOOGLE PLAY/);
 assert.match(html,/Installa app/);
 assert.match(html,/API/);
});

import {icon} from '../scripts/generate-pwa-icons.mjs';
test('SEVA GLOBAL: portable PNG icons have authentic signatures and sizes',()=>{
 for(const size of [192,512]){const bytes=icon(size);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Adobe-inspired original styles are local and Web/mobile parity holds',()=>{
 const web=read('apps/web/pole-premium.html');
 const mobile=read('apps/mobile/www/pole-premium.html');
 const webCss=read('apps/web/pole-spectrum.css');
 const mobileCss=read('apps/mobile/www/pole-spectrum.css');
 assert.equal(web,mobile);
 assert.equal(webCss,mobileCss);
 assert.match(web,/href="\.\/pole-spectrum\.css"/);
 assert.match(web,/https:\/\/spectrum\.adobe\.com\/page\/home\//);
 assert.match(web,/https:\/\/www\.adobe\.com\/express\/create\/brand-kit/);
 assert.match(web,/Nessun account Adobe collegato/);
 assert.match(webCss,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(webCss,/:focus-visible/);
 assert.doesNotMatch(webCss,/@import|url\(|https?:\/\//i);
});
test('Pole Premium existing demo code, status disclosures, and safety elements remain',()=>{
 const web=read('apps/web/pole-premium.html');
 const mobileJs=read('apps/mobile/www/pole-premium.js');
 const webJs=read('apps/web/pole-premium.js');
 for(const id of ['draftForm','mlForm','walkConsent','startWalk','stopWalk','premiumStatus']){
   assert.ok(web.includes('id="'+id+'"'),id);
 }
 assert.ok(web.includes('Sperimentazione locale'));
 assert.ok(web.includes('nessuna vendita attiva'));
 assert.ok(webJs.includes('const entitled=false'));
 assert.equal(mobileJs,webJs);
});

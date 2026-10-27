import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../public/',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
test('Growth: multilingual landing retains accurate independent project messaging',()=>{
 const html=read('discover.html'),js=read('discover.js');
 for(const language of ['it','en','es'])assert.match(js,new RegExp('(?:^|\\n)'+language+':\\{'));
 for(const key of ['headline','intro','ctaTry','ctaDecide','ctaPilot','transparentText'])
  assert.match(js,new RegExp(key+':'));
 assert.match(html,/indipendente/);
 assert.match(html,/non sono ancora attivati/);
});
test('Growth: zero-form buyer lead CTA and no auto messaging or checkout',()=>{
 const html=read('discover.html'),js=read('discover.js');
 assert.match(html,/mailto:karimkatlane0@gmail.com/);
 assert.match(html,/href="\/studio.html#goals"/);
 assert.match(html,/href="\/psdm.html"/);
 assert.match(html,/href="\/mobile.html"/);
 assert.doesNotMatch(js,/\bfetch\s*\(/);
 assert.doesNotMatch(js,/localStorage|sessionStorage/);
 assert.doesNotMatch(html,/<form\b|<iframe\b/i);
});
test('Growth: social share requires explicit click and no third-party trackers',()=>{
 const html=read('discover.html'),js=read('discover.js');
 assert.match(js,/getElementById\('share'\)\.addEventListener\('click'/);
 assert.match(js,/navigator\.share/);
 assert.match(js,/navigator\.clipboard\.writeText/);
 assert.match(html,/rel="canonical"/);
 assert.match(html,/property="og:title"/);
 assert.doesNotMatch(html,/google-analytics|googletagmanager|facebook\.net|hotjar|pixel\.js/i);
});
test('Growth: service worker limits caching to public static content',()=>{
 const sw=read('sw-global.js');
 assert.match(sw,/discover\.html/);
 assert.match(sw,/discover\.css/);
 assert.match(sw,/discover\.js/);
 assert.match(sw,/startsWith\('\/api\/'\)/);
 assert.match(sw,/startsWith\('\/bank'\)/);
});
test('Growth: studio accessible trial path and Android page remain linked',()=>{
 const studio=read('studio.html'),mobile=read('mobile.html');
 assert.match(studio,/href="\/discover.html"/);
 assert.match(studio,/href="#goals">Crea il tuo primo obiettivo/);
 assert.match(mobile,/href="\/discover.html"/);
});

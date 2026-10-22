import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const langs=['it','en','de','fr','es'];
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('five check-in/out campaign pages are translated and linked',()=>{
 const home=read('apps/web/index.html');
 const readme=read('README.md');
 const press=read('apps/web/press.html');
 for(const l of langs){
  const html=read('apps/web/hospitality-'+l+'.html');
  assert.match(html,new RegExp('<html lang="'+l+'">'));
  assert.match(html,/href="\.\/europe\.css"/);
  assert.match(html,/mailto:karimkatlane0@gmail\.com/);
  assert.match(html,/Check-in/i);
  assert.match(html,/check-out/i);
  assert.match(html,/<main>/);
  assert.match(home,new RegExp('hospitality-'+l+'\.html'));
  assert.match(readme,new RegExp('hospitality-'+l+'\.html'));
  assert.match(press,new RegExp('hospitality-'+l+'\.html'));
 }
});
test('public pages contain no automatic payment, analytics or contract acceptance',()=>{
 for(const l of langs){
  const html=read('apps/web/hospitality-'+l+'.html');
  assert.doesNotMatch(html,/<script|<form[\s>]|buy\.stripe\.com|<iframe|googletagmanager/i);
  assert.doesNotMatch(html,/IT\d{2}[A-Z]\d{22}|sk_(?:live|test)_|whsec_/i);
  assert.match(html,/europe|eu|Europa|Europ|hôtellerie|hostelería/i);
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const web=readFileSync(new URL('../apps/web/v10-workspace.html',import.meta.url),'utf8');
const mobile=readFileSync(new URL('../apps/mobile/www/v10-workspace.html',import.meta.url),'utf8');
test('workspace Web and mobile sources are identical and links resolve locally',()=>{
 assert.equal(web,mobile);
 for(const path of ['index.html','europe-immobili.html','pole-position.html','pole-premium.html','hospitality-it.html','travel-preview.html','europe-it.html','press.html']){
  assert.match(web,new RegExp('href="\\./'+path.replace('.','\\.')+'"'));
  assert.ok(existsSync(new URL('../apps/web/'+path,import.meta.url)));
  assert.ok(existsSync(new URL('../apps/mobile/www/'+path,import.meta.url)));
 }
});
test('workspace discloses release limits and exposes only static navigation',()=>{
 for(const phrase of ['v7.0.0','non è una release v10 certificata','esecuzione provider disabilitata','Nessun addebito automatico']) assert.ok(web.includes(phrase),phrase);
 assert.doesNotMatch(web,/<form|fetch\(|XMLHttpRequest|https:\/\/api\.stripe\.com/i);
 assert.match(web,/role="status"/);
});

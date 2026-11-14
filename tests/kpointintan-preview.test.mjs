import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const page=fs.readFileSync(new URL('../apps/seva-enterprise/public/kpointintan-superapp-preview.html',import.meta.url),'utf8');
test('three customer journeys are available',()=>{
  for(const journey of ['personal','shop','clients'])assert.match(page,new RegExp('data-journey="'+journey+'"'));
});
test('accessibility and tools controls exist',()=>{
 for(const id of ['access-toggle','tools-toggle','larger','contrast','speak','export'])assert.ok(page.includes('id="'+id+'"'));
});
test('inline script parses',()=>{
 const src=page.split('<script>')[1]?.split('</script>')[0];assert.ok(src);new vm.Script(src);
});
test('no live provider calls or payment commands',()=>{
 assert.doesNotMatch(page,/fetch\s*\(|XMLHttpRequest\s*\(|new\s+WebSocket\s*\(/);
 assert.doesNotMatch(page, /api\.stripe\.com/);
});
test('release is accurately marked as unverified',()=>{
 assert.match(page,/NON CERTIFICATO/);
 assert.match(page,/NO-GO LIVE/);
});

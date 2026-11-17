import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const web=read('apps/web/v10-workspace.html');
const mobile=read('apps/mobile/www/v10-workspace.html');
test('unified workspace Web/mobile parity and local link integrity',()=>{
  assert.equal(web,mobile);
  assert.equal(read('apps/web/discovery.html'),read('apps/mobile/www/discovery.html'));
  for(const file of ['apps/web/index.html','apps/mobile/www/index.html']) assert.ok(read(file).includes('href="./discovery.html"'));
  for(const file of ['index.html','discovery.html','europe-immobili.html','pole-position.html','pole-premium.html']){
    assert.ok(web.includes('href="./'+file+'"'),file);
    assert.ok(existsSync(new URL('../apps/web/'+file,import.meta.url)),file);
    assert.ok(existsSync(new URL('../apps/mobile/www/'+file,import.meta.url)),file);
  }
  for(const anchor of ['hospitality-eu','travel-24h','eu-b2b','eu-press']){
    assert.ok(web.includes('href="./index.html#'+anchor+'"'),anchor);
    assert.ok(read('apps/web/index.html').includes('id="'+anchor+'"'),anchor);
    assert.ok(read('apps/mobile/www/index.html').includes('id="'+anchor+'"'),anchor);
  }
});
test('honest release gates and no automatic billing or third-party access',()=>{
  for(const phrase of ['v7.0.0','non è una release v10 certificata','esecuzione provider disabilitata','Nessun addebito automatico']) assert.ok(web.includes(phrase),phrase);
  assert.match(web,/article\[hidden\]\{display:none\}/);
  assert.doesNotMatch(web,/<form|fetch\(|XMLHttpRequest|https:\/\/api\.stripe\.com/i);
  assert.match(web,/role="status"/);
});

test('SEVA Unified Studio portal is mirrored across Web/mobile and has explicit integration gates',()=>{
  const webStudio=read('apps/web/seva-unified-studio.html');
  const mobileStudio=read('apps/mobile/www/seva-unified-studio.html');
  assert.equal(webStudio,mobileStudio);
  assert.ok(web.includes('href="./seva-unified-studio.html"'));
  assert.ok(webStudio.includes('https://www.klaviyo.com/dashboard'));
  assert.ok(webStudio.includes('ChatGPT connector linked'));
  assert.ok(webStudio.includes('disabilitato dall’amministratore'));
  assert.ok(webStudio.includes('No automatic messages, billing, provider calls or agent execution'));
  assert.doesNotMatch(webStudio,/<form|fetch\(|XMLHttpRequest|https:\/\/api\.stripe\.com/i);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const page=read('apps/web/press.html');
const home=read('apps/web/index.html');
const readme=read('README.md');
const release=read('press/ANNOUNCEMENT_EU_2026.md');
const directories=read('press/ASSOCIATION_GATEWAYS_2026.md');
const assets=['apps/web/assets/urban-one-banner-728x90.svg','apps/web/assets/urban-one-press-1200x628.svg'];

test('press kit includes originals and verified-source newsroom links',()=>{
 assert.match(page,/<html lang="en">/);
 assert.match(page,/editorial/i);
 assert.match(page,/ASSOCIATION_GATEWAYS_2026.md/);
 assert.match(page,/press\/ANNOUNCEMENT_EU_2026.md/);
 assert.match(page,/mailto:karimkatlane0@gmail.com/);
 assert.match(home,/href="\.\/press\.html"/);
 assert.match(readme,/press\/README\.md/);
 assert.match(readme,/press\/ANNOUNCEMENT_EU_2026\.md/);
});
test('both banners have image roles, viewports, title and description, with no external script',()=>{
 for(const path of assets){
  const source=read(path);
  assert.match(source,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(source,/<title id="title">/);
  assert.match(source,/<desc id="desc">/);
  assert.match(source,/role="img"/);
  assert.doesNotMatch(source,/<script|<foreignObject|href="http|onload=/i);
 }
 assert.match(read(assets[0]),/width="728" height="90"/);
 assert.match(read(assets[1]),/width="1200" height="628"/);
});
test('five language variants are in factual editorial materials',()=>{
 for(const name of ['Italiano','English','Deutsch','Français','Español']) {
  assert.match(release,new RegExp(name));
 }
 for(const text of ['Booking','Fabrick','InfoCert','Gintitic'])assert.ok(release.includes(text));
});
test('press kit remains consent-first and does not offer unverified checkout',()=>{
 assert.match(page,/No official association partnership/i);
 assert.match(page,/No analytics/);
 assert.doesNotMatch(page,/<script|googletagmanager|stripe\.com\/|buy\.stripe\.com\/|<form[\s>]/i);
 assert.doesNotMatch(page,/IT\d{2}[A-Z]\d{22}|sk_(?:live|test)_|whsec_/i);
 assert.match(directories,/NOT CONTACTED/);
 assert.match(directories,/NOT VERIFIED/);
});

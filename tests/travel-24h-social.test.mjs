import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const page=read('apps/web/travel-preview.html'),home=read('apps/web/index.html'),readme=read('README.md'),press=read('apps/web/press.html'),social=read('press/TRAVEL_24H_SOCIAL_POSTS_2026.md');
test('24-hour public information concept has source-linked voluntary contact',()=>{
 assert.match(page,/Early Access 24h/);
 assert.match(page,/mailto:karimkatlane0@gmail\.com/);
 assert.match(page,/nessuna vendita di voli/i);
 assert.match(page,/opt-in/i);
 assert.match(home,/href="\.\/travel-preview\.html"/);
 assert.match(readme,/apps\/web\/travel-preview\.html/);
 assert.match(press,/href="\.\/travel-preview\.html"/);
});
test('no guest data, third-party marketing tracking, automatic charges or social sends',()=>{
 assert.doesNotMatch(page,/<script|<form[\s>]|buy\.stripe\.com|google-analytics|googletagmanager|fbq\(|<iframe/);
 assert.doesNotMatch(page,/IT\d{2}[A-Z]\d{22}|sk_(?:live|test)_|whsec_/);
 assert.match(social,/NON inviati|NON inviati|NOT SENT|non inviati|NON inviati|NON inviati/i);
 assert.match(social,/Meta/i);
});

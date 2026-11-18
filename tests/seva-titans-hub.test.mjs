import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../apps/web/seva-titans-hub.html',import.meta.url),'utf8');
test('hub exposes contacts, browser and separate identities',()=>{for(const x of ['id="contacts"','id="browser"','id="connections"','karimkatlane0@gmail.com','karimkatlane86@gmail.com'])assert.ok(html.includes(x),x)});
test('import preserves unknown consent and browser accepts HTTP(S) only',()=>{assert.match(html,/consent:'unknown'/);assert.match(html,/\['http:','https:'\]\.includes\(u\.protocol\)/);assert.match(html,/Il consenso resta non verificato/)});
test('contact data is local and no remote submission is implemented',()=>{assert.match(html,/localStorage/);assert.doesNotMatch(html,/fetch\s*\(|XMLHttpRequest|sendBeacon/);assert.match(html,/NO SESSION CAPTURE/)});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const web=await readFile(new URL('../apps/web/titans-enterprise-studio.html',import.meta.url),'utf8');
const mobile=await readFile(new URL('../apps/mobile/www/titans-enterprise-studio.html',import.meta.url),'utf8');
const webCss=await readFile(new URL('../apps/web/titans-executive-theme.css',import.meta.url),'utf8');
const mobileCss=await readFile(new URL('../apps/mobile/www/titans-executive-theme.css',import.meta.url),'utf8');
const webJs=await readFile(new URL('../apps/web/titans-executive-theme.js',import.meta.url),'utf8');
const mobileJs=await readFile(new URL('../apps/mobile/www/titans-executive-theme.js',import.meta.url),'utf8');
test('TITANS Web and Mobile both load the executive bicolor theme',()=>{
 for(const html of [web,mobile]){assert.match(html,/titans-executive-theme\.css/);assert.match(html,/titans-executive-theme\.js/)}
 assert.equal(webCss,mobileCss);assert.equal(webJs,mobileJs);
});
test('light and dark themes have explicit accessible color systems',()=>{
 assert.match(webCss,/html\[data-theme="light"\]/);assert.match(webCss,/color-scheme:light/);assert.match(webCss,/--bg:#f4f2ec/);assert.match(webCss,/--gold:#b88922/);assert.match(webJs,/aria-pressed/);assert.match(webJs,/localStorage\.setItem/);
});
test('theme switch is a real button and mobile layout has dedicated refinements',()=>{
 assert.match(webJs,/createElement\('button'\)/);assert.match(webJs,/addEventListener\('click'/);assert.match(webJs,/Attiva modalità/);assert.match(webJs,/PASSA A CHIARO/);assert.match(webJs,/PASSA A SCURO/);assert.match(webCss,/@media\(max-width:560px\)/);
});

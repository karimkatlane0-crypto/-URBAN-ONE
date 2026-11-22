import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../apps/web/titans-enterprise-studio.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../apps/web/titans-enterprise-studio.css', import.meta.url), 'utf8');
const mobileHtml = await readFile(new URL('../apps/mobile/www/titans-enterprise-studio.html', import.meta.url), 'utf8');

test('TITANS studio exposes the core navigation and product areas', () => {
  for (const id of ['overview', 'intelligence', 'products', 'mlops', 'evidence', 'lifecycle', 'principles']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  for (const name of ['SAI', 'GITA', 'EY', 'UNIVERSAL', 'URBAN ONE', 'SEVA', 'SYNAPSY']) {
    assert.ok(html.includes(name), name + ' must be represented');
  }
});

test('prototype does not misrepresent architecture as live integrations', () => {
  assert.match(html, /DESIGN PREVIEW · LIVE DATA NOT CONNECTED/);
  assert.match(html, /non dichiara agenti live attivi/i);
  assert.match(html, /REFERENCE PIPELINE · NOT LIVE/);
  assert.match(html, /non sono una sincronizzazione live/i);
  assert.match(html, /Human approval required/);
});

test('governance and safety requirements are visible', () => {
  assert.match(html, /BUILD → VERIFY → RELEASE → SCALE/);
  assert.match(html, /Nessun mega-merge, deploy o rilascio automatico/i);
  assert.match(html, /Consenso esplicito/i);
  assert.match(html, /repository, autorizzazioni e release/i);
});

test('responsive, reduced-motion and keyboard accessibility rules exist', () => {
  assert.match(html, /class="skip-link"/);
  assert.match(html, /aria-label="Navigazione TITANS"/);
  assert.match(css, /@media\(max-width:820px\)/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /:focus-visible/);
});

test('product search and navigation controls are wired', () => {
  assert.match(html, /id="product-search"/);
  assert.match(html, /addEventListener\('input'/);
  assert.match(html, /aria-current/);
});

test('desktop and mobile workspace links point to distinct reciprocal destinations', () => {
  assert.match(html, /href="\.\.\/mobile\/www\/titans-enterprise-studio\.html"[\s\S]*?TITANS MOBILE/);
  assert.match(mobileHtml, /href="\.\.\/\.\.\/web\/titans-enterprise-studio\.html"[\s\S]*?TITANS WEB/);
});

test('product search is explicitly described as a local filter, not AI search', () => {
  assert.match(html, /Filtra prodotti localmente; non è una ricerca AI/);
});

test('evidence snapshot is explicitly marked stale and non-live', () => {
  assert.match(html, /Fotografia di governance al 19\/11\/2026: non sincronizzata live/);
});

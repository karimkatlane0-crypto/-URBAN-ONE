import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const selectorSource = readFileSync(new URL('../apps/web/eu-language-selector.js', import.meta.url), 'utf8');
const pages = [
  '../apps/web/discovery.html',
  '../apps/web/seva-crm-studio.html',
  '../apps/web/seva-unified-studio.html'
];

function boot({ languages = ['it-IT'], stored = null, storageThrows = false } = {}) {
  const listeners = {};
  const emitted = [];
  const header = { children: [], append(...items) { this.children.push(...items); } };
  const document = {
    documentElement: { lang: 'it' },
    head: { append() {} },
    querySelector(selector) { return selector === 'header' ? header : null; },
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(), children: [], attributes: {}, style: {},
        append(...items) { this.children.push(...items); },
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener(name, callback) { listeners[name] = callback; }
      };
    },
    dispatchEvent(event) { emitted.push(event); }
  };
  let selectElement;
  const originalCreate = document.createElement.bind(document);
  document.createElement = tag => {
    const element = originalCreate(tag);
    if (tag === 'select') selectElement = element;
    return element;
  };
  const localStorage = {
    getItem() { if (storageThrows) throw new Error('storage disabled'); return stored; },
    setItem(key, value) { if (storageThrows) throw new Error('storage disabled'); stored = value; }
  };
  const context = {
    document, navigator: { languages, language: languages[0] || 'it' },
    localStorage, window: {}, Set, String, Date, Intl,
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } }
  };
  vm.runInNewContext(selectorSource, context, { timeout: 1000 });
  const wrap = header.children[0];
  const select = wrap.children[1];
  const status = wrap.children[2];
  return { context, select: selectElement, status, wrap, listeners, emitted, get stored() { return stored; } };
}

test('selector exposes exactly the 24 official EU language codes with native labels', () => {
  const app = boot();
  const languages = app.context.window.TITANS_LOCALE.languages;
  assert.equal(languages.length, 24);
  assert.equal(new Set(languages.map(item => item.code)).size, 24);
  for (const code of ['bg','hr','cs','da','nl','en','et','fi','fr','de','el','hu','ga','it','lv','lt','mt','pl','pt','ro','sk','sl','es','sv']) {
    assert.ok(languages.some(item => item.code === code), `missing ${code}`);
  }
  assert.ok(languages.every(item => item.flag && item.name));
});

test('browser locale detection selects a supported base language', () => {
  const app = boot({ languages: ['fr-CA', 'de-DE'] });
  assert.equal(app.context.document.documentElement.lang, 'fr');
  assert.equal(app.select.value, 'fr');
});

test('stored supported locale overrides browser preference', () => {
  const app = boot({ languages: ['fr-FR'], stored: 'de' });
  assert.equal(app.context.document.documentElement.lang, 'de');
  assert.equal(app.select.value, 'de');
});

test('unsupported stored locale is ignored and defaults to supported browser locale', () => {
  const app = boot({ languages: ['es-ES'], stored: 'xx' });
  assert.equal(app.context.document.documentElement.lang, 'es');
});

test('manual selection updates document language, persists and emits locale event', () => {
  const app = boot({ languages: ['it-IT'] });
  app.select.value = 'pl';
  app.listeners.change();
  assert.equal(app.context.document.documentElement.lang, 'pl');
  assert.equal(app.stored, 'pl');
  assert.equal(app.emitted.at(-1).type, 'titans:localechange');
  assert.equal(app.emitted.at(-1).detail.locale, 'pl');
});

test('storage-disabled mode still initializes and accepts a session selection', () => {
  const app = boot({ languages: ['nl-NL'], storageThrows: true });
  assert.equal(app.context.document.documentElement.lang, 'nl');
  app.select.value = 'sv';
  assert.doesNotThrow(() => app.listeners.change());
  assert.equal(app.context.document.documentElement.lang, 'sv');
});

test('locale-aware date and number formatters use the active locale', () => {
  const app = boot({ languages: ['it-IT'] });
  assert.equal(typeof app.context.window.TITANS_LOCALE.formatDate(new Date('2026-01-02')), 'string');
  assert.equal(typeof app.context.window.TITANS_LOCALE.formatNumber(1234.5), 'string');
  app.select.value = 'de';
  app.listeners.change();
  assert.equal(app.context.window.TITANS_LOCALE.current, 'de');
});

test('all three target pages load the shared selector and provide a header mount point', () => {
  for (const path of pages) {
    const html = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(html, /<header\b/i, `${path}: missing header`);
    assert.match(html, /eu-language-selector\.js/, `${path}: missing shared selector script`);
  }
});

test('selector source contains no network, tracking, cookie or third-party translation calls', () => {
  for (const forbidden of [/\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /document\.cookie/, /gtag\s*\(/, /googletagmanager/, /translate\.googleapis\.com/]) {
    assert.doesNotMatch(selectorSource, forbidden);
  }
});

test('selector exposes an accessible label and live status announcement', () => {
  const app = boot();
  assert.equal(app.select.attributes['aria-label'], 'Select interface language');
  assert.equal(app.status.attributes.role, 'status');
  assert.equal(app.status.attributes['aria-live'], 'polite');
  assert.equal(app.wrap.children[0].tagName, 'LABEL');
  assert.equal(app.wrap.children[1].tagName, 'SELECT');
});


test('initialization announces the selected locale and keeps a stable control id', () => {
  const app = boot({ languages: ['en-IE'] });
  assert.equal(app.select.id, 'titans-locale-select');
  assert.equal(app.context.document.documentElement.lang, 'en');
  assert.match(app.status.textContent, /locale/i);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const pages = [
  'apps/web/titans-enterprise-studio.html',
  'apps/mobile/www/titans-enterprise-studio.html'
];
const styles = [
  'apps/web/titans-enterprise-studio.css',
  'apps/mobile/www/titans-enterprise-studio.css'
];

for (const page of pages) {
  test(page + ' exposes navigation, products and live evidence controls', async () => {
    const html = await readFile(new URL('../' + page, import.meta.url), 'utf8');
    for (const id of ['overview', 'intelligence', 'products', 'mlops', 'evidence', 'lifecycle', 'principles', 'live-operations', 'live-sync-state', 'live-repo-state', 'live-ci-state', 'live-pr-count', 'live-commit-sha', 'refresh-evidence']) {
      assert.match(html, new RegExp('id="' + id + '"'), 'missing ' + id);
    }
    for (const name of ['SAI', 'GITA', 'EY', 'UNIVERSAL', 'URBAN ONE', 'SEVA', 'SYNAPSY', 'HubSpot CRM', 'Microsoft Power BI', 'Stripe · Payments', 'Amazon Associates / Awin']) {
      assert.ok(html.includes(name), name + ' must be represented');
    }
    assert.match(html, /api\.github\.com\/repos\/karimkatlane0-crypto\/\-URBAN-ONE/);
    assert.match(html, /GITHUB API LIVE · READ ONLY/);
    assert.match(html, /cache:\s*'no-store'/);
    assert.match(html, /non dichiara agenti live attivi/i);
    assert.match(html, /REFERENCE PIPELINE · NOT LIVE/);
    assert.match(html, /non sono una sincronizzazione live/i);
    assert.match(html, /Human approval required/);
    assert.match(html, /BUILD → VERIFY → RELEASE → SCALE/);
    assert.match(html, /Nessun mega-merge, deploy o rilascio automatico/i);
    assert.match(html, /Consenso esplicito/i);
    assert.match(html, /class="skip-link"/);
    assert.match(html, /aria-label="Navigazione TITANS"/);
    assert.match(html, /id="product-search"/);
    assert.match(html, /addEventListener\('input'/);
    assert.match(html, /aria-current/);
    assert.doesNotMatch(html, /(?:ghp_[A-Za-z0-9]{20,}|sk_live_[A-Za-z0-9]{12,}|Bearer\s+[A-Za-z0-9._-]{20,})/);
    const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
    assert.ok(scripts.length > 0, 'expected inline script');
    for (const script of scripts) new vm.Script(script[1], { filename: page });
  });
}

for (const style of styles) {
  test(style + ' preserves responsive, reduced-motion and live panel styles', async () => {
    const css = await readFile(new URL('../' + style, import.meta.url), 'utf8');
    assert.match(css, /@media\(max-width:820px\)/);
    assert.match(css, /@media\(max-width:560px\)/);
    assert.match(css, /prefers-reduced-motion:reduce/);
    assert.match(css, /:focus-visible/);
    assert.match(css, /\.connector-grid/);
    assert.match(css, /\.live-metrics/);
  });
}

test('web and mobile share the same live operations workspace', async () => {
  const [web, mobile] = await Promise.all(pages.map(page => readFile(new URL('../' + page, import.meta.url), 'utf8')));
  const extract = html => html.match(/<section id="live-operations"[\s\S]*?<\/section>/)?.[0];
  assert.ok(extract(web));
  assert.equal(extract(web), extract(mobile));
});

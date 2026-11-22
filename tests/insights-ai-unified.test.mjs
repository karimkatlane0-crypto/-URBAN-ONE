import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const web = read('apps/web/insights-ai.html');
const mobile = read('apps/mobile/www/insights-ai.html');
const legacy = read('apps/web/insights-free.html');
const hub = read('apps/web/super-ai.html');

test('INSIGHTS.ai unifies the full product intelligence scope', () => {
  for (const term of ['INSIDERS','SEVA CRM','Marketing &amp; Acquisition','Commerce &amp; Payments','Marketplace, Affiliate &amp; Creators','UNIVERSAL 36','TITANS','GITA.IA','KKUBERA','Maps Europa','ChatGPT','OpenAI','Codex','Archivi']) {
    assert.ok(web.includes(term), term);
  }
});
test('INSIGHTS.ai exposes source trust and current integration boundaries', () => {
  for (const term of ['HubSpot','Supermetrics','Power BI','Stripe','NOT VERIFIED','READ-ONLY','ACCESS NOT VERIFIED','tenant','lineage']) assert.ok(web.includes(term), term);
  assert.match(web, /nessuna query dati o attivazione audience eseguita/i);
  assert.match(web, /scrittura non autorizzata/i);
});
test('all commercial service access is paid and price-gated', () => {
  assert.match(web, /Nessun piano gratuito, prova gratuita o attivazione gratuita/i);
  assert.match(web, /prezzo approvato/i);
  assert.match(legacy, /servizio unificato a pagamento/i);
});
test('Web and Mobile share the same intelligence contract', () => {
  for (const term of ['Executive scorecard','Metric governance','Source registry','Data freshness','Power BI','ChatGPT','Codex']) {
    assert.ok(web.includes(term), term);
    assert.ok(mobile.includes(term), 'mobile: ' + term);
  }
});
test('SUPER.AI links directly to the unified INSIGHTS.ai workspace', () => {
  assert.match(hub, /href="\.\/insights-ai\.html"/);
  assert.match(hub, /INSIGHTS\.ai · Unified Intelligence/);
});

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

test('mobile TITANS offer matches the approved 30-day manual-renewal contract',()=>{
 assert.match(mobile,/€10 per utente per 30 giorni/);
 assert.match(mobile,/bonifico manuale per ciascun periodo/);
 assert.match(mobile,/causale esatta REEDEEM/);
 assert.doesNotMatch(mobile,/accesso lifetime|pagamento unico/i);
 assert.ok(mobile.includes('https://github.com/karimkatlane0-crypto/-URBAN-ONE/blob/main-%40URBAN-ONE/docs/TITANS-GO-ENTERPRISE-GLOBAL.md'));

});

test('mobile INSIGHTS uses only packaged mobile routes for primary navigation', () => {
  assert.doesNotMatch(mobile, /\.\.\/\.\.\/apps\/web/);
  for (const href of ['./super-ai.html','./super-ai-settings.html#integrations','./seva-crm-studio.html','./seva-unified-studio.html','./discovery.html']) {
    assert.ok(mobile.includes(href), href);
  }
});
test('browser and PostgreSQL workflows cover the pages and resolver they verify',()=>{
 const browser=read('.github/workflows/public-portals-browser.yml');
 const postgres=read('.github/workflows/super-ai-postgres-integration.yml');
 const browserPr=browser.split('pull_request:')[1]||'';
 assert.ok(browserPr.includes("apps/web/insights-ai.html"));
 assert.equal(browser.split("apps/web/insights-ai.html").length-1,2);
 assert.equal(postgres.split("services/api/postgres-membership-resolver.mjs").length-1,2);
 const smoke=read('scripts/public-portals-browser-smoke.mjs');
 assert.ok(smoke.includes('target.root') && smoke.includes('safeName'));
});

test('settings centers expose INSIGHTS.ai as a service', () => {
  for (const path of ['apps/web/super-ai-settings.html','apps/mobile/www/super-ai-settings.html']) {
    assert.match(read(path), /INSIGHTS\.ai · Financial Intelligence/);
    assert.match(read(path), /href="\.\/insights-ai\.html"/);
  }
});

test('TITANS GO ENTERPRISE GLOBAL price and SEVA contracted checkout rules are explicit',()=>{
 const contract=read('docs/TITANS-GO-ENTERPRISE-GLOBAL.md');
 for(const term of ['€10 per user for 30 days','manual bank transfer per 30-day period','no subscription','manual renewal only','`REEDEEM`','€50 or €500','quote/contract reference','€29/month']) assert.ok(contract.includes(term),term);
 assert.match(contract,/no real charge/i);
});
test('file access and direct marketing require source ACL and lawful-basis controls',()=>{
 const contract=read('docs/TITANS-GO-ENTERPRISE-GLOBAL.md');
 for(const term of ['Library files','ACL','tenant','lawful basis','consent','suppression','opt-out','campaign approval']) assert.ok(contract.toLowerCase().includes(term.toLowerCase()),term);
 assert.match(contract,/Do not send campaigns/i);
 assert.match(web,/FILE ACCESS &amp; DIRECT MARKETING/);
 assert.match(mobile,/FILE ACCESS &amp; DIRECT MARKETING/);
});

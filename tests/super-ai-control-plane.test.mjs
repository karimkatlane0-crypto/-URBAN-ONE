import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const webHub = await readFile(new URL('../apps/web/super-ai.html', import.meta.url), 'utf8');
const webSettings = await readFile(new URL('../apps/web/super-ai-settings.html', import.meta.url), 'utf8');
const mobileHub = await readFile(new URL('../apps/mobile/www/super-ai.html', import.meta.url), 'utf8');
const mobileSettings = await readFile(new URL('../apps/mobile/www/super-ai-settings.html', import.meta.url), 'utf8');

test('SUPER.AI control plane exposes every named product', () => {
  for (const name of ['UNIVERSAL 36','TITANS Enterprise Studio','INSIDERS','GITA.IA','SEVA Unified Studio','SEVA CRM','SYNAPSY','KKUBERA','URBAN ONE Workspace','Maps Europa','SEVA pubblico']) {
    assert.ok(webHub.includes(name), name);
  }
});

test('settings center explicitly lists account, organization, security, privacy, notifications and billing', () => {
  for (const term of ['Account e profilo','Organizzazione e workspace','Sicurezza e privacy','Notifiche e automazioni','Abbonamento, fatturazione e utilizzo','Integrazioni e connessioni','Catalogo servizi SUPER.AI']) {
    assert.ok(webSettings.includes(term), term);
    assert.ok(mobileSettings.includes(term), 'mobile: '+term);
  }
});

test('service catalog names the actual platform capabilities', () => {
  for (const term of ['AI Studio e agenti','CRM e Customer Operations','Financial Insights','Commerce e pagamenti','Marketplace e affiliate','Data &amp; BI connectors','PaaS Instance Manager','Maps &amp; European Data','Supporto e onboarding']) {
    assert.ok(webSettings.includes(term), term);
  }
});

test('mobile hub exposes product access and does not claim unsupported routes are live', () => {
  for (const name of ['UNIVERSAL 36','TITANS Enterprise Studio','INSIDERS','GITA.IA','SEVA Unified Studio','SEVA CRM','SYNAPSY','KKUBERA','URBAN ONE Workspace','Maps Europa','SEVA pubblico','Impostazioni e servizi']) {
    assert.ok(mobileHub.includes(name), name);
  }
  assert.ok(mobileHub.includes('href="./maps-europe.html"'));
  assert.ok(mobileHub.includes('href="./synapsy.html"'));
});

test('settings pages explicitly disclose that unconnected settings are not persisted', () => {
  assert.match(webSettings, /Nessuna impostazione è stata salvata/i);
  assert.match(mobileSettings, /non vengono salvate senza backend autenticato/i);
});

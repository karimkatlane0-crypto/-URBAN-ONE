import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('TITANS exposes customer experience and SEVA CRM entry points on Web and Mobile', async () => {
  const [web, mobile] = await Promise.all([
    read('../apps/web/titans-enterprise-studio.html'),
    read('../apps/mobile/www/titans-enterprise-studio.html'),
  ]);
  for (const html of [web, mobile]) {
    assert.match(html, /id="customer-experience"/);
    assert.match(html, /href="#customer-experience"/);
    assert.match(html, /href="\.\/seva-crm-studio\.html#overview"/);
    assert.match(html, /One customer journey\. Governed at every step\./);
    assert.match(html, /TITANS PARTNER \/ SEVA ENTERPRISE ONBOARDING/);
    assert.match(html, /INSIDERS FINANCE CONTROL/);
    assert.match(html, /TITANS SOVEREIGN EXECUTIVE CONTROL/);
  }
  const extract = (html) => html.match(/<section id="customer-experience"[\s\S]*?<\/section>/)?.[0] ?? null;
  assert.ok(extract(web), 'Web customer experience section exists');
  assert.equal(extract(web), extract(mobile), 'Web and Mobile customer experience content stays identical');
});

test('SEVA CRM entry points resolve to real, named customer lifecycle sections', async () => {
  const [crmWeb, crmMobile] = await Promise.all([
    read('../apps/web/seva-crm-studio.html'),
    read('../apps/mobile/www/seva-crm-studio.html'),
  ]);
  assert.equal(crmWeb, crmMobile, 'CRM Web and Mobile source must remain in parity');
  for (const id of ['overview', 'contacts', 'audiences', 'journeys', 'campaigns', 'analytics', 'integrations', 'governance']) {
    assert.match(crmWeb, new RegExp('id="' + id + '"'));
  }
  assert.match(crmWeb, /href="\.\/customer-experience\.css"/);
  assert.match(crmWeb, /ULTIMO SNAPSHOT DISPONIBILE · STORICO/);
  assert.match(crmWeb, /nessuna sincronizzazione automatica attiva/i);
  assert.doesNotMatch(crmWeb, /SNAPSHOT VERIFICATO/);
});

test('SEVA CRM visual skin is identical across Web and Mobile', async () => {
  const [webCss, mobileCss] = await Promise.all([
    read('../apps/web/customer-experience.css'),
    read('../apps/mobile/www/customer-experience.css'),
  ]);
  assert.equal(webCss, mobileCss);
  for (const token of ['--crm-bg:#10161d', '--crm-gold:#e7c77e', '.statusbar', '.kpi,.panel', '.safe']) {
    assert.ok(webCss.includes(token), token + ' is part of the shared design system');
  }
});

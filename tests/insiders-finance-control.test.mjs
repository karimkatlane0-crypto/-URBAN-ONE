import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const web = await readFile(new URL('../apps/web/insiders-finance-control.html', import.meta.url), 'utf8');
const mobile = await readFile(new URL('../apps/mobile/www/insiders-finance-control.html', import.meta.url), 'utf8');
const studioWeb = await readFile(new URL('../apps/web/titans-enterprise-studio.html', import.meta.url), 'utf8');
const studioMobile = await readFile(new URL('../apps/mobile/www/titans-enterprise-studio.html', import.meta.url), 'utf8');

test('INSIDERS Finance Control is present and consistent on Web and Mobile', () => {
  assert.equal(web, mobile);
  assert.match(studioWeb, /INSIDERS Finance Control/);
  assert.match(studioMobile, /INSIDERS Finance Control/);
  assert.match(studioWeb, /\.\/insiders-finance-control\.html/);
  assert.match(studioMobile, /\.\/insiders-finance-control\.html/);
});

test('Finance Control reports the verified Stripe Live snapshot without inventing payments', () => {
  for (const html of [web, mobile]) {
    assert.match(html, /charges_enabled = true/);
    assert.match(html, /payouts_enabled = true/);
    assert.match(html, /13/);
    assert.match(html, /9/);
    assert.match(html, /0 \/ 0/);
    assert.match(html, /€5,00/);
    assert.match(html, /zero charge e zero subscription/);
    assert.match(html, /READ ONLY/);
  }
});

test('REEDEEM is excluded from all checkout destinations', () => {
  for (const html of [web, mobile]) {
    assert.doesNotMatch(html, /href=["'][^"']*REEDEEM/i);
    assert.match(html, /REEDEEM escluso/);
  }
});

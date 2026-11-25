import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFile(path.join(root, p), 'utf8');

test('web and mobile command centers start on an existing home page', async () => {
  const web = await read('apps/web/universal-command-center.html');
  const mobile = await read('apps/mobile/www/universal-command-center.html');
  assert.match(web, /iframe[^>]+src="\.\/universal-36\.html"/);
  assert.match(mobile, /iframe[^>]+src="\.\/index\.html"/);
});

test('all command-center navigation targets exist in each package', async () => {
  for (const [shellPath, base] of [
    ['apps/web/universal-command-center.html', 'apps/web'],
    ['apps/mobile/www/universal-command-center.html', 'apps/mobile/www']
  ]) {
    const html = await read(shellPath);
    const targets = [...html.matchAll(/data-src="([^"]+)"/g)].map(m => m[1]);
    assert.ok(targets.length >= 8, shellPath + ' should expose all modules');
    for (const target of targets) await access(path.join(root, base, target.replace(/^\.\//, '')));
  }
});

test('screen diagnostics and single-workspace navigation are wired', async () => {
  for (const p of ['apps/web/universal-command-center.html', 'apps/mobile/www/universal-command-center.html']) {
    const html = await read(p);
    assert.match(html, /screen-info/);
    assert.match(html, /devicePixelRatio/);
    assert.match(html, /const screenInfo=window\.screen\|\|\{\}/);
    assert.doesNotMatch(html, /window\.screen\?\./);
    assert.match(html, /orientationchange/);
    assert.match(html, /addEventListener\('resize'/);
    assert.match(html, /module-frame/);
    assert.match(html, /ucc:last-module/);
  }
});

test('mobile Advanced Insights contains the real local dashboard route', async () => {
  const html = await read('apps/mobile/www/insights-free.html');
  assert.match(html, /financial-dashboard\.html/);
  await access(path.join(root, 'apps/mobile/www/financial-dashboard.html'));
});

test('Advanced Insights connects executive governance and free KPI scenarios on web and mobile', async () => {
  for (const p of ['apps/web/insights-free.html', 'apps/mobile/www/insights-free.html']) {
    const html = await read(p);
    assert.match(html, /seva-advanced-insights-executive\.html/);
  }
  for (const [htmlPath, cssPath] of [
    ['apps/web/seva-advanced-insights-executive.html', 'apps/web/seva-executive-premium.css'],
    ['apps/mobile/www/seva-advanced-insights-executive.html', 'apps/mobile/www/seva-executive-premium.css']
  ]) {
    const executive = await read(htmlPath);
    assert.match(executive, /insights-free\.html/);
    assert.match(executive, /PREVIEW VISIVA · DATI LIVE NON COLLEGATI/);
    await access(path.join(root, cssPath));
  }
});

test('web command center compares the iframe current URL and is discoverable from the deployed root', async () => {
  const shell = await read('apps/web/universal-command-center.html');
  const homepage = await read('apps/web/index.html');
  assert.match(shell, /frame\.contentWindow\.location\.href/);
  assert.doesNotMatch(shell, /new URL\(frame\.src,location\.href\)/);
  assert.match(homepage, /href="\.\/universal-command-center\.html"/);
});

test('web and mobile home pages link to the command center', async () => {
  const web = await read('apps/web/universal-36.html');
  const mobile = await read('apps/mobile/www/index.html');
  assert.match(web, /universal-command-center\.html/);
  assert.match(mobile, /universal-command-center\.html/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const pages = [
  'apps/web/universal-36.html',
  'apps/web/index.html',
  'apps/web/seva-unified-studio.html',
  'apps/web/seva-titans-hub.html',
  'apps/web/seva-crm-studio.html',
  'apps/web/synapsy.html',
  'apps/web/discovery.html',
  'apps/web/v10-workspace.html',
  'apps/web/insights-free.html',
  'apps/web/titans-enterprise-studio.html',
  'apps/web/financial-insights.html',
  'apps/web/maps-europe.html'
];

test('Universal Instance Manager is linked from every supported workspace', () => {
  for (const path of pages) {
    const html = readFileSync(path, 'utf8');
    assert.match(html, /href=["']\.\/instance-manager\.html["']/i, path);
    assert.match(html, /universal-instance-entry/, path);
  }
  assert.ok(existsSync('apps/web/instance-manager.html'));
  assert.ok(existsSync('apps/web/instance-manager.css'));
  assert.ok(existsSync('apps/web/instance-manager.js'));
});

test('Universal Instance Manager browser module passes Node syntax validation', () => {
  const result = spawnSync(process.execPath, ['--check', 'apps/web/instance-manager.js'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('static manager page clearly describes backend gating and does not claim cloud provisioning', () => {
  const html = readFileSync('apps/web/instance-manager.html', 'utf8');
  const js = readFileSync('apps/web/instance-manager.js', 'utf8');
  assert.match(html, /i comandi restano disabilitati/i);
  assert.match(js, /API non installata su questo dominio Vercel/i);
  assert.match(js, /cloudResources!==false/);
});

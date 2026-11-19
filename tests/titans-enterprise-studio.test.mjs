import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../apps/web/titans-enterprise-studio.html', import.meta.url), 'utf8');
const mobileHtml = await readFile(new URL('../apps/mobile/www/titans-enterprise-studio.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../apps/web/titans-enterprise-studio.css', import.meta.url), 'utf8');
const sharedTheme = await readFile(new URL('../apps/web/executive-system.css', import.meta.url), 'utf8');
const mobileSharedTheme = await readFile(new URL('../apps/mobile/www/executive-system.css', import.meta.url), 'utf8');

test('TITANS studio exposes the core navigation and product areas', () => {
  for (const id of ['overview', 'intelligence', 'products', 'mlops', 'evidence', 'lifecycle', 'principles']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  for (const name of ['SAI', 'GITA', 'EY', 'UNIVERSAL', 'URBAN ONE', 'SEVA', 'SYNAPSY']) {
    assert.ok(html.includes(name), name + ' must be represented');
  }
});

test('prototype does not misrepresent architecture as live integrations', () => {
  assert.match(html, /GITHUB READ-ONLY · LIVE CHECK/);
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

test('product cards do not point to missing preview routes', () => {
  assert.doesNotMatch(html, /href="\.\/(?:v10-workspace|seva-unified-studio)\.html"/);
  assert.equal((html.match(/Consulta stato e prove/g) || []).length, 0);
});

test('small-screen navigation reflows instead of consuming a permanent sidebar column', () => {
  assert.match(css, /@media\(max-width:560px\)\{\.sidebar\{position:sticky/);
  assert.match(css, /\.main-content\{margin-left:0\}/);
});

test('GitHub public read-only integration renders live PR and Android CI signals with safe fallbacks', () => {
  assert.match(html, /id="services"/);
  assert.match(html, /https:\/\/api\.github\.com\/repos\//);
  assert.match(html, /pulls\/208/);
  assert.match(html, /actions\/runs\?branch=feat%2Ftitans-live-github-observability-2026-11-19/);
  assert.match(html, /NOT VERIFIED/);
  assert.match(html, /cache: 'no-store'/);
  assert.match(html, /No credentials, writes, or release actions/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
});

test('preview links use the stable branch preview alias for web and mobile', () => {
  const preview = 'https://titans-enterprise-studio-git-feat-tit-1f647a-karimkatlane0-7632.vercel.app';
  assert.ok(html.includes(preview + '/apps/web/titans-enterprise-studio.html'));
  assert.ok(html.includes(preview + '/apps/mobile/www/titans-enterprise-studio.html'));
  assert.ok(mobileHtml.includes(preview + '/apps/web/titans-enterprise-studio.html'));
  assert.ok(mobileHtml.includes(preview + '/apps/mobile/www/titans-enterprise-studio.html'));
  assert.doesNotMatch(html + mobileHtml, /titans-enterprise-studio-k0bdeayr5/);
});

test('URBAN ONE and SEVA product cards link to verified preview workspaces while SYNAPSY remains evidence-gated', () => {
  const preview = 'https://titans-enterprise-studio-git-feat-tit-1f647a-karimkatlane0-7632.vercel.app';
  assert.ok(html.includes(preview + '/apps/web/v10-workspace.html'));
  assert.ok(html.includes(preview + '/apps/web/seva-unified-studio.html'));
  assert.match(html, /P0 BLOCKED · WEBHOOK PROOF/);
});

test('GITA, Copilot and GitHub are represented with truthful integration boundaries', () => {
  for (const label of ['GITA.IA', 'Copilot.IA', 'GitHub.IA']) assert.ok(html.includes(label), label + ' must be visible');
  assert.match(html, /NOT CONNECTED/);
  assert.match(html, /NOT VERIFIED/);
  assert.match(html, /READ ONLY/);
  assert.match(mobileHtml, /GITA.IA/);
  assert.match(mobileHtml, /Copilot.IA/);
  assert.match(mobileHtml, /GitHub.IA/);
});

test('shared pages use the TITANS graphite and champagne-gold design system on web and mobile', () => {
  assert.match(sharedTheme, /--exec-bg:#10161d/);
  assert.match(sharedTheme, /--exec-gold:#e7c77e/);
  assert.match(sharedTheme, /prefers-reduced-motion:reduce/);
  assert.equal(mobileSharedTheme, sharedTheme);
});

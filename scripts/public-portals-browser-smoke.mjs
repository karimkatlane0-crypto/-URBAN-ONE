import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.PUBLIC_PORTAL_BASE_URL || 'https://karimkatlane0-crypto.github.io/-URBAN-ONE/apps/web';
const targets = [
  { name: 'Discovery', file: 'discovery.html', title: /soggiorni e immobili/i },
  { name: 'SEVA CRM Studio', file: 'seva-crm-studio.html', title: /customer intelligence studio/i },
  { name: 'SEVA Unified Studio', file: 'seva-unified-studio.html', title: /unified saas portal/i },
  { name: 'Universal 36', file: 'universal-36.html', title: /UNIVERSAL 36/i, localeSelector: false, verifyUniversalLinks: true },
  { name: 'TITANS Enterprise Studio', file: 'titans-enterprise-studio.html', title: /TITANS.*Enterprise Intelligence Studio/i, localeSelector: false },
  { name: 'TITANS Mobile Workspace', file: 'titans-enterprise-studio-mobile.html', title: /TITANS.*Enterprise Intelligence Studio/i, localeSelector: false },
  { name: 'TITANS Partner and SEVA Enterprise Onboarding', file: 'seva-titans-onboarding.html', title: /Sovereign Onboarding/i, localeSelector: false },
  { name: 'INSIDERS Finance Control Scenario', file: 'financial-insights.html', title: /Financial Insights AI/i, localeSelector: false },
  { name: 'INSIGHTS.ai Unified', file: 'insights-ai.html', title: /INSIGHTS.ai.*Unified Intelligence/i, localeSelector: false },
  { name: 'INSIGHTS legacy route', file: 'insights-free.html', title: /INSIGHTS.ai.*Unified Intelligence/i, localeSelector: false },
  { name: 'Europe Maps', file: 'maps-europe.html', title: /GMAPS Europa/i, localeSelector: false },
  { name: 'SYNAPSY', file: 'synapsy.html', title: /SYNAPSY/i, localeSelector: false },
  { name: 'URBAN ONE Universal', file: 'v10-workspace.html', title: /URBAN ONE Universal/i, localeSelector: false },
  { name: 'Financial Scenario Calculator', file: 'financial-dashboard.html', title: /Financial Scenario Calculator/i, localeSelector: false },
  { name: 'Universal Instance Manager', file: 'instance-manager.html', title: /Universal Instance Manager/i, localeSelector: false, verifyInstanceManager: true }
];
const outDir = 'release/browser-proof';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const target of targets) {
    const url = new URL(target.file, base.endsWith('/') ? base : base + '/').href;
    const result = { name: target.name, url, status: 'FAIL' };
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      result.httpStatus = response?.status() ?? null;
      if (!response || !response.ok()) throw new Error('HTTP response not successful: ' + result.httpStatus);

      result.title = await page.title();
      if (!target.title.test(result.title)) throw new Error('Unexpected page title: ' + result.title);

      if (target.verifyInstanceManager) {
        await page.waitForFunction(() => document.querySelector('#connection')?.textContent !== 'Verifica backend…', null, { timeout: 10000 }).catch(() => {});
        result.backendGate = await page.locator('#connection').textContent();
        if (!/API non installata|autenticazione SEVA richiesta|Backend non raggiungibile/i.test(result.backendGate || '')) throw new Error('Instance Manager must fail closed when its API is absent');
        const createButtons = await page.locator('#catalog button').count();
        if (createButtons !== 0) throw new Error('Instance creation must remain disabled without a verified API');
        result.failClosed = true;
      }

      if (target.localeSelector !== false) {
        await page.waitForSelector('#titans-locale-select', { timeout: 15000 });
        result.languageOptions = await page.locator('#titans-locale-select option').count();
        if (result.languageOptions !== 24) throw new Error('Expected 24 language options; found ' + result.languageOptions);
        await page.selectOption('#titans-locale-select', 'de');
        result.localeChange = await page.locator('html').getAttribute('lang');
        if (result.localeChange !== 'de') throw new Error('Locale selector did not update document lang');
      } else {
        result.localeChange = 'not-applicable';
        if (target.verifyUniversalLinks) {
          result.moduleCards = await page.locator('.card').count();
          if (result.moduleCards < 8) throw new Error('Universal 36 module cards missing');
          const hrefs = await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
          for (const required of ['./titans-enterprise-studio.html','./seva-unified-studio.html','./discovery.html','./v10-workspace.html','./insights-free.html','./maps-europe.html']) {
            if (!hrefs.includes(required)) throw new Error('Universal 36 missing module link: ' + required);
          }
          result.moduleLinksVerified = true;
        }
      }

      await page.locator('body').click({ position: { x: 1, y: 1 } });
      await page.keyboard.press('Tab');
      result.keyboardFocus = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) return null;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName,
          id: element.id || null,
          visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
        };
      });
      if (!result.keyboardFocus?.visible) throw new Error('Keyboard Tab did not reach a visible focus target');

      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      result.accessibility = {
        violations: accessibility.violations.map((item) => ({
          id: item.id, impact: item.impact, description: item.help,
          helpUrl: item.helpUrl,
          affectedNodes: item.nodes.length,
          nodes: item.nodes.map((node) => ({
            target: node.target,
            failureSummary: node.failureSummary,
            html: node.html,
          })),
        })),
        passes: accessibility.passes.length,
      };
      if (accessibility.violations.length) {
        throw new Error('WCAG automated violations: ' + accessibility.violations.map((item) => item.id).join(', '));
      }

      await page.setViewportSize({ width: 390, height: 844 });
      result.mobileViewport = '390x844';
      result.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      if (result.horizontalOverflow) throw new Error(target.name + ' horizontal overflow at mobile viewport');
      result.pageErrors = pageErrors;
      if (pageErrors.length) throw new Error('Browser page errors: ' + pageErrors.join('; '));

      const safeName = target.file.replace(/\.html$/, '');
      await page.screenshot({ path: path.join(outDir, safeName + '.png'), fullPage: true });
      result.screenshot = safeName + '.png';
      result.status = 'PASS';
    } catch (error) {
      result.error = error.message;
      result.pageErrors = pageErrors;
    } finally {
      await context.close();
      results.push(result);
    }
  }
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  sourceCommit: process.env.GITHUB_SHA || 'UNPINNED',
  publicBaseUrl: base,
  browser: 'Playwright Chromium',
  results,
  passed: results.filter(item => item.status === 'PASS').length,
  failed: results.filter(item => item.status !== 'PASS').length
};
fs.writeFileSync(path.join(outDir, 'portal-browser-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.failed) process.exitCode = 1;

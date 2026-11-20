import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.PUBLIC_PORTAL_BASE_URL || 'https://karimkatlane0-crypto.github.io/-URBAN-ONE/apps/web';
const targets = [
  { name: 'Discovery', file: 'discovery.html', title: /soggiorni e immobili/i },
  { name: 'SEVA CRM Studio', file: 'seva-crm-studio.html', title: /customer intelligence studio/i },
  { name: 'SEVA Unified Studio', file: 'seva-unified-studio.html', title: /unified saas portal/i }
];
const outDir = 'release/browser-proof';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const target of targets) {
    const url = new URL(target.file, base.endsWith('/') ? base : base + '/').href;
    const result = { name: target.name, url, status: 'FAIL' };
    const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      result.httpStatus = response?.status() ?? null;
      if (!response || !response.ok()) throw new Error('HTTP response not successful: ' + result.httpStatus);

      result.title = await page.title();
      if (!target.title.test(result.title)) throw new Error('Unexpected page title: ' + result.title);

      await page.waitForSelector('#titans-locale-select', { timeout: 15000 });
      result.languageOptions = await page.locator('#titans-locale-select option').count();
      if (result.languageOptions !== 24) throw new Error('Expected 24 language options; found ' + result.languageOptions);

      await page.selectOption('#titans-locale-select', 'de');
      result.localeChange = await page.locator('html').getAttribute('lang');
      if (result.localeChange !== 'de') throw new Error('Locale selector did not update document lang');

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
          affectedNodes: item.nodes.length,
        })),
        passes: accessibility.passes.length,
      };
      if (accessibility.violations.length) {
        throw new Error('WCAG automated violations: ' + accessibility.violations.map((item) => item.id).join(', '));
      }

      await page.setViewportSize({ width: 390, height: 844 });
      result.mobileViewport = '390x844';
      result.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
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

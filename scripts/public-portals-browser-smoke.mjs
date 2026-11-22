import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.PUBLIC_PORTAL_BASE_URL || 'https://karimkatlane0-crypto.github.io/-URBAN-ONE/apps/web';
const mobileBase = process.env.MOBILE_PORTAL_BASE_URL || base;
const targets = [
  { name: 'Discovery', file: 'discovery.html', title: /soggiorni e immobili/i },
  { name: 'SEVA CRM Studio', file: 'seva-crm-studio.html', title: /customer intelligence studio/i },
  { name: 'SEVA Unified Studio', file: 'seva-unified-studio.html', title: /unified saas portal/i },
  { name: 'Universal 36', file: 'universal-36.html', title: /UNIVERSAL 36/i, localeSelector: false, verifyUniversalLinks: true, verifyInternalLinks: true, verifyNavigation: 'instance-manager.html' },
  { name: 'SUPER.AI Control Plane', file: 'super-ai.html', title: /SUPER.AI.*Unified Platform Control Plane/i, localeSelector: false, verifyInternalLinks: true, verifyNavigation: 'super-ai-settings.html' },
  { name: 'SUPER.AI Settings', file: 'super-ai-settings.html', title: /SUPER.AI.*Impostazioni piattaforma/i, localeSelector: false, verifyInternalLinks: true, verifyNavigation: 'super-ai.html' },
  { name: 'URBAN ONE Workspace', file: 'v10-workspace.html', title: /URBAN ONE Universal/i, localeSelector: false, verifyInternalLinks: true, verifyWorkspaceFilters: true },
  { name: 'TITANS Enterprise Studio', file: 'titans-enterprise-studio.html', title: /TITANS.*Enterprise Intelligence Studio/i, localeSelector: false },
  { name: 'TITANS Mobile Workspace', file: 'titans-enterprise-studio-mobile.html', title: /TITANS.*Enterprise Intelligence Studio/i, localeSelector: false },
  { name: 'TITANS Partner and SEVA Enterprise Onboarding', file: 'seva-titans-onboarding.html', title: /Sovereign Onboarding/i, localeSelector: false },
  { name: 'INSIDERS Finance Control Scenario', file: 'financial-insights.html', title: /Financial Insights AI/i, localeSelector: false },
  { name: 'INSIGHTS.ai Unified', file: 'insights-ai.html', title: /INSIGHTS.ai.*Unified Intelligence/i, localeSelector: false, verifyInternalLinks: true },
  { name: 'INSIGHTS legacy route', file: 'insights-free.html', title: /INSIGHTS.ai.*Unified Intelligence/i, localeSelector: false },
  { name: 'Europe Maps', file: 'maps-europe.html', title: /GMAPS Europa/i, localeSelector: false },
  { name: 'SYNAPSY', file: 'synapsy.html', title: /SYNAPSY/i, localeSelector: false },
  { name: 'URBAN ONE Universal', file: 'v10-workspace.html', title: /URBAN ONE Universal/i, localeSelector: false },
  { name: 'Financial Scenario Calculator', file: 'financial-dashboard.html', title: /Financial Scenario Calculator/i, localeSelector: false },
  { name: 'Universal Instance Manager', file: 'instance-manager.html', title: /Universal Instance Manager/i, localeSelector: false, verifyInstanceManager: true },
  { name: 'Mobile SUPER.AI Hub', root: 'mobile', file: 'super-ai.html', title: /SUPER.AI.*Universal Mobile Hub/i, localeSelector: false, verifyInternalLinks: true, verifyNavigation: 'maps-europe.html' },
  { name: 'Mobile SUPER.AI Settings', root: 'mobile', file: 'super-ai-settings.html', title: /SUPER.AI.*Impostazioni piattaforma/i, localeSelector: false, verifyInternalLinks: true, verifyNavigation: 'super-ai.html' },
  { name: 'Mobile URBAN ONE Home', root: 'mobile', file: 'index.html', title: /URBAN ONE UNIVERSAL/i, localeSelector: false, verifyInternalLinks: true, verifyNavigation: 'super-ai.html' },
  { name: 'Mobile Discovery', root: 'mobile', file: 'discovery.html', title: /soggiorni e immobili/i, localeSelector: false, verifyInternalLinks: true },
  { name: 'Mobile Instance Manager', root: 'mobile', file: 'instance-manager.html', title: /Universal Instance Manager/i, localeSelector: false, verifyInstanceManager: true },
  { name: 'Mobile Maps Europe', root: 'mobile', file: 'maps-europe.html', title: /GMAPS Europa/i, localeSelector: false, verifyInternalLinks: true, verifyMapsSearch: true, verifyNavigation: 'super-ai.html' },
  { name: 'Mobile SYNAPSY', root: 'mobile', file: 'synapsy.html', title: /SYNAPSY.*Evidence.*Governance/i, localeSelector: false, verifyInternalLinks: true, verifyNavigation: 'super-ai.html' },
  { name: 'Mobile URBAN ONE Workspace', root: 'mobile', file: 'v10-workspace.html', title: /URBAN ONE Universal/i, localeSelector: false, verifyInternalLinks: true, verifyWorkspaceFilters: true },
  { name: 'Mobile Europe Immobili', root: 'mobile', file: 'europe-immobili.html', title: /Immobili e civici d'Europa/i, localeSelector: false, verifyInternalLinks: true },
  { name: 'Mobile INSIGHTS.ai', root: 'mobile', file: 'insights-ai.html', title: /INSIGHTS.ai.*Unified Intelligence/i, localeSelector: false, verifyInternalLinks: true },
  { name: 'Mobile Pole Position', root: 'mobile', file: 'pole-position.html', title: /Pole Position.*URBAN ONE/i, localeSelector: false, verifyInternalLinks: true },
  { name: 'Mobile Pole Premium', root: 'mobile', file: 'pole-premium.html', title: /URBAN ONE.*Pole Position Intelligence LAB/i, localeSelector: false, verifyInternalLinks: true },
  { name: 'Mobile AI Science', root: 'mobile', file: 'science.html', title: /URBAN ONE.*AI Science Computer/i, localeSelector: false, verifyInternalLinks: true },
  { name: 'Mobile SEVA CRM', root: 'mobile', file: 'seva-crm-studio.html', title: /SEVA Unified CRM.*Customer Intelligence Studio/i, localeSelector: false, verifyInternalLinks: true },
  { name: 'Mobile SEVA Unified Studio', root: 'mobile', file: 'seva-unified-studio.html', title: /SEVA Intelligence Studio.*Unified SaaS Portal/i, localeSelector: false, verifyInternalLinks: true },
  { name: 'Mobile TITANS Enterprise Studio', root: 'mobile', file: 'titans-enterprise-studio.html', title: /TITANS.*Enterprise Intelligence Studio/i, localeSelector: false, verifyInternalLinks: true }
];
const outDir = 'release/browser-proof';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const target of targets) {
    const rootBase = target.root === 'mobile' ? mobileBase : base;
    const url = new URL(target.file, rootBase.endsWith('/') ? rootBase : rootBase + '/').href;
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


      if (target.verifyInternalLinks) {
        result.internalNavigation = await page.evaluate(async () => {
          const links = [...document.querySelectorAll('a[href]')];
          const failures = [];
          const checked = new Set();
          for (const link of links) {
            const raw = link.getAttribute('href') || '';
            if (!raw || /^(mailto:|tel:|javascript:|data:)/i.test(raw)) continue;
            const url = new URL(raw, location.href);
            if (url.origin !== location.origin || !/\.html$/i.test(url.pathname) || checked.has(url.pathname + url.hash)) continue;
            checked.add(url.pathname + url.hash);
            if (url.pathname === location.pathname && url.hash) {
              const id = decodeURIComponent(url.hash.slice(1));
              if (!document.getElementById(id) && !document.getElementsByName(id).length) failures.push({ href: raw, reason: 'missing in-page anchor' });
              continue;
            }
            try {
              const response = await fetch(url.href, { method: 'GET', credentials: 'same-origin' });
              if (!response.ok) {
                failures.push({ href: raw, status: response.status });
                continue;
              }
              if (url.hash) {
                const html = await response.text();
                const targetDoc = new DOMParser().parseFromString(html, 'text/html');
                const id = decodeURIComponent(url.hash.slice(1));
                if (!targetDoc.getElementById(id) && !targetDoc.getElementsByName(id).length) failures.push({ href: raw, reason: 'missing destination anchor' });
              }
            } catch (error) {
              failures.push({ href: raw, reason: String(error) });
            }
          }
          return { checked: checked.size, failures };
        });
        if (result.internalNavigation.failures.length) throw new Error('Broken internal navigation: ' + JSON.stringify(result.internalNavigation.failures));
      }


      if (target.verifyNavigation) {
        const navLink = page.locator('a[href="./' + target.verifyNavigation + '"]').first();
        if (await navLink.count() === 0) throw new Error('Expected navigation link missing: ' + target.verifyNavigation);
        await Promise.all([
          page.waitForURL(url => url.pathname.endsWith('/' + target.verifyNavigation)),
          navLink.click()
        ]);
        result.navigation = { destination: target.verifyNavigation, reached: true };
        await page.goBack();
        await page.waitForURL(url => url.pathname.endsWith('/' + target.file));
      }

      if (target.verifyWorkspaceFilters) {
        const before = await page.locator('article[data-category]:visible').count();
        const filter = page.locator('[data-filter]:not([data-filter="all"])').first();
        if (await filter.count() === 0) throw new Error('Workspace category filters missing');
        await filter.click();
        const after = await page.locator('article[data-category]:visible').count();
        if (after === 0 || after >= before) throw new Error('Workspace category filter did not narrow visible modules');
        await page.locator('#q').fill('front-end-e2e-no-match-7f9c');
        const emptyCount = await page.locator('article[data-category]:visible').count();
        if (emptyCount !== 0) throw new Error('Workspace search did not show the empty state');
        await page.locator('#reset').click();
        const restored = await page.locator('article[data-category]:visible').count();
        if (restored !== before) throw new Error('Workspace reset did not restore all modules');
        result.workspaceFilters = { before, after, restored };
      }

      if (target.verifyMapsSearch) {
        await page.evaluate(() => {
          window.__openedUrls = [];
          window.open = (url) => { window.__openedUrls.push(String(url)); return null; };
        });
        await page.locator('#q').fill('Trieste, Italia');
        await page.locator('#search').click();
        result.mapsSearch = await page.evaluate(() => ({
          opened: window.__openedUrls[0] || null,
          status: document.querySelector('#status')?.textContent || ''
        }));
        if (!result.mapsSearch.opened?.includes('google.com/maps/search') || !result.mapsSearch.opened.includes('Trieste')) {
          throw new Error('Maps search action did not produce the expected user-initiated Google Maps URL');
        }
        if (!/Trieste/.test(result.mapsSearch.status)) throw new Error('Maps search status was not updated');
      }

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

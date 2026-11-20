import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.PUBLIC_PORTAL_BASE_URL || 'https://karimkatlane0-crypto.github.io/-URBAN-ONE/apps/web';
const targets = [
  { name: 'Discovery', file: 'discovery.html', title: /soggiorni e immobili/i },
  { name: 'SEVA CRM Studio', file: 'seva-crm-studio.html', title: /customer intelligence studio/i },
  { name: 'SEVA Unified Studio', file: 'seva-unified-studio.html', title: /unified saas portal/i },
  { name: 'TITANS Request Inbox', file: 'titans-request-inbox.html', title: /TITANS · Request Inbox/i, localeSelector: false },
  { name: 'TITANS Skill Studio', file: 'titans-skill-studio.html', title: /TITANS · Skill Creator/i, localeSelector: false }
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

      if (target.localeSelector !== false) {
        await page.waitForSelector('#titans-locale-select', { timeout: 15000 });
        result.languageOptions = await page.locator('#titans-locale-select option').count();
        if (result.languageOptions !== 24) throw new Error('Expected 24 language options; found ' + result.languageOptions);
        await page.selectOption('#titans-locale-select', 'de');
        result.localeChange = await page.locator('html').getAttribute('lang');
        if (result.localeChange !== 'de') throw new Error('Locale selector did not update document lang');
      } else {
        result.localeChange = 'not-applicable';
        if (target.file === 'titans-request-inbox.html') {
          await page.addInitScript(() => {
            let requests=[
              {id:'11111111-1111-4111-8111-111111111111',requesterId:'alice-test',recipientId:'bob-test',purpose:'data_sharing',scopes:['contacts:read'],note:'Synthetic browser test',expiresAt:new Date(Date.now()+86400000).toISOString()},
              {id:'22222222-2222-4222-8222-222222222222',requesterId:'alice-test',recipientId:'bob-test',purpose:'partner_collaboration',scopes:['profile:read'],note:'Synthetic decline test',expiresAt:new Date(Date.now()+86400000).toISOString()}
            ];
            window.fetch=async(input,init={})=>{
              const url=typeof input==='string'?input:input.url;
              const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
              if(url==='/api/titans/session')return json({actorId:'bob-test',scopes:['titans:request:respond','titans:request:read','titans:grant:revoke']});
              if(url==='/api/titans/requests/inbox')return json({requests});
              const decision=url.match(/\/api\/titans\/requests\/([0-9a-f-]{36})\/decision$/);
              if(decision){
                const request=requests.find(r=>r.id===decision[1]);if(!request)return json({error:'NOT_FOUND'},404);
                const payload=JSON.parse(init.body||'{}');requests=requests.filter(r=>r.id!==decision[1]);
                const accepted=payload.decision==='accept';
                return json({requestId:request.id,requesterId:request.requesterId,recipientId:request.recipientId,purpose:request.purpose,scopes:request.scopes,note:request.note,state:accepted?'ACCEPTED':'DECLINED',auditHash:'a'.repeat(64),grant:accepted?{grantId:'33333333-3333-4333-8333-333333333333',granteeId:request.requesterId,subjectId:request.recipientId,purpose:request.purpose,scopes:request.scopes,active:true}:null});
              }
              if(url.includes('/api/titans/grants/')&&url.endsWith('/revoke'))return json({revoked:true,revokedAt:new Date().toISOString()});
              return json({error:'NOT_FOUND'},404);
            };
          });
          await page.locator('#token').fill('synthetic-browser-token-0123456789-abcdef');
          await page.locator('#connect').click();
          await page.getByRole('button',{name:'ACCEPT'}).waitFor({timeout:10000});
          result.inboxRequests=await page.locator('.request').count();
          if(result.inboxRequests!==2)throw new Error('Expected two synthetic inbox requests');
          await page.getByRole('button',{name:'ACCEPT'}).first().click();
          await page.getByText(/Consenso specifico registrato/).waitFor({timeout:10000});
          await page.getByRole('button',{name:'Revoca autorizzazione'}).click();
          await page.getByText(/Revoca registrata/).waitFor({timeout:10000});
          await page.getByRole('button',{name:'DECLINE'}).click();
          await page.getByText(/Richiesta rifiutata/).waitFor({timeout:10000});
          result.acceptDeclineAndRevoke='PASS · mocked staging API';
          result.backendMocked=true;
        } else if (target.file === 'titans-skill-studio.html') {
          await page.locator('#skill-form button[type="submit"]').click();
          const manifest=await page.locator('#output').textContent();
          const parsed=JSON.parse(manifest);
          if(parsed.status!=='DRAFT'||parsed.executionEnabled!==false||parsed.publishable!==false||parsed.requiresHumanApproval!==true)
            throw new Error('Skill draft release gates are not fail-closed');
          if(!(await page.locator('#download').isEnabled()))throw new Error('Skill draft export did not enable');
          result.skillDraft='PASS · local JSON only';
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
      if (target.file === 'universal-36.html' && result.horizontalOverflow) throw new Error('Universal 36 horizontal overflow at mobile viewport');
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

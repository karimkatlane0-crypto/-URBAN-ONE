import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const langs=['it','en','de','fr','es'];
const pages=Object.fromEntries(langs.map(code=>[code,readFileSync(new URL('../apps/web/europe-'+code+'.html',import.meta.url),'utf8')]));
const index=readFileSync(new URL('../apps/web/index.html',import.meta.url),'utf8');
const readme=readFileSync(new URL('../README.md',import.meta.url),'utf8');
const css=readFileSync(new URL('../apps/web/europe.css',import.meta.url),'utf8');

test('five separate EU localizations have correct language, titles and styles',()=>{
  for(const [lang,html] of Object.entries(pages)){
    assert.match(html,new RegExp('<html lang="'+lang+'">'));
    assert.match(html,/<title>[^<]{15,}<\/title>/);
    assert.match(html,/href="\.\/europe\.css"/);
    assert.match(html,/name="description"/);
    assert.match(html,/<main>[\s\S]+<\/main>/);
    assert.match(html,/<footer>/);
    for(const code of langs) assert.match(html,new RegExp('hreflang="'+code+'"'));
  }
  assert.match(css,/@media\(max-width:740px\)/);
});
test('client action is opt-in and only the verified agreed-service Stripe checkout is linked',()=>{
  const approvedCheckout='https://buy.stripe.com/7sYbJ351fghgei7auSb7y05';
  for(const html of Object.values(pages)){
    assert.match(html,/mailto:karimkatlane0@gmail\.com/);
    assert.match(html,/issues\/new/);
    assert.doesNotMatch(html,/<form[\s>]/i);
    assert.ok(html.includes(approvedCheckout));
    assert.ok(html.includes('target="_blank" rel="noopener noreferrer"'));
    assert.doesNotMatch(html.replaceAll(approvedCheckout,''),/google-analytics|googletagmanager|fbq\(|gtag\(|<script|stripe\.com\/[^ "]+/i);
    assert.doesNotMatch(html,/IT\d{2}[A-Z]\d{22}|sk_(?:live|test)_|whsec_/i);
  }
});

test('public home and README advertise localized service source with compliance text',()=>{
  for(const lang of langs){
    assert.match(index,new RegExp('europe-'+lang+'\\.html'));
    assert.match(readme,new RegExp('europe-'+lang+'\\.html'));
  }
  assert.match(index,/accordo scritto/);
  assert.match(readme,/website deployment and live reachability are separate/);
});

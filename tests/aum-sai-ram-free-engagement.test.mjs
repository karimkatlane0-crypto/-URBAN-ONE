import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const webApp = await readFile(new URL('../apps/web/aum-sai-ram.html', import.meta.url), 'utf8');
const mobileApp = await readFile(new URL('../apps/mobile/www/aum-sai-ram.html', import.meta.url), 'utf8');
const webStudio = await readFile(new URL('../apps/web/titans-enterprise-studio.html', import.meta.url), 'utf8');
const mobileStudio = await readFile(new URL('../apps/mobile/www/titans-enterprise-studio.html', import.meta.url), 'utf8');

test('AUM SAI RAM app is byte-identical across Web and Mobile', () => {
  assert.equal(webApp, mobileApp);
  assert.match(webApp, /name="viewport"/);
  assert.match(webApp, /prefers-reduced-motion/);
  assert.match(webApp, /max-width:760px/);
});

test('AUM SAI RAM Studio navigation points to the new app on both surfaces', () => {
  assert.match(webStudio, /\.\/aum-sai-ram\.html/);
  assert.match(mobileStudio, /\.\/aum-sai-ram\.html/);
});

test('Free engagement terms are transparent and do not imply SSSIO affiliation', () => {
  for (const html of [webApp, mobileApp]) {
    assert.match(html, /\$200/);
    assert.match(html, /100% WAIVED/);
    assert.match(html, /\$0 \/ month/);
    assert.match(html, /Default revenue share: <strong>0%/);
    assert.match(html, /separate written agreement/);
    assert.match(html, /not part of, affiliated with, endorsed by or speaking for/);
    assert.match(html, /No mass outreach/);
    assert.match(html, /karimkatlane0@gmail\.com/);
  }
});

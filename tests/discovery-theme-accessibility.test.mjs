import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const web = await readFile(new URL('../apps/web/discovery.html', import.meta.url), 'utf8');
const mobile = await readFile(new URL('../apps/mobile/www/discovery.html', import.meta.url), 'utf8');

test('Discovery Web and Mobile preserve the same accessible consumer light theme', () => {
  assert.equal(web, mobile, 'Discovery source must remain identical across Web and Mobile');
  assert.doesNotMatch(web, /executive-system\.css/, 'Dark executive tokens must not override the consumer light theme');
  assert.match(web, /color:#122d32;background:#f5f3ed/);
  assert.match(web, /\.hero-note\{[^}]*background:#fff9ed/);
});

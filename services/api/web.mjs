import {readFile} from 'node:fs/promises';
const webRoot = new URL('../../apps/web/', import.meta.url);
const types = {js: 'text/javascript; charset=utf-8', html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', svg: 'image/svg+xml', webmanifest: 'application/manifest+json'};

export async function serveWeb(req, res, path) {
  if (!['GET', 'HEAD'].includes(req.method)) return false;
  const file = path === '/' ? 'index.html' : path.slice(1);
  // Only public web assets; never expose repository, environment or API source.
  if (file !== 'pole-position.js' && !/^(?:[a-z0-9-]+\.(?:html|css|webmanifest)|assets\/[a-z0-9-]+\.svg)$/.test(file)) return false;
  try {
    const content = await readFile(new URL(file, webRoot));
    res.writeHead(200, {'content-type': types[file.split('.').pop()], 'x-content-type-options': 'nosniff', 'cache-control': 'no-cache'});
    res.end(req.method === 'HEAD' ? undefined : content);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

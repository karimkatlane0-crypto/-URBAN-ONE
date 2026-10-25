import {readFileSync} from 'node:fs';
import {discover} from '../../packages/discovery/search.mjs';

export function discoveryResponse(body, env = {}) {
  let catalog = {};
  if (env.DISCOVERY_CATALOG_FILE) {
    try {
      const raw = readFileSync(env.DISCOVERY_CATALOG_FILE, 'utf8');
      if (raw.length > 2_000_000) throw new Error('catalog too large');
      catalog = JSON.parse(raw);
      if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) throw new Error('invalid catalog');
    } catch { return {status:503, body:{error:'SOURCE_UNAVAILABLE', items:[]}}; }
  }
  try { return {status:200, body:discover(body, catalog)}; }
  catch { return {status:400, body:{error:'INVALID_REQUEST', items:[]}}; }
}

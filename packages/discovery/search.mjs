import {assessAffiliateReadiness} from '../marketing/affiliate-readiness.mjs';

const fresh = (date, now) => typeof date === 'string' && Number.isFinite(Date.parse(date)) && now >= Date.parse(date) && now - Date.parse(date) <= 86400000;
const text = value => typeof value === 'string' ? value.trim().slice(0, 200) : '';
function safeUrl(value, hosts) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && hosts.includes(u.hostname) ? u.href : null; } catch { return null; }
}

// `catalog` is loaded by the server administrator, never from request JSON.
// This is deterministic filtering, not an LLM or a provider integration.
export function discover(query, catalog = {}, now = Date.now()) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) throw new TypeError('Richiesta non valida');
  const mode = ['tourism', 'rent', 'buy'].includes(query.mode) ? query.mode : null;
  const city = text(query.city);
  const budget = Number(query.budget);
  const missing = [];
  if (!mode) missing.push('Scegli soggiorno, affitto o acquisto.');
  if (!city) missing.push('In quale città cerchi?');
  if (!Number.isFinite(budget) || budget <= 0) missing.push('Indica un budget positivo in euro.');
  if (mode === 'tourism') {
    const arrival = Date.parse(query.arrival), departure = Date.parse(query.departure);
    const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value)) && new Date(Date.parse(value)).toISOString().slice(0,10) === value;
    if (!validDate(query.arrival) || !validDate(query.departure) || arrival < Math.floor(now / 86400000) * 86400000 || departure <= arrival) missing.push('Indica date future di arrivo e partenza valide.');
    if (!Number.isInteger(Number(query.guests)) || Number(query.guests) < 1 || Number(query.guests) > 100) missing.push('Indica il numero di ospiti (1–100).');
  }
  if (missing.length) return {status:'NEEDS_DETAILS', questions:missing, items:[]};
  const rows = Array.isArray(catalog.records) ? catalog.records : [];
  const hosts = Array.isArray(catalog.allowedHosts) ? catalog.allowedHosts : [];
  const items = [];
  for (const row of rows.slice(0, 10000)) {
    if (!row || row.mode !== mode || text(row.city).toLocaleLowerCase('it') !== city.toLocaleLowerCase('it')) continue;
    if (row.publicationAuthorized !== true || !fresh(row.authorizationObservedAt, now) || !fresh(row.observedAt, now)) continue;
    const source = safeUrl(row.sourceUrl, hosts);
    if (!source || !text(row.title) || !text(row.sourceName)) continue;
    const p = row.price;
    const expectedBasis = mode === 'tourism' ? 'stay' : mode === 'rent' ? 'month' : 'purchase';
    if (!p || p.currency !== 'EUR' || p.basis !== expectedBasis || ![p.amount, p.mandatoryFees].every(x => typeof x === 'number' && Number.isFinite(x) && x >= 0)) continue;
    const total = Math.round((p.amount + p.mandatoryFees) * 100) / 100;
    if (!Number.isFinite(total) || total > budget) continue;
    if (mode === 'tourism' && (row.arrival !== query.arrival || row.departure !== query.departure || row.guests !== Number(query.guests))) continue;
    let action = null;
    if (mode === 'tourism') {
      const provider = catalog.advertisers?.[row.advertiser];
      if (provider && assessAffiliateReadiness(provider.evidence, {now}).readyForPromotion && text(provider.disclosure)) {
        const url = safeUrl(provider.links?.[row.linkKey], hosts);
        if (url) action = {label:'Apri offerta affiliata', url, disclosure:text(provider.disclosure)};
      }
    } else {
      const url = safeUrl(row.inquiryUrl, hosts);
      if (url) action = {label:'Richiedi informazioni o visita', url};
    }
    items.push({title:text(row.title), city:text(row.city), sourceName:text(row.sourceName), sourceUrl:source, observedAt:row.observedAt,
      price:{amount:p.amount, mandatoryFees:p.mandatoryFees, total, currency:'EUR', basis:p.basis},
      reason:'Città e percorso corrispondenti; costo entro il budget. Ordinamento per costo crescente.',
      toConfirm:['Disponibilità da riconfermare alla fonte', mode === 'rent' ? 'Deposito, utenze e durata contrattuale' : mode === 'buy' ? 'Documenti, imposte e spese della compravendita' : 'Condizioni, cancellazione e prezzo finale del partner'], action});
  }
  items.sort((a,b) => a.price.total - b.price.total);
  return {status:rows.length ? (items.length ? 'RESULTS' : 'NO_MATCH') : 'SOURCE_REQUIRED', questions:[], items:items.slice(0, 50), bookingConfirmed:false, revenueConfirmed:false};
}

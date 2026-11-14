/**
 * SYNAPSY HTTP reachability audit. Importing this module does not send requests.
 *
 * Explicit browser use, if this module is served from the same origin:
 *   const audit = await import('/scripts/run_synapsy_full_audit.js');
 *   const report = await audit.runSynapsyFullAudit({
 *     baseUrl: location.href,
 *     hrefs: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))
 *   });
 *   console.table(report.routes);
 *   audit.downloadSynapsyAuditReport(report); // optional, explicit download
 *
 * Only supply links whose GET requests are safe to repeat in the chosen session.
 * COMPLETE means the selected HTTP requests succeeded. It does not verify all
 * application routes, page contents, button clicks, provider flows or devices.
 * A SHA-256 digest detects changes to this report; it is not a digital signature.
 */

export function collectSameOriginPaths(hrefs, baseUrl) {
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
    throw new TypeError('baseUrl must be an HTTP(S) URL without embedded credentials');
  }
  if (!Array.isArray(hrefs)) throw new TypeError('hrefs must be an array');

  const paths = new Set();
  const excluded = [];
  for (const href of hrefs) {
    let reason;
    if (typeof href !== 'string' || !href.trim()) reason = 'EMPTY_OR_INVALID_LINK';
    else if (href.trim().startsWith('#')) reason = 'FRAGMENT_ONLY';
    else {
      try {
        const url = new URL(href, base);
        if (!['http:', 'https:'].includes(url.protocol)) reason = 'NON_HTTP_LINK';
        else if (url.origin !== base.origin) reason = 'OTHER_ORIGIN';
        else if (url.username || url.password) reason = 'EMBEDDED_CREDENTIALS';
        else paths.add(url.pathname + url.search); // Queries matter; fragments are not sent over HTTP.
      } catch {
        reason = 'INVALID_URL';
      }
    }
    if (reason) excluded.push({ href: typeof href === 'string' ? href : null, reason });
  }
  return { origin: base.origin, paths: [...paths].sort(), excluded };
}

async function checkPath(path, origin, fetchImpl, timeoutMs) {
  // Prefix the validated origin: a pathname beginning with // must remain a
  // pathname, never be reinterpreted as a protocol-relative external URL.
  const url = new URL(origin + path).href;
  const controller = new AbortController();
  const started = Date.now();
  let timeout;
  let timedOut = false;
  let response;
  const result = { path, requested_url: url, http_status: 0, outcome: 'NETWORK_ERROR', final_url: null };
  try {
    const deadline = new Promise((_, reject) => {
      timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
        reject(new Error('HTTP request timed out'));
      }, timeoutMs);
    });
    response = await Promise.race([
      fetchImpl(url, {
        method: 'GET', credentials: 'same-origin', mode: 'same-origin',
        redirect: 'manual', signal: controller.signal
      }),
      deadline
    ]);
    result.http_status = response.status;
    let finalUrl;
    try { finalUrl = response.url ? new URL(response.url) : null; } catch { finalUrl = null; }
    if (finalUrl) {
      finalUrl.hash = '';
      result.final_url = finalUrl.href;
    }
    if (response.type === 'opaqueredirect' || response.redirected ||
        (response.status >= 300 && response.status < 400)) {
      result.outcome = 'REDIRECT';
    } else if (!finalUrl || finalUrl.origin !== origin || finalUrl.username || finalUrl.password ||
               finalUrl.href !== url) {
      result.outcome = 'UNEXPECTED_RESPONSE_URL';
    } else {
      result.outcome = response.status >= 200 && response.status < 300 ? 'HTTP_OK' : 'HTTP_ERROR';
    }
  } catch (error) {
    result.outcome = timedOut ? 'TIMEOUT' : 'NETWORK_ERROR';
    result.error = timedOut ? 'HTTP request timed out' : String(error?.message ?? error);
  } finally {
    clearTimeout(timeout);
    // This audit only checks response headers. Release unread bodies and abort
    // the request after inspecting them, including HTTP error responses. Do not
    // await cancel(): a stream's cancellation promise can remain pending. A
    // rejected/locked stream still reaches abort and cannot replace the result.
    try {
      Promise.resolve(response?.body?.cancel?.()).catch(() => {});
    } catch {
      // Abort below also covers a body whose cancel() throws synchronously.
    }
    controller.abort();
  }
  return { ...result, ms: Math.max(0, Date.now() - started) };
}

const SERIALIZATION = 'UTF-8 JSON.stringify(payload, null, 2), with no trailing newline; payload is all top-level fields except integrity, in their stored property order';

export async function hashReportPayload(payload, cryptoImpl = globalThis.crypto) {
  if (!cryptoImpl?.subtle?.digest) throw new Error('Web Crypto SHA-256 is unavailable');
  const bytes = new TextEncoder().encode(JSON.stringify(payload, null, 2));
  const digest = await cryptoImpl.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyReportIntegrity(report, cryptoImpl = globalThis.crypto) {
  const { integrity, ...payload } = report;
  return integrity?.algorithm === 'SHA-256' && integrity?.authenticated === false &&
    integrity?.serialization === SERIALIZATION &&
    integrity?.sha256 === await hashReportPayload(payload, cryptoImpl);
}

export async function runSynapsyFullAudit({
  hrefs, baseUrl, fetchImpl = globalThis.fetch, timeoutMs = 10000,
  cryptoImpl = globalThis.crypto
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function');
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 60000) {
    throw new TypeError('timeoutMs must be an integer between 1 and 60000');
  }
  if (!cryptoImpl?.subtle?.digest) throw new Error('Web Crypto SHA-256 is unavailable');
  const { origin, paths, excluded } = collectSameOriginPaths(hrefs, baseUrl);
  const routes = [];
  for (const path of paths) routes.push(await checkPath(path, origin, fetchImpl, timeoutMs));
  const reachable = routes.filter(route => route.outcome === 'HTTP_OK').length;
  const payload = {
    schema_version: 1,
    project: 'SYNAPSY — SEVA Intelligence Studio',
    scope: 'HTTP_REACHABILITY',
    executed_at: new Date().toISOString(),
    origin,
    overall: routes.length > 0 && reachable === routes.length ? 'COMPLETE' : 'INCOMPLETE',
    coverage: {
      source: 'SUPPLIED_LINKS', input_links: hrefs.length,
      all_application_routes_verified: false, expected_application_route_count: null,
      page_content_and_workflows: 'NOT_VERIFIED', device_accessibility: 'NOT_VERIFIED'
    },
    total_paths_checked: routes.length,
    reachable_http: reachable,
    unsuccessful_http: routes.length - reachable,
    excluded_links: excluded,
    routes
  };
  return {
    ...payload,
    integrity: {
      algorithm: 'SHA-256', authenticated: false, serialization: SERIALIZATION,
      sha256: await hashReportPayload(payload, cryptoImpl)
    }
  };
}

export function downloadSynapsyAuditReport(report) {
  if (!globalThis.document?.body || !globalThis.URL?.createObjectURL) {
    throw new Error('Explicit report download requires a browser document');
  }
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'synapsy-http-reachability.json';
  try {
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

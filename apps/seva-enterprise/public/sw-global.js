/* SEVA Global PWA — static assets ONLY, privacy-preserving fail-closed fetch policy.
 * Never cache auth, API data, AI, checkout, banking, customer data or query-bearing HTML.
 */
const CACHE='seva-global-v1-20261027';
const STATIC=['/','/studio.html','/studio.css','/studio.js','/pwa-global.js','/backup-global.js','/psdm.html','/psdm.css','/psdm.js','/psdm-engine.js','/mobile.html','/manifest-global.webmanifest','/seva-global-icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(
 Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('seva-global-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])
));
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||req.mode==='no-cors')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/bank')||url.pathname==='/health'||url.pathname==='/api')return;
 if(url.searchParams.has('code')||url.searchParams.has('state')||url.searchParams.has('session_id'))return;
 if(!STATIC.includes(url.pathname)||url.search&&url.pathname!=='/')return;
 event.respondWith(fetch(req).then(response=>{
   if(response.ok&&response.type==='basic'&&!response.headers.has('Set-Cookie')){
     const copy=response.clone();
     event.waitUntil(caches.open(CACHE).then(c=>c.put(url.pathname,copy)));
   }
   return response;
 }).catch(()=>caches.match(url.pathname).then(cached=>cached||Response.error())));
});

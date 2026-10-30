/* SEVA PWA: cache static shell only. Never cache /api, cookies, AI answers or Stripe flows. */
const CACHE='seva-enterprise-shell-v2-6-dbrelay-recovery';
const ASSETS=['/','/index.html','/styles.css','/app.js','/dbrelay-sync.js','/notifications-ui.js','/communications-ui.js','/original-intelligence-ui.js','/analytics.css','/students.js','/commercial.html','/commercial.css','/commercial.js','/shop.html','/shop.css','/shop.js','/manifest.webmanifest','/icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('seva-enterprise-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/')||u.pathname==='/health')return;
 if(!ASSETS.includes(u.pathname)&&u.pathname!=='/')return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok&&!response.headers.has('Set-Cookie')){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return response;}).catch(()=>caches.match(event.request).then(cached=>cached||Response.error())));
});

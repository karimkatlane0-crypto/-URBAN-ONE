import {readFileSync} from 'node:fs';
// Static allowlist. No directory traversal, proxying, credentials or remote imports.
export function createMobileUiHandler() {
  const assets=new Map([
    ['/mobile-crm/',['index.html','text/html']],
    ['/mobile-crm/client.mjs',['client.mjs','text/javascript']],
    ['/mobile-crm/interface.mjs',['interface.mjs','text/javascript']],
    ['/mobile-crm/style.css',['style.css','text/css']],
    ['/mobile-crm/manifest.json',['manifest.json','application/json']]
  ].map(([route,[file,type]])=>[route,{type,data:readFileSync(new URL('./mobile-crm/'+file,import.meta.url))}]));
  return function serve(req,res) {
    const path=new URL(req.url||'/', 'http://localhost').pathname;
    if(path!=='/mobile-crm'&&!path.startsWith('/mobile-crm/'))return false;
    const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'same-origin','X-Frame-Options':'DENY',
      'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      'Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{...headers,Allow:'GET, HEAD'});res.end();return true;}
    if(path==='/mobile-crm'){res.writeHead(308,{...headers,Location:'/mobile-crm/'});res.end();return true;}
    const asset=assets.get(path);
    if(!asset){res.writeHead(404,headers);res.end();return true;}
    res.writeHead(200,{...headers,'Content-Type':asset.type+'; charset=utf-8'});
    res.end(req.method==='HEAD'?undefined:asset.data);return true;
  };
}

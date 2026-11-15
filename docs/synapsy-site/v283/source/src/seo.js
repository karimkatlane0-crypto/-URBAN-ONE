import {isSevaToolAvailable} from './functional-status.js';
import {STUDIO_LANGUAGES} from './studio-languages.js';

// The platform URL remains canonical until an owned custom domain is verified
// and its HTTPS deployment is live. Never infer this value from a Host header.
export const SEVA_SEO_ORIGIN='https://seva.karimkatlane0.chatgpt.site';
const SEVA_SEO_BILINGUAL=[
 '/superapp','/europa','/onboarding','/onboarding/competenze','/rapporto','/social','/sme','/india','/titans','/identita','/guide-computer-studenti','/guide-accessori-studio','/global','/ristoranti','/cms','/servizi','/acquista','/invite','/connections','/listen','/aura','/fiducia','/affiliates','/amazon','/join','/support','/growth','/network','/payments','/sports','/creators','/campaigns','/students','/alerts','/broadcast','/terms','/privacy','/cookies','/partners','/developers','/commerce','/growth-kit','/insights','/press'
];
const SEVA_SEO_ITALIAN=['/kkubera/cataloghi','/territorio','/music'];
const SEVA_SEO_PRIVATE=new Set(['/app','/account','/premium','/registration','/register','/registrati','/signin-with-chatgpt','/cerca','/analytics','/workspace/backup','/studio/diritti','/studio/trattative','/titans/completamento','/titans/operazioni','/titans/manifesto','/databaseunitary','/automation','/decisioni','/senses','/bisogni','/engage','/matching','/orchestra','/infrastructure','/connections/telecom']);
const sevaSEOEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function sevaSEOPrivatePath(path){return SEVA_SEO_PRIVATE.has(path)||path.startsWith('/api/')||path.startsWith('/rapporti/titolare/')||path.startsWith('/checkout/');}
function sevaSEOModified(path){
 if(['/superapp','/europa','/privacy','/cookies','/terms'].includes(path))return '2026-11-15';
 if(['/onboarding','/onboarding/competenze','/kkubera/cataloghi','/territorio','/music'].includes(path))return '2026-11-14';
 if(['/servizi','/rapporto','/social','/sme','/india'].includes(path))return '2026-11-11';
 if(['/global','/cms','/acquista','/fiducia','/press','/invite','/broadcast','/alerts','/studio'].includes(path))return '2026-11-07';
 if(['/guide-computer-studenti','/guide-accessori-studio','/connections','/growth-kit'].includes(path))return '2026-11-06';
 if(['/listen','/aura'].includes(path))return '2026-11-05';
 if(['/affiliates','/partners','/developers','/commerce','/insights','/payments'].includes(path))return '2026-11-04';
 if(['/join','/amazon','/students'].includes(path))return '2026-11-03';
 return '2026-11-02';
}
export function sevaPublicSEOEntries(){
 return [
  ...SEVA_SEO_BILINGUAL.filter(isSevaToolAvailable).flatMap(path=>['it','en'].map(language=>({path,language,url:SEVA_SEO_ORIGIN+path+(language==='en'?'?lang=en':''),lastmod:sevaSEOModified(path)}))),
  ...SEVA_SEO_ITALIAN.filter(isSevaToolAvailable).map(path=>({path,language:'it',url:SEVA_SEO_ORIGIN+path,lastmod:sevaSEOModified(path)})),
  ...Object.keys(STUDIO_LANGUAGES).map(language=>({path:'/studio',language,url:SEVA_SEO_ORIGIN+'/studio?lang='+language,lastmod:sevaSEOModified('/studio')}))
 ];
}
export function sevaCanonicalURL(input,renderedLanguage=''){
 const url=new URL(input,SEVA_SEO_ORIGIN);
 let path=url.pathname,language=renderedLanguage||url.searchParams.get('lang')||'it';
 if(path==='/global'&&Object.hasOwn(STUDIO_LANGUAGES,language)&&!['it','en'].includes(language))path='/studio';
 const candidates=sevaPublicSEOEntries().filter(entry=>entry.path===path);
 if(!candidates.length)return null;
 return (candidates.find(entry=>entry.language===language)||candidates.find(entry=>entry.language==='it')||candidates[0]).url;
}
export function renderSevaSitemap(){
 return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+sevaPublicSEOEntries().map(entry=>'<url><loc>'+sevaSEOEscape(entry.url)+'</loc><lastmod>'+entry.lastmod+'</lastmod></url>').join('')+'</urlset>';
}
export function renderSevaRobots(){
 // Account pages stay crawlable so their noindex response can be seen.
 // Authentication, not robots.txt, protects all private data.
 return 'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: '+SEVA_SEO_ORIGIN+'/sitemap.xml\n';
}
export function withSevaSEOHeaders(response,input){
 const path=new URL(input,SEVA_SEO_ORIGIN).pathname;
 if(!sevaSEOPrivatePath(path)||response.headers.has('X-Robots-Tag'))return response;
 const headers=new Headers(response.headers);headers.set('X-Robots-Tag','noindex, nofollow');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export function withSevaSEO(html,input){
 if(typeof html!=='string'||!/<head\b/i.test(html))return html;
 const url=new URL(input,SEVA_SEO_ORIGIN);
 if(sevaSEOPrivatePath(url.pathname)){
  if(/<meta\b[^>]*name=["']robots["'][^>]*>/i.test(html))return html;
  return html.replace(/<\/head>/i,'<meta name="robots" content="noindex, nofollow"></head>');
 }
 const language=/<html\b[^>]*lang=["']([^"']+)["']/i.exec(html)?.[1]||'it';
 const canonical=sevaCanonicalURL(url.href,language);if(!canonical)return html;
 const canonicalPath=new URL(canonical).pathname;
 const variants=sevaPublicSEOEntries().filter(entry=>entry.path===canonicalPath);
 const primary=variants.find(entry=>entry.language==='it')||variants[0];
 // Replacing only canonical/hreflang/og:url keeps RSS alternate links,
 // existing titles/descriptions and privacy directives intact.
 const cleaned=html.replace(/<link\b[^>]*>/gi,tag=>
  /\brel=["']canonical["']/i.test(tag)||(/\brel=["']alternate["']/i.test(tag)&&/\bhreflang=/i.test(tag))?'':tag
 ).replace(/<meta\b[^>]*property=["']og:url["'][^>]*>/gi,'');
 const tags='<link rel="canonical" href="'+sevaSEOEscape(canonical)+'">'+variants.map(entry=>'<link rel="alternate" hreflang="'+entry.language+'" href="'+sevaSEOEscape(entry.url)+'">').join('')+'<link rel="alternate" hreflang="x-default" href="'+sevaSEOEscape(primary.url)+'"><meta property="og:url" content="'+sevaSEOEscape(canonical)+'">';
 return cleaned.replace(/<\/head>/i,tags+'</head>');
}


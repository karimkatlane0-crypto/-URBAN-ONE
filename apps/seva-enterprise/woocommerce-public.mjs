/** Optional WooCommerce public catalogue reader — MIT (see LICENSE.txt).
 * Run ONLY in the browser on the merchant's own HTTPS store after installation.
 * Never reads customers or orders. Does not send the catalogue to SEVA.
 * WordPress subdirectory installations: provide the relative basePath '/shop/'.
 */
export function ownWooProductsURL({basePath='/',endpoint}={}) {
  if(!globalThis.location || globalThis.location.protocol !== 'https:') throw new Error('Run on your own HTTPS storefront.');
  if(!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(basePath)) throw new Error('Use a relative WordPress base path such as / or /shop/.');
  const url = new URL(endpoint===undefined?basePath+'wp-json/wc/store/v1/products':endpoint,globalThis.location.origin);
  if(url.origin!==globalThis.location.origin||url.protocol!=='https:'||url.username||url.password||url.hash)throw new Error('Use only this store’s public products endpoint.');
  const pretty=/^\/(?:[^/?#]+\/)*wp-json\/wc\/store\/v1\/products\/?$/.test(url.pathname)&&!url.search;
  const plain=/(?:\/|\/index\.php)$/.test(url.pathname)&&[...url.searchParams].length===1&&url.searchParams.get('rest_route')==='/wc/store/v1/products';
  if(!pretty&&!plain)throw new Error('Use the WooCommerce public products route without extra query fields.');
  url.searchParams.set('per_page','20');return url;
}
/** Keep only an explicit public product link supplied by this HTTPS shop. */
export function ownWooProductPermalink(value) {
  if(typeof value!=='string'||!/^https:\/\//i.test(value)||/[\u0000-\u0020\u007f]/.test(value)||globalThis.location?.protocol!=='https:')return null;
  try{
    const url=new URL(value);
    if(url.protocol!=='https:'||url.origin!==globalThis.location.origin||url.username||url.password)return null;
    return url.href;
  }catch{return null;}
}
export async function readOwnWooCatalogue({basePath='/',endpoint,fetcher=globalThis.fetch}={}) {
  const url=ownWooProductsURL({basePath,endpoint});
  const response = await fetcher(url.href,{method:'GET',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(12000)});
  if(!response.ok) throw new Error('WooCommerce public catalogue unavailable (HTTP '+response.status+').');
  const rows = await response.json();
  if(!Array.isArray(rows)||rows.slice(0,20).some(row=>!row||typeof row!=='object'||!Number.isSafeInteger(row.id)||row.id<=0)) throw new Error('Unexpected catalogue response.');
  return {scope:'first_20_public_products',ordersRead:false,uploadedToSeva:false,products:rows.slice(0,20).map(row=>{
    const permalink=ownWooProductPermalink(row.permalink);
    return {
      id:row.id,name:String(row.name||''),...(permalink?{permalink}:{}),
      priceMinor:String(row.prices?.price??''),currency:String(row.prices?.currency_code??''),
      currencyMinorUnit:row.prices?.currency_minor_unit??null,
      purchasable:row.is_purchasable===true
    };
  })};
}

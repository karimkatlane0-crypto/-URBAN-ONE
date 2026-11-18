/**
 * Canonical product registry for the shared consent service.
 * Product data remains isolated by (subject_id, product); this registry is not identity federation.
 */
export const PRODUCT_REGISTRY = Object.freeze({
  'urban-one': Object.freeze({label:'URBAN ONE',purpose:'technology and digital services',consentScope:'product'}),
  seva: Object.freeze({label:'SEVA',purpose:'commerce and digital services',consentScope:'product'}),
  synapsy: Object.freeze({label:'SYNAPSY',purpose:'intelligence and orchestration workspace',consentScope:'product'}),
  kkubera: Object.freeze({label:'KKUBERA',purpose:'property and hospitality marketplace',consentScope:'product'})
});
export const PRODUCT_IDS = Object.freeze(Object.keys(PRODUCT_REGISTRY));
export function isRegisteredProduct(value) {
  return typeof value==='string' && Object.prototype.hasOwnProperty.call(PRODUCT_REGISTRY,value);
}
export function requireRegisteredProduct(value) {
  if(!isRegisteredProduct(value)) {
    const error=new Error('UNREGISTERED_PRODUCT');
    error.code='UNREGISTERED_PRODUCT';
    error.status=404;
    throw error;
  }
  return value;
}

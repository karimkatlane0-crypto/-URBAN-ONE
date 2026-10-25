// SEVA annual Stripe subscriptions, separate from the commercial A=EUR50/month formula.
// This module never creates charges or changes Stripe product visibility.
export const ANNUAL_PLANS = Object.freeze({
  buyer: Object.freeze({amountCents: 5000, priceEnv: 'SEVA_BUYER_ANNUAL_PRICE_ID', productEnv: 'SEVA_BUYER_ANNUAL_PRODUCT_ID'}),
  ecommerce: Object.freeze({amountCents: 50000, priceEnv: 'SEVA_ECOMMERCE_ANNUAL_PRICE_ID', productEnv: 'SEVA_ECOMMERCE_ANNUAL_PRODUCT_ID'})
});
const unavailable = () => Object.assign(new Error('Annual Stripe plan is not verified or active'), {status: 503});
export function getAnnualPlan(name) {
  if (!Object.prototype.hasOwnProperty.call(ANNUAL_PLANS, name)) throw Object.assign(new Error('Unknown SEVA annual plan'), {status: 400});
  return ANNUAL_PLANS[name];
}
export function validateAnnualPlan(name, price, product, expectedPriceId, expectedProductId) {
  const plan = getAnnualPlan(name);
  if (!/^price_[A-Za-z0-9]+$/.test(expectedPriceId || '') ||
      !/^prod_[A-Za-z0-9]+$/.test(expectedProductId || '')) throw unavailable();
  if (!price || !product || price.id !== expectedPriceId || price.product !== expectedProductId ||
      product.id !== expectedProductId || !price.active || !product.active ||
      price.currency !== 'eur' || price.unit_amount !== plan.amountCents ||
      price.type !== 'recurring' || price.recurring?.interval !== 'year' ||
      price.recurring?.interval_count !== 1 || price.recurring?.usage_type !== 'licensed' ||
      product.metadata?.app !== 'SEVA' ||
      (name === 'buyer' && product.metadata?.audience !== 'buyer')) throw unavailable();
  return true;
}

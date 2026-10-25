/** SEVA enterprise checkout invariant: no legacy annual SKU in the monthly checkout. */
export const SEVA_MONTHLY_CENTS = 5000;
export function validateMonthlyPlan(price, product, expectedPriceId) {
 if(!expectedPriceId || !/^price_[A-Za-z0-9]+$/.test(expectedPriceId)) throw Object.assign(Error('Monthly Stripe price not configured'),{status:503});
 if(!price || !product || price.id!==expectedPriceId || price.product!==product.id ||
 !price.active || !product.active || price.currency!=='eur' ||
 price.unit_amount!==SEVA_MONTHLY_CENTS || price.type!=='recurring' ||
 price.recurring?.interval!=='month' || price.recurring?.interval_count!==1 ||
 price.recurring?.usage_type!=='licensed') {
 throw Object.assign(Error('Monthly Stripe price or product not active, or 50 EUR/month mismatched'),{status:503});
 }
 return true;
}
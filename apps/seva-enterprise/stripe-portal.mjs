// Customer Portal: server-side, TEST-only, never identify customers by email.
export function ownedStripeCustomer(db,userId){
  if(typeof userId!=='string'||!userId)throw Object.assign(Error('Authentication required'),{status:401});
  const rows=db.prepare("SELECT DISTINCT customer FROM plan_entitlements WHERE user_id=? AND customer IS NOT NULL UNION SELECT DISTINCT customer FROM entitlements WHERE user_id=? AND customer IS NOT NULL").all(userId,userId);
  const ids=[...new Set(rows.map(r=>r.customer).filter(v=>typeof v==='string'&&/^cus_[A-Za-z0-9]+$/.test(v)))];
  if(ids.length!==1)throw Object.assign(Error('Unique verified Stripe customer required'),{status:409});
  return ids[0];
}
export function portalGate(env,customer){
  if(env.SEVA_STRIPE_TEST_PORTAL_ENABLED!=='true'||!/^sk_test_/.test(env.STRIPE_SECRET_KEY||''))
    throw Object.assign(Error('Stripe TEST portal disabled'),{status:503});
  if(!/^cus_[A-Za-z0-9]+$/.test(customer))
    throw Object.assign(Error('Invalid customer'),{status:400});
  const origin=env.SEVA_PUBLIC_URL;
  if(typeof origin!=='string'||!/^https:\/\/[^/?#]+\/?$/.test(origin))
    throw Object.assign(Error('Verified HTTPS origin required'),{status:503});
  return {customer,return_url:origin.replace(/\/$/,'')+'/'};
}

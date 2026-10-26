import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../core.mjs';
import {validateAnnualPlan} from '../annual-billing.mjs';

const planIds=Object.freeze({
 enterprise_monthly:'price_TEST50monthly',
 buyer_annual:'price_TEST50annual',
 ecommerce_annual:'price_TEST500annual'
});
function state(){
 const store=createStore();
 const buyer=store.register('buyer-synthetic@example.invalid','StrongSyntheticBuyer-1234');
 const seller=store.register('merchant-synthetic@example.invalid','StrongSyntheticSeller-1234');
 return {store,buyer,seller};
}
function checkout(store,account,id,plan){
 store.recordCheckout(account.id,id,plan,planIds[plan]);
}
function paid(id,session,account,plan,sub){
 return {id,type:'checkout.session.completed',livemode:false,data:{object:{
  id:session,mode:'subscription',payment_status:'paid',subscription:sub,
  client_reference_id:account.id,customer:'cus_synthetic',
  metadata:{seva_user_id:account.id,seva_plan:plan,seva_price_id:planIds[plan]}
 }}};
}
test('G3.1 paid TEST buyer grants only buyer plan and not ecommerce access',()=>{
 const {store,buyer,seller}=state();
 checkout(store,buyer,'cs_buyer','buyer_annual');
 assert.equal(store.processStripeEvent(paid('evt_buyer','cs_buyer',buyer,'buyer_annual','sub_buyer')),'enabled');
 assert.equal(store.hasPlanAccess(buyer.id,'buyer_annual'),true);
 assert.equal(store.hasPlanAccess(buyer.id,'ecommerce_annual'),false);
 assert.equal(store.hasPlanAccess(seller.id,'buyer_annual'),false);
 assert.deepEqual(store.activePlans(buyer.id),['buyer_annual']);
});
test('G3.2 a forged price, plan or owner metadata cannot grant access',()=>{
 for(const field of ['seva_price_id','seva_plan','seva_user_id']){
  const {store,buyer}=state();checkout(store,buyer,'cs_buyer','buyer_annual');
  const evt=paid('evt_bad_'+field,'cs_buyer',buyer,'buyer_annual','sub_buyer');
  evt.data.object.metadata[field]='mismatch';
  assert.throws(()=>store.processStripeEvent(evt),/plan\/price\/owner mismatch/);
  assert.deepEqual(store.activePlans(buyer.id),[]);
 }
});
test('G3.3 Checkout binding cannot be rebound to a different owner or price',()=>{
 const {store,buyer,seller}=state();checkout(store,buyer,'cs_one','buyer_annual');
 assert.throws(()=>store.recordCheckout(seller.id,'cs_one','ecommerce_annual',planIds.ecommerce_annual),/another owner/);
 assert.throws(()=>store.recordCheckout(buyer.id,'cs_one','ecommerce_annual',planIds.ecommerce_annual),/binding mismatch/);
 assert.throws(()=>store.recordCheckout(buyer.id,'cs_missing','buyer_annual',null),/binding invalid/);
});
test('G3.4 unpaid checkout cannot activate any plan',()=>{
 const {store,buyer}=state();checkout(store,buyer,'cs_unpaid','buyer_annual');
 const evt=paid('evt_unpaid','cs_unpaid',buyer,'buyer_annual','sub_unpaid');
 evt.data.object.payment_status='unpaid';
 assert.equal(store.processStripeEvent(evt),'recorded');
 assert.deepEqual(store.activePlans(buyer.id),[]);
});
test('G3.5 repeat webhook stays idempotent',()=>{
 const {store,buyer}=state();checkout(store,buyer,'cs_one','buyer_annual');
 const evt=paid('evt_first','cs_one',buyer,'buyer_annual','sub_first');
 assert.equal(store.processStripeEvent(evt),'enabled');
 assert.equal(store.processStripeEvent(evt),'duplicate');
 assert.deepEqual(store.activePlans(buyer.id),['buyer_annual']);
});
test('G3.6 cancellation of buyer plan does not revoke independent ecommerce plan',()=>{
 const {store,buyer}=state();
 checkout(store,buyer,'cs_buy','buyer_annual');
 checkout(store,buyer,'cs_sell','ecommerce_annual');
 store.processStripeEvent(paid('evt_a','cs_buy',buyer,'buyer_annual','sub_a'));
 store.processStripeEvent(paid('evt_b','cs_sell',buyer,'ecommerce_annual','sub_b'));
 assert.deepEqual(store.activePlans(buyer.id),['buyer_annual','ecommerce_annual']);
 assert.equal(store.processStripeEvent({id:'evt_cancel',type:'customer.subscription.deleted',data:{object:{id:'sub_a'}}}),'disabled');
 assert.equal(store.hasPlanAccess(buyer.id,'buyer_annual'),false);
 assert.equal(store.hasPlanAccess(buyer.id,'ecommerce_annual'),true);
 assert.equal(store.hasAccess(buyer.id),true);
});
test('G3.7 invoice failure and renewal affect only the exact subscription',()=>{
 const {store,buyer}=state();checkout(store,buyer,'cs_buy','buyer_annual');
 store.processStripeEvent(paid('evt_a','cs_buy',buyer,'buyer_annual','sub_a'));
 const fail={id:'evt_fail',type:'invoice.payment_failed',data:{object:{parent:{subscription_details:{subscription:'sub_a'}}}}};
 assert.equal(store.processStripeEvent(fail),'disabled');
 assert.equal(store.hasPlanAccess(buyer.id,'buyer_annual'),false);
 assert.equal(store.processStripeEvent({id:'evt_pay',type:'invoice.paid',data:{object:{parent:{subscription_details:{subscription:'sub_a'}}}}}),'enabled');
 assert.equal(store.hasPlanAccess(buyer.id,'buyer_annual'),true);
});
test('G3.8 delayed cancellation of superseded subscription cannot revoke replacement',()=>{
 const {store,buyer}=state();
 checkout(store,buyer,'cs_old','buyer_annual');
 checkout(store,buyer,'cs_new','buyer_annual');
 store.processStripeEvent(paid('evt_old','cs_old',buyer,'buyer_annual','sub_old'));
 store.processStripeEvent(paid('evt_new','cs_new',buyer,'buyer_annual','sub_new'));
 assert.equal(store.processStripeEvent({id:'evt_old_cancel',type:'customer.subscription.deleted',data:{object:{id:'sub_old'}}}),'recorded');
 assert.equal(store.hasPlanAccess(buyer.id,'buyer_annual'),true);
});
test('G3.9 actual TEST buyer annual product metadata.plan is valid, but mismatched metadata fails',()=>{
 const product={id:'prod_TESTbuyer',active:true,metadata:{app:'SEVA',plan:'buyer_annual',purpose:'black_box_test'}};
 const price={id:'price_TESTbuyer',active:true,product:'prod_TESTbuyer',currency:'eur',unit_amount:5000,type:'recurring',recurring:{interval:'year',interval_count:1,usage_type:'licensed'}};
 assert.equal(validateAnnualPlan('buyer',price,product,price.id,product.id),true);
 assert.throws(()=>validateAnnualPlan('buyer',price,{...product,metadata:{...product.metadata,plan:'ecommerce_annual'}},price.id,product.id));
});

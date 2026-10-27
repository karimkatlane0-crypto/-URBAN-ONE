import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../core.mjs';
import {validateItalianIban,bankConfig} from '../bank-transfer.mjs';
const iban=['IT60','X0542811101','000000123456'].join('');
const env={SEVA_BANK_ORDERS_ENABLED:'true',SEVA_BANK_LIVE_APPROVED:'true',SEVA_PAYMENT_METHOD:'sepa',SEVA_BANK_IBAN:iban,SEVA_BANK_BENEFICIARY:'SEVA TEST — NON INVIARE FONDI',SEVA_BANK_TERMS_URL:'https://seva.example.invalid/terms',SEVA_BANK_PRIVACY_URL:'https://seva.example.invalid/privacy'};
const customer=()=>{const store=createStore(':memory:');const user=store.register('example@unit.invalid','SyntheticPasswordSecret-123');return {store,user};};
test('IBAN Italian checksum required; account suffix is never enough',()=>{
 assert.equal(validateItalianIban(iban),true);
 assert.equal(validateItalianIban('003986'),false);
 assert.equal(validateItalianIban(iban.replace('IT60','IT61')),false);
 assert.equal(bankConfig({}).enabled,false);
 assert.equal(bankConfig(env).enabled,true);
 assert.equal(bankConfig({ ...env,SEVA_BANK_LIVE_APPROVED:'false'}).enabled,false);
});
test('new SEPA order remains pending and grants no paid access',()=>{
 const {store,user}=customer();
 const o=store.bank.place(user.id,'enterprise_monthly',true,env);
 assert.equal(o.amountCents,5000);
 assert.equal(o.status,'pending');assert.equal(o.accessGranted,false);
 assert.equal(store.hasAccess(user.id),false);
 assert.equal(store.bank.list(user.id).length,1);
});
test('bank orders require explicit acceptance and approved setup',()=>{
 const {store,user}=customer();
 assert.throws(()=>store.bank.place(user.id,'enterprise_monthly',false,env),e=>e.status===400);
 assert.throws(()=>store.bank.place(user.id,'enterprise_monthly',true,{}),e=>e.status===503);
 assert.throws(()=>store.bank.place(user.id,'missing',true,env),e=>e.status===400);
});
test('customer B cannot inspect customer A bank orders',()=>{
 const {store,user}=customer();
 const second=store.register('another@unit.invalid','SyntheticPasswordSecret-123');
 store.bank.place(user.id,'enterprise_monthly',true,env);
 assert.deepEqual(store.bank.list(second.id),[]);
 assert.equal(store.hasAccess(second.id),false);
});
test('credit proof is never accepted by the customer: only independently verified operator reconciliation',()=>{
 const {store,user}=customer();
 const o=store.bank.place(user.id,'enterprise_monthly',true,env);
 const req={orderId:o.id,amountCents:5000,bankTransactionReference:'STATEMENT-ID-SYNTHETIC-001',operator:'independent-tester'};
 assert.throws(()=>store.bank.reconcile({...req,statementVerified:false}));
 assert.throws(()=>store.bank.reconcile({...req,statementVerified:true,amountCents:4999}),e=>e.status===409);
 assert.equal(store.hasAccess(user.id),false);
 const confirmed=store.bank.reconcile({...req,statementVerified:true});
 assert.equal(confirmed.status,'credited');
 assert.equal(store.hasAccess(user.id),true);
 assert.equal(store.hasPlanAccess(user.id,'enterprise_monthly'),true);
 assert.throws(()=>store.bank.reconcile({...req,statementVerified:true}),e=>e.status===409);
});
test('a bank statement reference can activate only one order',()=>{
 const {store,user}=customer();
 const a=store.bank.place(user.id,'buyer_annual',true,env);
 const b=store.bank.place(user.id,'buyer_annual',true,env);
 store.bank.reconcile({orderId:a.id,amountCents:5000,bankTransactionReference:'BANK-STATEMENT-SYNTHETIC-9',operator:'tester',statementVerified:true});
 assert.throws(()=>store.bank.reconcile({orderId:b.id,amountCents:5000,bankTransactionReference:'BANK-STATEMENT-SYNTHETIC-9',operator:'tester',statementVerified:true}),e=>e.status===409);
});
test('SEPA access cannot be granted by Stripe checkout callback or browser state',()=>{
 const {store,user}=customer();
 store.bank.place(user.id,'ecommerce_annual',true,env);
 assert.equal(store.activePlans(user.id).length,0);
 assert.equal(store.bank.accessiblePlans(user.id).length,0);
});

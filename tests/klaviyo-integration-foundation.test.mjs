import test from 'node:test';
import assert from 'node:assert/strict';
import {createKlaviyoPKCE,buildKlaviyoAuthorizationUrl,createKlaviyoOAuthClient,KLAVIYO_READ_SCOPES} from '../packages/integrations/klaviyo/oauth.mjs';
import {mapSynapsyProfile,isKlaviyoMarketingConsentValid,buildKlaviyoEvent} from '../packages/integrations/klaviyo/mapping.mjs';

const goodConsent={email:{granted:true,status:'granted',source:'synapsy-consent-ledger',method:'double_opt_in',evidenceId:'consent-proof-001',occurredAt:'2026-11-19T10:00:00Z'}};

test('PKCE creates S256 challenge and high entropy verifier',()=>{
 const p=createKlaviyoPKCE();assert.ok(p.verifier.length>=43&&p.verifier.length<=128);
 assert.match(p.challenge,/^[A-Za-z0-9_-]+$/);assert.ok(p.state.length>=32);
});
test('authorization URL pins redirect, scopes, state and S256',()=>{
 const p=createKlaviyoPKCE(),url=new URL(buildKlaviyoAuthorizationUrl({clientId:'client',redirectUri:'https://seva.example/oauth/callback',pkce:p}));
 assert.equal(url.origin,'https://www.klaviyo.com');assert.equal(url.searchParams.get('code_challenge_method'),'S256');
 assert.equal(url.searchParams.get('state'),p.state);assert.equal(url.searchParams.get('redirect_uri'),'https://seva.example/oauth/callback');
 assert.equal(url.searchParams.get('scope'),KLAVIYO_READ_SCOPES.join(' '));
});
test('authorization rejects missing PKCE context and empty scopes',()=>{
 assert.throws(()=>buildKlaviyoAuthorizationUrl({clientId:'x',redirectUri:'https://x.test/cb'}));
 assert.throws(()=>buildKlaviyoAuthorizationUrl({clientId:'x',redirectUri:'https://x.test/cb',pkce:createKlaviyoPKCE(),scopes:[]}));
});
test('OAuth code exchange uses provider token host, Basic auth and form encoding',async()=>{
 let call;const client=createKlaviyoOAuthClient({clientId:'id',clientSecret:'secret',redirectUri:'https://seva.test/cb',fetchImpl:async(url,options)=>{call={url,options};return new Response(JSON.stringify({access_token:'synthetic'}),{status:200});}});
 const result=await client.exchangeCode({code:'code',codeVerifier:'verifier'});
 assert.equal(result.access_token,'synthetic');assert.equal(call.url,'https://a.klaviyo.com/oauth/token');
 assert.equal(call.options.method,'POST');assert.match(call.options.headers.authorization,/^Basic /);
 assert.equal(call.options.body.get('grant_type'),'authorization_code');assert.equal(call.options.body.get('code_verifier'),'verifier');
});
test('refresh and revoke use official a.klaviyo.com endpoints',async()=>{
 const urls=[];const client=createKlaviyoOAuthClient({clientId:'id',clientSecret:'secret',redirectUri:'https://seva.test/cb',fetchImpl:async(url)=>{urls.push(url);return new Response('{}',{status:200});}});
 await client.refresh('refresh');await client.revoke('refresh');
 assert.deepEqual(urls,['https://a.klaviyo.com/oauth/token','https://a.klaviyo.com/oauth/revoke']);
});
test('API adapter is GET-only and rejects non-relative or non-api paths',async()=>{
 let call;const client=createKlaviyoOAuthClient({clientId:'id',clientSecret:'secret',redirectUri:'https://seva.test/cb',fetchImpl:async(url,options)=>{call={url,options};return new Response('{"data":[]}',{status:200});}});
 const result=await client.get({accessToken:'token',path:'/api/accounts/'});
 assert.deepEqual(result,{data:[]});assert.equal(call.options.method,'GET');assert.equal(call.url,'https://a.klaviyo.com/api/accounts/');
 await assert.rejects(()=>client.get({accessToken:'token',path:'https://evil.test/api/accounts'}));
 await assert.rejects(()=>client.get({accessToken:'token',path:'/oauth/revoke'}));
});
test('SYNAPSY mapping uses opaque external ID and tenant metadata only',()=>{
 const mapped=mapSynapsyProfile({customer_id:'cus_opaque_01',tenant_id:'tenant_01',email:'TEST@EXAMPLE.COM',phone_e164:'+393331234567',first_name:'Ada',bank_account:'do-not-copy'});
 assert.equal(mapped.external_id,'cus_opaque_01');assert.equal(mapped.email,'test@example.com');
 assert.equal(mapped.properties.synapsy_tenant_id,'tenant_01');assert.equal('bank_account' in mapped,false);
});
test('mapping fails closed without stable customer and tenant IDs',()=>{
 assert.throws(()=>mapSynapsyProfile({email:'test@example.com'}));
});
test('consent requires explicit channel grant and evidence',()=>{
 assert.equal(isKlaviyoMarketingConsentValid(goodConsent),true);
 assert.equal(isKlaviyoMarketingConsentValid(null),false);
 assert.equal(isKlaviyoMarketingConsentValid({email:{granted:true,status:'granted'}}),false);
 assert.equal(isKlaviyoMarketingConsentValid({email:{...goodConsent.email,revokedAt:'2026-11-20T00:00:00Z'}}),false);
 assert.equal(isKlaviyoMarketingConsentValid({email:{...goodConsent.email,suppressed:true}}),false);
});
test('future-dated and expired consent are denied',()=>{
 assert.equal(isKlaviyoMarketingConsentValid({email:{...goodConsent.email,occurredAt:'2099-01-01T00:00:00Z'}}),false);
 assert.equal(isKlaviyoMarketingConsentValid({email:{...goodConsent.email,expiresAt:'2020-01-01T00:00:00Z'}}),false);
});
test('event envelope is idempotent, tenant-scoped and consent-gated',()=>{
 const event=buildKlaviyoEvent({tenantId:'tenant_01',customerId:'cus_01',eventId:'evt_001',eventName:'SEVA Activity',eventTime:'2026-11-20T10:00:00Z',properties:{kind:'demo'},consent:goodConsent});
 assert.equal(event.unique_id,'evt_001');assert.equal(event.profile.external_id,'cus_01');
 assert.equal(event.properties.synapsy_tenant_id,'tenant_01');assert.throws(()=>buildKlaviyoEvent({tenantId:'t',customerId:'c',eventId:'e',eventName:'n',eventTime:'2026-11-20T10:00:00Z',consent:null}),/MARKETING_CONSENT_NOT_VERIFIED/);
});

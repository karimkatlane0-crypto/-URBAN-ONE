import test from 'node:test';
import assert from 'node:assert/strict';
import {mlsRoute,mlsProviderStatus} from '../mls-adapter.mjs';
const url='/api/v1/real-estate/mls/properties';
test('MLS access requires SEVA session',()=>assert.throws(()=>mlsRoute({method:'GET',path:url,user:null,env:{}}),{status:401}));
test('MLS disabled without licensed provider',()=>{const r=mlsRoute({method:'GET',path:url,user:{id:'a'},env:{}});assert.equal(r.status,503);assert.deepEqual(r.data.properties,[]);});
test('configuration does not imply MLS connection',()=>{const env={KKUBERA_MLS_API_BASE_URL:'https://mls.example.org',KKUBERA_MLS_ACCESS_TOKEN:'test',KKUBERA_MLS_LICENSE_APPROVED:'true'};assert.equal(mlsProviderStatus(env).connected,false);assert.equal(mlsRoute({method:'GET',path:url,user:{id:'a'},env}).status,503);});
test('invalid insecure MLS origin rejected',()=>assert.equal(mlsProviderStatus({KKUBERA_MLS_API_BASE_URL:'http://localhost',KKUBERA_MLS_ACCESS_TOKEN:'test'}).configured,false));
test('status does not expose MLS token',()=>{const r=mlsRoute({method:'GET',path:'/api/v1/real-estate/mls/status',user:{id:'a'},env:{KKUBERA_MLS_ACCESS_TOKEN:'secret'}});assert.equal(JSON.stringify(r).includes('secret'),false);});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../core.mjs';
import {createNotificationCenter} from '../notification-center.mjs';

function setup(){
 const store=createStore();
 const a=store.register('notice-a@example.invalid','LongSyntheticPassword-First');
 const b=store.register('notice-b@example.invalid','LongSyntheticPassword-Second');
 return {a,b,inbox:createNotificationCenter(store)};
}
const goalA='1c93ab42-8a1c-45d6-ac34-aaaabaab1234';
test('notification consent defaults off, and unsolicited events are not recorded',()=>{
 const {a,inbox}=setup();
 assert.deepEqual(inbox.prefs(a.id),{inApp:false,browser:false,whatsAppAutomatic:false,backgroundPush:false});
 assert.equal(inbox.publishGoal(a.id,goalA,'done'),false);
 assert.equal(inbox.list(a.id).notifications.length,0);
});
test('per-account opt-in publishes generic alerts without identifying goal text',()=>{
 const {a,b,inbox}=setup();
 assert.equal(inbox.setPrefs(a.id,{inApp:true,browser:false}).inApp,true);
 assert.equal(inbox.publishGoal(a.id,goalA,'done'),true);
 assert.equal(inbox.list(a.id).unread,1);
 assert.equal(inbox.list(b.id).unread,0);
 assert.equal(JSON.stringify(inbox.list(a.id)).includes(goalA),false);
});
test('browser opt-in cannot bypass the in-app opt-in',()=>{
 const {a,inbox}=setup();
 assert.throws(()=>inbox.setPrefs(a.id,{inApp:false,browser:true}),/opt-in/);
 assert.throws(()=>inbox.setPrefs(a.id,{inApp:'true',browser:true}),/boolean/);
 assert.equal(inbox.setPrefs(a.id,{inApp:true,browser:true}).backgroundPush,false);
});
test('acknowledge notification requires its owner, repeats idempotently',()=>{
 const {a,b,inbox}=setup();inbox.setPrefs(a.id,{inApp:true,browser:false});
 inbox.publishGoal(a.id,goalA,'blocked');
 const id=inbox.list(a.id).notifications[0].id;
 assert.throws(()=>inbox.acknowledge(b.id,id),/not found/);
 assert.deepEqual(inbox.acknowledge(a.id,id),{ok:true});
 assert.equal(inbox.list(a.id).unread,0);
 assert.equal(inbox.acknowledge(a.id,id).ok,true);
});
test('revocation deletes all owner notices and resets preferences without affecting another user',()=>{
 const {a,b,inbox}=setup();
 inbox.setPrefs(a.id,{inApp:true,browser:false});
 inbox.setPrefs(b.id,{inApp:true,browser:false});
 inbox.publishGoal(a.id,goalA,'done');inbox.publishGoal(b.id,goalA,'blocked');
 assert.equal(inbox.erase(a.id).deleted,true);
 assert.equal(inbox.prefs(a.id).inApp,false);
 assert.equal(inbox.list(a.id).notifications.length,0);
 assert.equal(inbox.list(b.id).notifications.length,1);
});
test('non-event status and malformed goal ID never issue alert',()=>{
 const {a,inbox}=setup();inbox.setPrefs(a.id,{inApp:true,browser:false});
 assert.equal(inbox.publishGoal(a.id,goalA,'todo'),false);
 assert.throws(()=>inbox.publishGoal(a.id,'../../secrets','done'),/Invalid goal ID/);
});

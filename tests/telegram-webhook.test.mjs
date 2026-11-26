import test from 'node:test';
import assert from 'node:assert/strict';
import {handleTelegramWebhook} from '../services/api/telegram-webhook.mjs';
const secret='test_telegram_webhook_secret_value_1234567890';
const headers={'x-telegram-bot-api-secret-token':secret};
const update={update_id:42,message:{message_id:7,chat:{id:123},from:{id:456},text:'Hello'}};
const rawBody=Buffer.from(JSON.stringify(update));

test('rejects missing and incorrect Telegram webhook secrets',async()=>{
 assert.equal(await handleTelegramWebhook({rawBody,headers:{},env:{TELEGRAM_WEBHOOK_SECRET:secret}}).status,401);
 assert.equal(handleTelegramWebhook({rawBody,headers:{...headers,'x-telegram-bot-api-secret-token':'wrong'},env:{TELEGRAM_WEBHOOK_SECRET:secret}}).status,401);
});
test('rejects short configured secrets',async()=>{
 assert.equal(handleTelegramWebhook({rawBody,headers:{'x-telegram-bot-api-secret-token':'short'},env:{TELEGRAM_WEBHOOK_SECRET:'short'}}).status,401);
});
test('rejects malformed JSON and invalid update identifiers',async()=>{
 assert.equal(handleTelegramWebhook({rawBody:Buffer.from('{'),headers,env:{TELEGRAM_WEBHOOK_SECRET:secret}}).status,400);
 assert.equal(handleTelegramWebhook({rawBody:Buffer.from('{}'),headers,env:{TELEGRAM_WEBHOOK_SECRET:secret}}).status,400);
});
test('requires a durable store',async()=>{
 assert.equal(handleTelegramWebhook({rawBody,headers,env:{TELEGRAM_WEBHOOK_SECRET:secret}}).status,503);
});
test('normalizes an update and delegates atomic idempotency to the durable store',async()=>{
 let captured; const store={process(id,envelope){captured={id,envelope};return {duplicate:false};}};
 const result=handleTelegramWebhook({rawBody,headers,env:{TELEGRAM_WEBHOOK_SECRET:secret,telegramUpdateStore:store}});
 assert.equal(result.status,200); assert.equal(result.body.duplicate,false); assert.equal(captured.id,42);
 assert.equal(captured.envelope.provider,'telegram'); assert.equal(captured.envelope.chatId,'123');
 assert.equal(captured.envelope.senderId,'456'); assert.equal(captured.envelope.text,'Hello');
});
test('acknowledges duplicate update IDs reported by the durable store',async()=>{
 const store={process(){return {duplicate:true};}};
 const result=handleTelegramWebhook({rawBody,headers,env:{TELEGRAM_WEBHOOK_SECRET:secret,telegramUpdateStore:store}});
 assert.equal(result.status,200); assert.equal(result.body.duplicate,true);
});
test('ignores unsupported update shapes without writing customer data',async()=>{
 const result=handleTelegramWebhook({rawBody:Buffer.from(JSON.stringify({update_id:43,inline_query:{id:'q'}})),headers,env:{TELEGRAM_WEBHOOK_SECRET:secret}});
 assert.deepEqual(result.body,{ok:true,ignored:true});
});
import {timingSafeEqual} from 'node:crypto';

function secretMatches(expected, supplied) {
  if (typeof expected !== 'string' || expected.length < 32 || typeof supplied !== 'string') return false;
  const a=Buffer.from(expected,'utf8'), b=Buffer.from(supplied,'utf8');
  return a.length===b.length && timingSafeEqual(a,b);
}

function normalizeUpdate(update) {
  const message=update.message || update.edited_message || update.channel_post || null;
  const callback=update.callback_query || null;
  const source=message || callback?.message || null;
  const chatId=source?.chat?.id;
  if (chatId===undefined || chatId===null) return null;
  const text=typeof message?.text==='string' ? message.text : typeof callback?.data==='string' ? callback.data : '';
  return {provider:'telegram',updateId:update.update_id,chatId:String(chatId),senderId:source?.from?.id===undefined?null:String(source.from.id),messageId:source?.message_id===undefined?null:String(source.message_id),kind:callback?'callback':message?'message':'unsupported',text:text.slice(0,4096),receivedAt:new Date().toISOString()};
}

// store.process(updateId, envelope) must be a durable, atomic insert-once operation.
// No in-memory fallback: replay protection must survive process restarts.
export async function handleTelegramWebhook({rawBody,headers={},env={}}) {
  const expected=env.TELEGRAM_WEBHOOK_SECRET;
  const supplied=headers['x-telegram-bot-api-secret-token'];
  if (!secretMatches(expected,supplied)) return {status:401,body:{error:'TELEGRAM_WEBHOOK_UNAUTHORIZED'}};
  if (!Buffer.isBuffer(rawBody) || rawBody.length===0 || rawBody.length>65536) return {status:413,body:{error:'TELEGRAM_PAYLOAD_INVALID'}};
  let update;
  try { update=JSON.parse(rawBody.toString('utf8')); } catch { return {status:400,body:{error:'TELEGRAM_JSON_INVALID'}}; }
  if (!update || Array.isArray(update) || typeof update!=='object' || !Number.isSafeInteger(update.update_id) || update.update_id<0) return {status:400,body:{error:'TELEGRAM_UPDATE_INVALID'}};
  const envelope=normalizeUpdate(update);
  if (!envelope) return {status:200,body:{ok:true,ignored:true}};
  const store=env.telegramUpdateStore;
  if (!store || typeof store.process!=='function') return {status:503,body:{error:'TELEGRAM_STORE_UNAVAILABLE'}};
  try {
    const result=await store.process(update.update_id,envelope);
    return {status:200,body:{ok:true,duplicate:Boolean(result?.duplicate)}};
  } catch { return {status:503,body:{error:'TELEGRAM_STORE_UNAVAILABLE'}}; }
}
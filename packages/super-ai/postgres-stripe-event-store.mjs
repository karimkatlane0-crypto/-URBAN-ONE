import { createHash } from 'node:crypto';

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  }
  return value;
}

function eventDigest(event) {
  return createHash('sha256').update(JSON.stringify(canonicalize(event)), 'utf8').digest('hex');
}

/**
 * Durable, minimized Stripe webhook inbox.
 * The complete Stripe event body is deliberately not persisted here. Workers
 * can retrieve the canonical event from Stripe using event_id after verifying
 * the stored signed-delivery receipt and matching livemode/account policy.
 */
export function createPostgresStripeEventStore({ pool } = {}) {
  if (!pool || typeof pool.query !== 'function') throw new Error('STRIPE_EVENT_POOL_REQUIRED');

  return Object.freeze({
    async record(event) {
      if (!event || typeof event.id !== 'string' || !event.id ||
          typeof event.type !== 'string' || !event.type ||
          typeof event.livemode !== 'boolean') {
        throw new Error('STRIPE_EVENT_INVALID');
      }
      const objectId = typeof event.data?.object?.id === 'string' ? event.data.object.id : null;
      const created = Number.isSafeInteger(event.created) && event.created >= 0 ? event.created : null;
      const digest = eventDigest(event);
      const inserted = await pool.query(
        `INSERT INTO super_ai.stripe_webhook_events
          (event_id,event_type,livemode,object_id,event_created_at,payload_sha256)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (event_id) DO NOTHING
         RETURNING event_id`,
        [event.id, event.type, event.livemode, objectId, created, digest]
      );
      if (inserted.rowCount === 1) return Object.freeze({ stored: true, duplicate: false });

      const existing = await pool.query(
        'SELECT event_type,livemode,object_id,payload_sha256 FROM super_ai.stripe_webhook_events WHERE event_id=$1',
        [event.id]
      );
      const row = existing.rows?.[0];
      if (!row || row.event_type !== event.type || row.livemode !== event.livemode ||
          row.object_id !== objectId || row.payload_sha256 !== digest) {
        throw new Error('STRIPE_EVENT_ID_CONFLICT');
      }
      return Object.freeze({ stored: true, duplicate: true });
    }
  });
}

import { randomBytes, randomUUID, createHash } from 'node:crypto';

/* Developer keys are granted only to a Stripe-webhook-verified Enterprise
 * subscriber; no checkout redirect or client metadata grants access. */
export function createDeveloperApi(store, runAI, now = () => Math.floor(Date.now() / 1000)) {
  const db = store.db;
  db.exec("CREATE TABLE IF NOT EXISTS developer_api_keys (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,key_hash TEXT NOT NULL UNIQUE,name TEXT NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL,revoked INTEGER); CREATE INDEX IF NOT EXISTS developer_api_owner ON developer_api_keys(user_id); CREATE TABLE IF NOT EXISTS developer_api_usage (key_id TEXT NOT NULL REFERENCES developer_api_keys(id) ON DELETE CASCADE,minute INTEGER NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(key_id,minute));");
  const hash = value => createHash('sha256').update(value).digest('hex');
  const isSubscriber = userId => store.hasPlanAccess(userId, 'enterprise_monthly');
  function requirePaid(userId) {
    if (!isSubscriber(userId))
      throw Object.assign(Error('Enterprise subscription required for Developer API'), { status: 402 });
  }
  function issueKey(userId, name = 'Developer key') {
    requirePaid(userId);
    name = String(name).trim();
    if (!name || name.length > 60)
      throw Object.assign(Error('Invalid API key label'), { status: 400 });
    const active = db.prepare('SELECT COUNT(*) AS n FROM developer_api_keys WHERE user_id=? AND revoked IS NULL AND expires>?').get(userId, now()).n;
    if (active >= 3)
      throw Object.assign(Error('Maximum three active keys'), { status: 409 });
    const id = randomUUID();
    const secret = 'seva_k_' + randomBytes(32).toString('hex');
    const expires = now() + 90 * 86400;
    db.prepare('INSERT INTO developer_api_keys VALUES (?,?,?,?,?,?,NULL)')
      .run(id, userId, hash(secret), name, now(), expires);
    store.audit(userId, 'developer_key_issued', id);
    return { id, key: secret, name, expires, note: 'Shown once; save privately in a secret manager.' };
  }
  function listKeys(userId) {
    return db.prepare('SELECT id,name,created,expires,revoked FROM developer_api_keys WHERE user_id=? ORDER BY created DESC').all(userId);
  }
  function revokeKey(userId, id) {
    if (!/^[0-9a-f-]{36}$/.test(String(id)))
      throw Object.assign(Error('Invalid key ID'), { status: 400 });
    const update = db.prepare('UPDATE developer_api_keys SET revoked=? WHERE id=? AND user_id=? AND revoked IS NULL')
      .run(now(), id, userId);
    if (update.changes) store.audit(userId, 'developer_key_revoked', id);
    return { revoked: update.changes > 0 };
  }
  function authenticate(header) {
    const token = /^Bearer (seva_k_[a-f0-9]{64})$/.exec(String(header || ''))?.[1];
    if (!token)
      throw Object.assign(Error('Invalid developer API key'), { status: 401 });
    const record = db.prepare('SELECT id,user_id,expires FROM developer_api_keys WHERE key_hash=? AND revoked IS NULL').get(hash(token));
    if (!record || record.expires <= now())
      throw Object.assign(Error('Invalid or expired developer API key'), { status: 401 });
    requirePaid(record.user_id); // Subscription cancellation immediately gates access.
    return record;
  }
  function enforceQuota(keyId) {
    const minute = Math.floor(now() / 60);
    db.exec('BEGIN IMMEDIATE');
    try {
      const used = db.prepare('SELECT count FROM developer_api_usage WHERE key_id=? AND minute=?')
        .get(keyId, minute)?.count || 0;
      if (used >= 6)
        throw Object.assign(Error('API limit: 6 requests per minute'), { status: 429 });
      db.prepare('INSERT INTO developer_api_usage(key_id,minute,count) VALUES (?,?,1) ON CONFLICT(key_id,minute) DO UPDATE SET count=count+1').run(keyId, minute);
      db.prepare('DELETE FROM developer_api_usage WHERE minute<?').run(minute - 1440);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  async function generate(header, input) {
    const record = authenticate(header);
    if (input?.consent !== true)
      throw Object.assign(Error('Explicit AI processing consent required'), { status: 400 });
    const prompt = typeof input?.prompt === 'string' ? input.prompt.trim() : '';
    if (!prompt || prompt.length > 2000)
      throw Object.assign(Error('Prompt must be 1–2000 characters'), { status: 400 });
    enforceQuota(record.id);
    const user = db.prepare('SELECT id,email FROM users WHERE id=?').get(record.user_id);
    if (!user) throw Object.assign(Error('Account unavailable'), { status: 401 });
    const response = await runAI(user, prompt);
    return {
      ...response,
      billedAccess: true,
      usage: { requestCount: 1 },
      notice: 'A SEVA subscription does not grant ChatGPT, Claude or Gemini consumer account access.'
    };
  }
  return { issueKey, listKeys, revokeKey, authenticate, generate, isSubscriber };
}

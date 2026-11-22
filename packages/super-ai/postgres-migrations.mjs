import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const MIGRATION_NAME = /^(\d{4,})_([a-z0-9][a-z0-9_-]*)\.(up|down)\.sql$/;
const LOCK_NAMESPACE = 0x53555045;
const LOCK_RESOURCE = 0x52414931;

export function parseMigrationFilename(filename) {
  const match = MIGRATION_NAME.exec(filename);
  if (!match) return null;
  return Object.freeze({ id: match[1], name: match[2], direction: match[3] });
}

export function migrationChecksum(sql) {
  return createHash('sha256').update(sql, 'utf8').digest('hex');
}

async function loadMigrations(directory, direction) {
  const names = (await readdir(directory)).sort();
  const parsed = names.map(filename => ({ filename, meta: parseMigrationFilename(filename) }))
    .filter(row => row.meta?.direction === direction);
  const ids = new Set();
  const migrations = [];
  for (const row of parsed) {
    if (ids.has(row.meta.id)) throw new Error('MIGRATION_ID_DUPLICATE');
    ids.add(row.meta.id);
    const sql = await readFile(join(directory, row.filename), 'utf8');
    if (!sql.trim()) throw new Error('MIGRATION_EMPTY');
    migrations.push({ ...row.meta, filename: row.filename, sql, checksum: migrationChecksum(sql) });
  }
  return migrations.sort((a, b) => a.id.localeCompare(b.id, 'en'));
}

/**
 * PostgreSQL migration runner. It is deliberately not auto-invoked by any
 * application server. Supply an already-authorized pg Pool/Client-compatible
 * pool. Rollback is opt-in, latest-only and requires allowDestructiveRollback.
 */
export async function runPostgresMigrations({
  pool,
  directory,
  direction = 'up',
  allowDestructiveRollback = false
} = {}) {
  if (!pool || typeof pool.connect !== 'function') throw new Error('POSTGRES_POOL_REQUIRED');
  if (typeof directory !== 'string' || !directory) throw new Error('MIGRATION_DIRECTORY_REQUIRED');
  if (!['up', 'down'].includes(direction)) throw new Error('MIGRATION_DIRECTION_INVALID');
  if (direction === 'down' && allowDestructiveRollback !== true) throw new Error('DESTRUCTIVE_ROLLBACK_NOT_AUTHORIZED');

  const migrations = await loadMigrations(directory, direction);
  const client = await pool.connect();
  const applied = [];
  let locked = false;
  try {
    await client.query('SELECT pg_advisory_lock($1, $2)', [LOCK_NAMESPACE, LOCK_RESOURCE]);
    locked = true;
    await client.query('CREATE SCHEMA IF NOT EXISTS super_ai');
    await client.query(`CREATE TABLE IF NOT EXISTS super_ai.schema_migrations (
      migration_id text PRIMARY KEY,
      migration_name text NOT NULL,
      up_checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);

    for (const migration of migrations) {
      const current = await client.query(
        'SELECT migration_id, migration_name, up_checksum FROM super_ai.schema_migrations WHERE migration_id = $1',
        [migration.id]
      );
      if (direction === 'up') {
        if (current.rowCount) {
          if (current.rows[0].migration_name !== migration.name || current.rows[0].up_checksum !== migration.checksum) {
            throw new Error('MIGRATION_CHECKSUM_MISMATCH:' + migration.id);
          }
          continue;
        }
        await client.query('BEGIN');
        try {
          await client.query(migration.sql);
          await client.query(
            'INSERT INTO super_ai.schema_migrations(migration_id, migration_name, up_checksum) VALUES($1,$2,$3)',
            [migration.id, migration.name, migration.checksum]
          );
          await client.query('COMMIT');
          applied.push(migration.id);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      } else {
        if (!current.rowCount) continue;
        const latest = await client.query('SELECT migration_id FROM super_ai.schema_migrations ORDER BY migration_id DESC LIMIT 1');
        if (latest.rows[0]?.migration_id !== migration.id) throw new Error('ROLLBACK_LATEST_ONLY:' + migration.id);
        await client.query('BEGIN');
        try {
          await client.query(migration.sql);
          await client.query('DELETE FROM super_ai.schema_migrations WHERE migration_id = $1', [migration.id]);
          await client.query('COMMIT');
          applied.push(migration.id);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      }
    }
    return Object.freeze({ direction, applied: Object.freeze(applied), discovered: migrations.length });
  } finally {
    if (locked) {
      try { await client.query('SELECT pg_advisory_unlock($1, $2)', [LOCK_NAMESPACE, LOCK_RESOURCE]); } catch {}
    }
    client.release();
  }
}

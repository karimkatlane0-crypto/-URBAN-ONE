import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const MIGRATION_NAME = /^(\\d{4,})_([a-z0-9][a-z0-9_-]*)\\.(up|down)\\.sql$/;
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

function compareIds(a, b) {
  const left = BigInt(a);
  const right = BigInt(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

async function loadMigrationSet(directory) {
  const names = (await readdir(directory)).sort();
  const files = names.map(filename => ({ filename, meta: parseMigrationFilename(filename) }))
    .filter(row => row.meta);
  const byDirection = { up: new Map(), down: new Map() };

  for (const row of files) {
    const { id, name, direction } = row.meta;
    if (byDirection[direction].has(id)) throw new Error('MIGRATION_ID_DUPLICATE:' + id);
    const sql = await readFile(join(directory, row.filename), 'utf8');
    if (!sql.trim()) throw new Error('MIGRATION_EMPTY:' + id);
    byDirection[direction].set(id, Object.freeze({
      id, name, direction, filename: row.filename, sql, checksum: migrationChecksum(sql)
    }));
  }

  for (const [id, up] of byDirection.up) {
    const down = byDirection.down.get(id);
    if (!down) throw new Error('MIGRATION_DOWN_MISSING:' + id);
    if (down.name !== up.name) throw new Error('MIGRATION_NAME_MISMATCH:' + id);
  }
  for (const [id] of byDirection.down) {
    if (!byDirection.up.has(id)) throw new Error('MIGRATION_UP_MISSING:' + id);
  }

  const up = [...byDirection.up.values()].sort((a, b) => compareIds(a.id, b.id));
  const down = [...byDirection.down.values()].sort((a, b) => compareIds(b.id, a.id));
  return Object.freeze({ up, down });
}

/**
 * PostgreSQL migration runner. It never opens a connection itself and is not
 * auto-invoked by an application server. Supply an already-authorized migration
 * pool. A rollback removes exactly one latest migration per invocation.
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

  const migrationSet = await loadMigrationSet(directory);
  const migrations = migrationSet[direction];
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
      down_checksum text,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    await client.query('ALTER TABLE super_ai.schema_migrations ADD COLUMN IF NOT EXISTS down_checksum text');

    const ledger = await client.query(
      'SELECT migration_id, migration_name, up_checksum, down_checksum FROM super_ai.schema_migrations ORDER BY migration_id'
    );
    const ledgerById = new Map((ledger.rows || []).map(row => [row.migration_id, row]));
    const sourceUpById = new Map(migrationSet.up.map(row => [row.id, row]));
    const sourceDownById = new Map(migrationSet.down.map(row => [row.id, row]));

    for (const row of ledger.rows || []) {
      const source = sourceUpById.get(row.migration_id);
      const down = sourceDownById.get(row.migration_id);
      if (!source || !down) throw new Error('MIGRATION_SOURCE_MISSING:' + row.migration_id);
      if (source.name !== row.migration_name || source.checksum !== row.up_checksum) {
        throw new Error('MIGRATION_CHECKSUM_MISMATCH:' + row.migration_id);
      }
      if (!row.down_checksum || down.checksum !== row.down_checksum) {
        throw new Error('MIGRATION_DOWN_CHECKSUM_MISMATCH:' + row.migration_id);
      }
    }

    if (direction === 'up') {
      for (const migration of migrations) {
        if (ledgerById.has(migration.id)) continue;
        const down = sourceDownById.get(migration.id);
        await client.query('BEGIN');
        try {
          await client.query(migration.sql);
          await client.query(
            'INSERT INTO super_ai.schema_migrations(migration_id, migration_name, up_checksum, down_checksum) VALUES($1,$2,$3,$4)',
            [migration.id, migration.name, migration.checksum, down.checksum]
          );
          await client.query('COMMIT');
          applied.push(migration.id);
          ledgerById.set(migration.id, {
            migration_id: migration.id,
            migration_name: migration.name,
            up_checksum: migration.checksum,
            down_checksum: down.checksum
          });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      }
    } else {
      const latest = [...ledgerById.keys()].sort(compareIds).at(-1);
      if (latest) {
        const migration = sourceDownById.get(latest);
        if (!migration) throw new Error('MIGRATION_DOWN_MISSING:' + latest);
        await client.query('BEGIN');
        try {
          await client.query(migration.sql);
          await client.query('DELETE FROM super_ai.schema_migrations WHERE migration_id = $1', [latest]);
          await client.query('COMMIT');
          applied.push(latest);
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

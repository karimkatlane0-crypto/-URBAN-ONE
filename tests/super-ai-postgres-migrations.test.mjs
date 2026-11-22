import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  migrationChecksum,
  parseMigrationFilename,
  runPostgresMigrations
} from '../packages/super-ai/postgres-migrations.mjs';

test('migration filenames require ordered IDs, safe names and direction', () => {
  assert.deepEqual(parseMigrationFilename('0001_control_plane.up.sql'), {
    id: '0001', name: 'control_plane', direction: 'up'
  });
  assert.equal(parseMigrationFilename('control_plane.up.sql'), null);
  assert.equal(parseMigrationFilename('0001_ControlPlane.up.sql'), null);
  assert.equal(parseMigrationFilename('0001_control_plane.sql'), null);
});

test('migration checksums are stable SHA-256 values', () => {
  const first = migrationChecksum('SELECT 1;');
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first, migrationChecksum('SELECT 1;'));
  assert.notEqual(first, migrationChecksum('SELECT 2;'));
});

test('runner rejects missing pool and unapproved destructive rollback before connecting', async () => {
  await assert.rejects(
    runPostgresMigrations({ directory: '/not-read', direction: 'up' }),
    /POSTGRES_POOL_REQUIRED/
  );
  await assert.rejects(
    runPostgresMigrations({ pool: { connect() { throw new Error('must not connect'); } }, directory: '/not-read', direction: 'down' }),
    /DESTRUCTIVE_ROLLBACK_NOT_AUTHORIZED/
  );
});


function fakePool() {
  const state = { ledger: new Map(), executed: [], released: 0 };
  const client = {
    async query(sql, params = []) {
      const statement = sql.trim();
      if (statement.startsWith('SELECT pg_advisory_lock') || statement.startsWith('SELECT pg_advisory_unlock')) return { rows: [], rowCount: 1 };
      if (statement.startsWith('CREATE SCHEMA') || statement.startsWith('CREATE TABLE') || statement.startsWith('ALTER TABLE')) return { rows: [], rowCount: 0 };
      if (statement.startsWith('SELECT migration_id, migration_name, up_checksum, down_checksum')) {
        const rows = [...state.ledger.values()].sort((a, b) => a.migration_id.localeCompare(b.migration_id));
        return { rows, rowCount: rows.length };
      }
      if (statement === 'BEGIN' || statement === 'COMMIT' || statement === 'ROLLBACK') return { rows: [], rowCount: 0 };
      if (statement.startsWith('INSERT INTO super_ai.schema_migrations')) {
        const [migration_id, migration_name, up_checksum, down_checksum] = params;
        state.ledger.set(migration_id, { migration_id, migration_name, up_checksum, down_checksum });
        return { rows: [], rowCount: 1 };
      }
      if (statement.startsWith('DELETE FROM super_ai.schema_migrations')) {
        state.ledger.delete(params[0]);
        return { rows: [], rowCount: 1 };
      }
      if (statement.startsWith('-- FAIL')) throw new Error('SYNTHETIC_MIGRATION_FAILURE');
      if (statement.startsWith('-- up') || statement.startsWith('-- down')) {
        state.executed.push(statement);
        return { rows: [], rowCount: 0 };
      }
      throw new Error('UNEXPECTED_FAKE_SQL:' + statement.slice(0, 100));
    },
    release() { state.released += 1; }
  };
  return { state, pool: { async connect() { return client; } } };
}

async function withMigrations(files, work) {
  const directory = await mkdtemp(join(tmpdir(), 'super-ai-migrations-'));
  try {
    for (const [name, sql] of Object.entries(files)) await writeFile(join(directory, name), sql, 'utf8');
    return await work(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('runner applies ordered migrations once and rolls back only one latest migration per call', async () => {
  await withMigrations({
    '0001_core.up.sql': '-- up core v1',
    '0001_core.down.sql': '-- down core v1',
    '0002_instances.up.sql': '-- up instances v1',
    '0002_instances.down.sql': '-- down instances v1'
  }, async directory => {
    const fake = fakePool();
    const first = await runPostgresMigrations({ pool: fake.pool, directory });
    assert.deepEqual(first.applied, ['0001', '0002']);
    const replay = await runPostgresMigrations({ pool: fake.pool, directory });
    assert.deepEqual(replay.applied, []);
    const rollbackLatest = await runPostgresMigrations({ pool: fake.pool, directory, direction: 'down', allowDestructiveRollback: true });
    assert.deepEqual(rollbackLatest.applied, ['0002']);
    assert.deepEqual([...fake.state.ledger.keys()], ['0001']);
    const rollbackPrevious = await runPostgresMigrations({ pool: fake.pool, directory, direction: 'down', allowDestructiveRollback: true });
    assert.deepEqual(rollbackPrevious.applied, ['0001']);
    assert.equal(fake.state.ledger.size, 0);
    assert.equal(fake.state.released, 4);
  });
});

test('runner fails closed when an applied migration source or checksum drifts', async () => {
  const fake = fakePool();
  await withMigrations({
    '0001_core.up.sql': '-- up core v1',
    '0001_core.down.sql': '-- down core v1'
  }, async directory => {
    await runPostgresMigrations({ pool: fake.pool, directory });
  });
  await withMigrations({
    '0001_core.up.sql': '-- up core v2',
    '0001_core.down.sql': '-- down core v1'
  }, async directory => {
    await assert.rejects(runPostgresMigrations({ pool: fake.pool, directory }), /MIGRATION_CHECKSUM_MISMATCH:0001/);
  });
  await withMigrations({}, async directory => {
    await assert.rejects(runPostgresMigrations({ pool: fake.pool, directory }), /MIGRATION_SOURCE_MISSING:0001/);
  });
});

test('runner requires paired up/down files with matching migration names', async () => {
  const fake = fakePool();
  await withMigrations({ '0001_core.up.sql': '-- up core' }, async directory => {
    await assert.rejects(runPostgresMigrations({ pool: fake.pool, directory }), /MIGRATION_DOWN_MISSING:0001/);
  });
  await withMigrations({
    '0001_core.up.sql': '-- up core',
    '0001_other.down.sql': '-- down other'
  }, async directory => {
    await assert.rejects(runPostgresMigrations({ pool: fake.pool, directory }), /MIGRATION_NAME_MISMATCH:0001/);
  });
  assert.equal(fake.state.released, 0);
});

test('failed migration rolls back its transaction and does not write the ledger', async () => {
  await withMigrations({
    '0001_core.up.sql': '-- FAIL core',
    '0001_core.down.sql': '-- down core'
  }, async directory => {
    const fake = fakePool();
    await assert.rejects(runPostgresMigrations({ pool: fake.pool, directory }), /SYNTHETIC_MIGRATION_FAILURE/);
    assert.equal(fake.state.ledger.size, 0);
    assert.equal(fake.state.released, 1);
  });
});

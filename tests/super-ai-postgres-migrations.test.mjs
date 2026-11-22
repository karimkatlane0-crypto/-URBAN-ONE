import test from 'node:test';
import assert from 'node:assert/strict';
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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../seva-android/', import.meta.url);
const network = readFileSync(new URL(
  'online-diagnostics/src/main/kotlin/ai/seva/enterprise/diagnostics/NetworkDiagnostics.kt', root), 'utf8');
const ui = readFileSync(new URL(
  'online-diagnostics/src/main/kotlin/ai/seva/enterprise/diagnostics/DiagnosticsDashboard.kt', root), 'utf8');
const manifest = readFileSync(new URL('app/src/main/AndroidManifest.xml', root), 'utf8');
const gradle = readFileSync(new URL('app/build.gradle', root), 'utf8');

test('optional diagnostics cannot silently grant Internet to SEVA offline 2.5', () => {
  assert.doesNotMatch(manifest, /android.permission.INTERNET/);
  assert.doesNotMatch(manifest, /POST_NOTIFICATIONS/);
  assert.doesNotMatch(gradle, /online-diagnostics/);
  assert.match(gradle, /applicationId 'ai.seva.enterprise.local.v25'/);
});

test('network diagnostics logs no full URL, query, payload or secrets', () => {
  assert.match(network, /request.url.host/);
  assert.doesNotMatch(network, /request.url.toString\(/);
  assert.doesNotMatch(network, /encodedQuery|request.header|request.body|response.body/);
  assert.match(network, /NetworkErrorLogEntity/);
  assert.match(network, /errorCategory/);
});

test('threshold is transactional, alerts on crossing only and notification is completed', () => {
  assert.match(network, /database.withTransaction/);
  assert.match(network, /before < CRITICAL_THRESHOLD && after >= CRITICAL_THRESHOLD/);
  assert.match(network, /setContentIntent\(pendingIntent\)/);
  assert.match(network, /\.setAutoCancel\(true\)/);
  assert.match(network, /\.notify\(NOTIFICATION_ID, notification\)/);
  assert.match(network, /Manifest.permission.POST_NOTIFICATIONS/);
  assert.match(network, /areNotificationsEnabled/);
});

test('network diagnostics preserve HTTP response semantics and user opt-in', () => {
  assert.match(network, /response.code == 429 \|\| response.code >= 500/);
  assert.match(network, /catch \(error: IOException\)/);
  assert.match(network, /throw error/);
  assert.match(ui, /collectAsStateWithLifecycle/);
  assert.match(ui, /ActivityResultContracts.RequestPermission/);
  assert.match(ui, /Button\(onClick =/);
});

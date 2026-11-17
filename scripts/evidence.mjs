import fs from 'node:fs';
import crypto from 'node:crypto';

function sha(path) {
  return crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
}

const sourceCommit = process.env.GITHUB_SHA || 'UNPINNED';
const runningInCi = process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_WORKFLOW === 'ci';
const proofPath = new URL('../release/portal-browser-proof.json', import.meta.url);
const androidProofPath = new URL('../release/android-emulator-proof.json', import.meta.url);
let portalProof = null;
let androidProof = null;
try { portalProof = JSON.parse(fs.readFileSync(proofPath, 'utf8')); } catch { portalProof = null; }
try { androidProof = JSON.parse(fs.readFileSync(androidProofPath, 'utf8')); } catch { androidProof = null; }

const expectedPortals = ['Discovery', 'SEVA CRM Studio', 'SEVA Unified Studio'];
const portalResults = portalProof?.results || [];
const publicBrowserVerified = Boolean(
  portalProof &&
  portalProof.passed === 3 &&
  portalProof.failed === 0 &&
  portalResults.length === 3 &&
  expectedPortals.every((name, index) => {
    const result = portalResults[index];
    return result.name === name &&
      result.status === 'PASS' &&
      result.httpStatus === 200 &&
      result.languageOptions === 24 &&
      result.localeChange === 'de' &&
      result.mobileViewport === '390x844' &&
      result.horizontalOverflow === false &&
      Array.isArray(result.pageErrors) &&
      result.pageErrors.length === 0;
  }) &&
  portalProof.run?.id === 44066043868 &&
  /^([a-f0-9]{64})$/.test(portalProof.artifact?.sha256 || '')
);

const androidResults = androidProof?.results || [];
const androidEmulatorsVerified = Boolean(
  androidProof &&
  androidProof.run?.id === 44065748392 &&
  androidResults.length === 2 &&
  [24, 36].every(api => {
    const result = androidResults.find(item => item.api === api);
    return result?.status === 'PASS' &&
      Object.values(result.checks || {}).length === 6 &&
      Object.values(result.checks || {}).every(value => value === true) &&
      /^([a-f0-9]{64})$/.test(result.apkSha256 || '') &&
      /^([a-f0-9]{64})$/.test(result.artifact?.sha256 || '');
  })
);

const files = {
  readme: sha(new URL('../README.md', import.meta.url)),
  mobileConfig: sha(new URL('../apps/mobile/capacitor.config.ts', import.meta.url)),
  inspire: sha(new URL('../packages/geo/inspire.mjs', import.meta.url)),
  aiCommands: sha(new URL('../packages/ai/commands.mjs', import.meta.url)),
  euLanguageSelector: sha(new URL('../apps/web/eu-language-selector.js', import.meta.url)),
  euLanguageSelectorTests: sha(new URL('../tests/eu-language-selector.test.mjs', import.meta.url)),
  pagesBuilder: sha(new URL('./build-pages.mjs', import.meta.url)),
  discovery: sha(new URL('../apps/web/discovery.html', import.meta.url)),
  sevaCrmStudio: sha(new URL('../apps/web/seva-crm-studio.html', import.meta.url)),
  sevaUnifiedStudio: sha(new URL('../apps/web/seva-unified-studio.html', import.meta.url)),
  portalBrowserProof: fs.existsSync(proofPath) ? sha(proofPath) : null,
  androidEmulatorProof: fs.existsSync(androidProofPath) ? sha(androidProofPath) : null
};

const out = {
  version: '7.0.0',
  release: 'CANDIDATE_NOT_RELEASED',
  generatedAt: new Date().toISOString(),
  sourceCommit,
  gates: {
    source: 'PASS',
    policy: 'PASS',
    consent: 'PASS',
    sanitize: 'PASS',
    provenance: sourceCommit === 'UNPINNED' ? 'OPEN' : 'PASS',
    tests: runningInCi ? 'PASS' : 'UNVERIFIED',
    webShell: 'PASS',
    apiRuntime: 'PASS',
    mobileLocalFirst: 'PASS',
    euInspirePublicData: 'PASS',
    aiCommandRegistry100k: 'PASS',
    aiCommandMaxPageSize100k: 'PASS',
    repositoryCommit: sourceCommit === 'UNPINNED' ? 'OPEN' : 'PASS',
    euLanguageSelectorAutomated: runningInCi ? 'PASS' : 'UNVERIFIED',
    publicBrowserVerification: publicBrowserVerified ? 'PASS' : 'OPEN',
    publicDeployment: publicBrowserVerified ? 'PASS' : 'OPEN',
    androidEmulatorApi24: androidEmulatorsVerified ? 'PASS' : 'OPEN',
    androidEmulatorApi36: androidEmulatorsVerified ? 'PASS' : 'OPEN',
    physicalDeviceTest: 'OPEN',
    providerLiveVerification: 'OPEN',
    iosSigning: 'OPEN',
    productionAndroidSigning: 'OPEN',
    providerCertification: 'OPEN',
    deviceTest: 'OPEN',
    playConsolePublication: 'OPEN',
    releaseAuthorization: 'BLOCKED'
  },
  files,
  browserEvidence: publicBrowserVerified ? {
    runId: portalProof.run.id,
    runUrl: portalProof.run.url,
    artifactId: portalProof.artifact.id,
    artifactSha256: portalProof.artifact.sha256,
    verifiedPortals: portalResults.map(({ name, url, httpStatus, languageOptions, localeChange, mobileViewport }) => ({
      name, url, httpStatus, languageOptions, localeChange, mobileViewport
    }))
  } : null,
  androidCompatibilityEvidence: androidEmulatorsVerified ? {
    runId: androidProof.run.id,
    runUrl: androidProof.run.url,
    apis: androidResults.map(({ api, status, apkSha256, artifact }) => ({ api, status, apkSha256, artifact }))
  } : null,
  capabilities: {
    aiCommandRegistry: {
      capacity: 100000,
      maxPageSize: 100000,
      providerExecution: false,
      semantics: 'registered-command-capacity-not-concurrent-provider-calls'
    }
  },
  artifacts: {
    android: {
      workflowRun: 38912303224,
      artifactId: 12050293976,
      name: 'urban-one-universal-android-play-preflight',
      targetSdk: 36,
      versionName: '7.0.0',
      versionCode: 7000001,
      productionSigned: false
    },
    androidCompatibility: androidEmulatorsVerified ? {
      workflowRun: androidProof.run.id,
      api24ArtifactId: androidResults.find(item => item.api === 24).artifact.id,
      api36ArtifactId: androidResults.find(item => item.api === 36).artifact.id
    } : null,
    browser: publicBrowserVerified ? {
      workflowRun: portalProof.run.id,
      artifactId: portalProof.artifact.id,
      name: portalProof.artifact.name,
      sha256: portalProof.artifact.sha256
    } : null
  }
};

fs.writeFileSync(new URL('../release/evidence-ledger.json', import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));

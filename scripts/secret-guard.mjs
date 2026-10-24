import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const files = execFileSync('git', ['ls-files', '-z'], {encoding: 'utf8'})
  .split('\0')
  .filter(Boolean);

const patterns = [
  {name: 'openai_project_key', regex: /sk-proj-[A-Za-z0-9_-]{20,}/g},
  {name: 'openai_legacy_key', regex: /sk-[A-Za-z0-9]{32,}/g},
  // Never commit complete contiguous Italian IBANs, even in synthetic fixtures.
  {name: 'italian_iban', regex: /\bIT[0-9]{2}[A-Z][0-9]{22}\b/gi},
];

const findings = [];
for (const file of files) {
  let content;
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > 2_000_000) continue;
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const {name, regex} of patterns) {
    regex.lastIndex = 0;
    if (regex.test(content)) findings.push({file, type: name});
  }
}

if (findings.length) {
  console.error(JSON.stringify({ok: false, error: 'SECRET_PATTERN_DETECTED', findings}, null, 2));
  process.exit(3);
}

console.log(JSON.stringify({ok: true, scannedFiles: files.length, secretPatterns: patterns.length}));

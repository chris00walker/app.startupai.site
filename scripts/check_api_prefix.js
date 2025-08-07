#!/usr/bin/env node
/*
  check_api_prefix.js
  Purpose: Detect accidental duplicated API prefix patterns ("/api/api/") in a Next.js build.
  Strategy:
    1) Inspect known Next.js manifest files for "/api/api/" occurrences.
    2) Fallback to scanning compiled assets (e.g. .next/static, .next/server) for string occurrences.
  Usage:
    node scripts/check_api_prefix.js [buildDir]
    - buildDir defaults to ".next" if not provided.
*/

const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(process.argv[2] || '.next');

function fileExists(p) {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function readText(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

function scanManifests(root) {
  const candidates = [
    path.join(root, 'routes-manifest.json'),
    path.join(root, 'server', 'pages-manifest.json'),
    path.join(root, 'server', 'app-paths-manifest.json'),
    path.join(root, 'server', 'middleware-manifest.json'),
    path.join(root, 'build-manifest.json'),
  ];

  const reasons = [];
  for (const p of candidates) {
    if (fileExists(p)) {
      const content = readText(p);
      if (content.includes('/api/api/')) {
        reasons.push(`Found '/api/api/' in manifest: ${path.relative(process.cwd(), p)}`);
      }
    }
  }
  return reasons;
}

function scanAssets(root) {
  const reasons = [];
  const assetDirs = [
    path.join(root, 'static'),
    path.join(root, 'server'),
  ];

  for (const dir of assetDirs) {
    if (!fileExists(dir)) continue;
    for (const file of walk(dir)) {
      // Only scan reasonable text assets to keep performance in check
      const ext = path.extname(file);
      if (!['.js', '.mjs', '.cjs', '.map', '.txt', '.json'].includes(ext)) continue;
      const content = readText(file);
      if (content.includes('/api/api/')) {
        reasons.push(`Found '/api/api/' in asset: ${path.relative(process.cwd(), file)}`);
        // We can stop early if we want, but keep scanning to report all findings
      }
    }
  }
  return reasons;
}

(function main() {
  if (!fileExists(buildDir)) {
    console.error(`Build directory not found: ${buildDir}`);
    process.exit(2);
  }

  const manifestFindings = scanManifests(buildDir);
  const assetFindings = scanAssets(buildDir);

  const findings = [...manifestFindings, ...assetFindings];
  if (findings.length > 0) {
    console.error('❌ Detected duplicated API prefix ("/api/api/") in build output:');
    for (const r of findings) console.error(` - ${r}`);
    process.exit(1);
  }

  console.log('✅ No duplicated /api prefix detected in Next.js build.');
})();

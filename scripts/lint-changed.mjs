#!/usr/bin/env node
import { execSync, spawnSync } from 'child_process';

const run = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

const refExists = (ref) => {
  try {
    execSync(`git rev-parse --verify ${ref}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

let baseRef = process.env.LINT_CHANGED_BASE;
if (!baseRef) {
  if (refExists('origin/main')) baseRef = 'origin/main';
  else if (refExists('main')) baseRef = 'main';
  else if (refExists('origin/master')) baseRef = 'origin/master';
  else baseRef = 'HEAD~1';
}

let changedFiles = [];
try {
  const diff = run(`git diff --name-only --diff-filter=ACMR ${baseRef}...HEAD`);
  changedFiles = diff.split('\n').filter(Boolean);
} catch {
  console.log('Unable to determine changed files; skipping lint:changed.');
  process.exit(0);
}

const allowedExt = new Set(['.ts', '.tsx', '.js', '.jsx']);
const targets = changedFiles
  .filter((file) => file.startsWith('frontend/src/'))
  .filter((file) => allowedExt.has(file.slice(file.lastIndexOf('.'))))
  .map((file) => file.replace(/^frontend\//, ''));

if (targets.length === 0) {
  console.log('No changed frontend source files detected; skipping lint:changed.');
  process.exit(0);
}

const args = [
  '-C',
  'frontend',
  'exec',
  'eslint',
  '--config',
  'eslint.config.base.mjs',
  '--max-warnings=0',
  ...targets,
];

const result = spawnSync('pnpm', args, { stdio: 'inherit' });
process.exit(result.status ?? 1);

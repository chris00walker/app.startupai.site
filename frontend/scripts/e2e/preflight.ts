import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  HITL_CHECKPOINT_IDS,
  isHitlCheckpointId,
} from '../../src/lib/approvals/checkpoint-contract';

interface CheckpointManifestEntry {
  id: string;
  testId: string;
}

interface CheckpointManifest {
  version: number;
  requiredSpecs: string[];
  checkpoints: CheckpointManifestEntry[];
}

const manifestPath = path.resolve(process.cwd(), 'tests/e2e/checkpoint-manifest.json');
const issues: string[] = [];

if (!fs.existsSync(manifestPath)) {
  console.error(`[e2e:preflight] Missing manifest: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(
  fs.readFileSync(manifestPath, 'utf8')
) as CheckpointManifest;

if (!Array.isArray(manifest.requiredSpecs) || manifest.requiredSpecs.length === 0) {
  issues.push('checkpoint-manifest.json must define at least one required spec.');
}

const manifestCheckpointIds = manifest.checkpoints.map((entry) => entry.id);
const contractSet = new Set(HITL_CHECKPOINT_IDS);
const manifestSet = new Set(manifestCheckpointIds);

for (const checkpointId of HITL_CHECKPOINT_IDS) {
  if (!manifestSet.has(checkpointId)) {
    issues.push(`Manifest is missing checkpoint "${checkpointId}".`);
  }
}

for (const manifestId of manifestCheckpointIds) {
  if (!contractSet.has(manifestId as (typeof HITL_CHECKPOINT_IDS)[number])) {
    issues.push(`Manifest checkpoint "${manifestId}" is not in HITL_CHECKPOINT_CONTRACT.`);
  }
}

for (const entry of manifest.checkpoints) {
  if (!isHitlCheckpointId(entry.id)) {
    continue;
  }
  const expectedTestId = `checkpoint-contract:${entry.id}`;
  if (entry.testId !== expectedTestId) {
    issues.push(
      `Manifest testId mismatch for "${entry.id}". Expected "${expectedTestId}", got "${entry.testId}".`
    );
  }
}

for (const spec of manifest.requiredSpecs) {
  const absoluteSpec = path.resolve(process.cwd(), spec);
  if (!fs.existsSync(absoluteSpec)) {
    issues.push(`Required spec does not exist: ${spec}`);
  }
}

const listResult = spawnSync('pnpm', ['exec', 'playwright', 'test', '--list'], {
  cwd: process.cwd(),
  env: { ...process.env, FORCE_COLOR: '0' },
  encoding: 'utf8',
});

const listOutput = `${listResult.stdout || ''}\n${listResult.stderr || ''}`;
if (listResult.status !== 0) {
  issues.push(
    `Playwright --list failed with exit code ${listResult.status ?? 'unknown'}.\n${listOutput}`
  );
}

for (const spec of manifest.requiredSpecs) {
  const basename = path.basename(spec);
  if (!listOutput.includes(spec) && !listOutput.includes(basename)) {
    issues.push(`Playwright test discovery did not include required spec: ${spec}`);
  }
}

for (const entry of manifest.checkpoints) {
  if (!listOutput.includes(entry.testId)) {
    issues.push(`Playwright test discovery did not include required test ID: ${entry.testId}`);
  }
}

if (issues.length > 0) {
  console.error('[e2e:preflight] Failed');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('[e2e:preflight] Passed');
console.log(`- Checkpoints in contract: ${HITL_CHECKPOINT_IDS.length}`);
console.log(`- Manifest version: ${manifest.version}`);
console.log(`- Required specs: ${manifest.requiredSpecs.length}`);

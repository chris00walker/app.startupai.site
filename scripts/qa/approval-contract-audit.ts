import fs from 'node:fs';
import path from 'node:path';
import {
  HITL_CHECKPOINT_CONTRACT,
  HITL_CHECKPOINT_IDS,
} from '../../frontend/src/lib/approvals/checkpoint-contract';

type Operation = 'insert' | 'update' | 'upsert' | 'delete';

interface WriterOperation {
  file: string;
  line: number;
  operation: Operation;
  keys: string[];
  objectText: string | null;
}

const ROOT = path.resolve(__dirname, '..', '..');

const WRITER_SCAN_ROOTS = [
  'frontend/src/app',
  'frontend/src/lib',
];

const APPROVAL_REQUEST_COLUMNS = new Set([
  'id',
  'execution_id',
  'task_id',
  'kickoff_id',
  'user_id',
  'project_id',
  'approval_type',
  'owner_role',
  'title',
  'description',
  'task_output',
  'evidence_summary',
  'options',
  'status',
  'decision',
  'human_feedback',
  'decided_by',
  'decided_at',
  'auto_approvable',
  'auto_approve_reason',
  'escalation_level',
  'last_escalated_at',
  'expires_at',
  'created_at',
  'updated_at',
]);

const REQUIRED_INSERT_COLUMNS = [
  'execution_id',
  'task_id',
  'user_id',
  'approval_type',
  'owner_role',
  'title',
  'description',
];

const ALLOWED_APPROVAL_TYPES = new Set([
  'segment_pivot',
  'value_pivot',
  'feature_downgrade',
  'strategic_pivot',
  'spend_increase',
  'campaign_launch',
  'customer_contact',
  'gate_progression',
  'data_sharing',
]);

const ALLOWED_OWNER_ROLES = new Set([
  'sage',
  'compass',
  'ledger',
  'pulse',
  'guardian',
  'forge',
]);

const CHECKPOINT_MANIFEST_PATH = 'frontend/tests/e2e/checkpoint-manifest.json';
const E2E_CONTRACT_SPEC_PATH = 'frontend/tests/e2e/43-hitl-checkpoint-contract.spec.ts';

interface CheckpointManifestEntry {
  id: string;
  testId: string;
}

interface CheckpointManifest {
  version: number;
  requiredSpecs: string[];
  checkpoints: CheckpointManifestEntry[];
}

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(absolute));
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      out.push(absolute);
    }
  }
  return out;
}

function countLine(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function skipWhitespace(content: string, index: number): number {
  let i = index;
  while (i < content.length && /\s/.test(content[i])) i += 1;
  return i;
}

function parseBalancedBlock(
  content: string,
  start: number,
  openChar: string,
  closeChar: string
): { text: string; end: number } | null {
  if (content[start] !== openChar) return null;
  let depth = 0;
  let inString: '"' | "'" | '`' | null = null;
  let escaped = false;
  for (let i = start; i < content.length; i += 1) {
    const ch = content[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      continue;
    }
    if (ch === openChar) {
      depth += 1;
      continue;
    }
    if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return { text: content.slice(start, i + 1), end: i + 1 };
      }
    }
  }
  return null;
}

function extractVariableObject(content: string, identifier: string, beforeIndex: number): string | null {
  const pattern = new RegExp(`(?:const|let|var)\\s+${identifier}\\s*=\\s*\\{`, 'g');
  let match: RegExpExecArray | null;
  let lastMatchIndex = -1;
  while ((match = pattern.exec(content)) !== null) {
    if (match.index < beforeIndex) {
      lastMatchIndex = match.index;
    }
  }
  if (lastMatchIndex < 0) return null;

  const braceIndex = content.indexOf('{', lastMatchIndex);
  if (braceIndex < 0) return null;
  return parseBalancedBlock(content, braceIndex, '{', '}')?.text ?? null;
}

function extractArgumentObject(
  content: string,
  opIndex: number,
  operation: Operation
): string | null {
  const callIndex = content.indexOf(`.${operation}(`, opIndex);
  if (callIndex < 0) return null;
  const argStart = skipWhitespace(content, callIndex + operation.length + 2);
  const first = content[argStart];

  if (first === '{') {
    return parseBalancedBlock(content, argStart, '{', '}')?.text ?? null;
  }
  if (first === '[') {
    const arr = parseBalancedBlock(content, argStart, '[', ']')?.text ?? null;
    if (!arr) return null;
    const innerObjectIndex = arr.indexOf('{');
    if (innerObjectIndex < 0) return null;
    return parseBalancedBlock(arr, innerObjectIndex, '{', '}')?.text ?? null;
  }

  const identMatch = content.slice(argStart).match(/^([A-Za-z_$][A-Za-z0-9_$]*)/);
  if (!identMatch) return null;
  return extractVariableObject(content, identMatch[1], argStart);
}

function splitTopLevel(inner: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;
  let inString: '"' | "'" | '`' | null = null;
  let escaped = false;

  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (inString) {
      current += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      current += ch;
      continue;
    }

    if (ch === '(') depthParen += 1;
    if (ch === ')') depthParen = Math.max(0, depthParen - 1);
    if (ch === '{') depthBrace += 1;
    if (ch === '}') depthBrace = Math.max(0, depthBrace - 1);
    if (ch === '[') depthBracket += 1;
    if (ch === ']') depthBracket = Math.max(0, depthBracket - 1);

    if (ch === ',' && depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function extractTopLevelKeys(objectText: string): string[] {
  const trimmed = objectText.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return [];
  const inner = trimmed.slice(1, -1);
  const segments = splitTopLevel(inner);
  const keys: string[] = [];

  for (const segment of segments) {
    if (!segment || segment.startsWith('...')) continue;
    const normalized = segment
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .trim();
    if (!normalized || normalized.startsWith('...')) continue;
    const keyMatch = normalized.match(/^(['"]?)([A-Za-z0-9_]+)\1\s*:/);
    if (keyMatch) keys.push(keyMatch[2]);
  }
  return keys;
}

function extractLiteralValue(objectText: string, key: string): string | null {
  const regex = new RegExp(`${key}\\s*:\\s*['"]([^'"]+)['"]`);
  const match = objectText.match(regex);
  return match?.[1] ?? null;
}

function findWriterOperations(content: string, file: string): WriterOperation[] {
  const writerPattern = /from\((['"])approval_requests\1\)([\s\S]{0,260}?)\.(insert|update|upsert|delete)\(/g;
  const operations: WriterOperation[] = [];
  let match: RegExpExecArray | null;

  while ((match = writerPattern.exec(content)) !== null) {
    const operation = match[3] as Operation;
    const objectText = extractArgumentObject(content, match.index, operation);
    const keys = objectText ? extractTopLevelKeys(objectText) : [];
    operations.push({
      file,
      line: countLine(content, match.index),
      operation,
      keys,
      objectText,
    });
  }

  return operations;
}

function readIfExists(relativePath: string): string {
  const absolute = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolute)) return '';
  return fs.readFileSync(absolute, 'utf8');
}

function readJsonIfExists<T>(relativePath: string): T | null {
  const text = readIfExists(relativePath);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function main(): void {
  const issues: string[] = [];
  const warnings: string[] = [];
  const operations: WriterOperation[] = [];

  for (const root of WRITER_SCAN_ROOTS) {
    const absoluteRoot = path.join(ROOT, root);
    for (const file of walkFiles(absoluteRoot)) {
      const content = fs.readFileSync(file, 'utf8');
      const relativeFile = path.relative(ROOT, file);
      operations.push(...findWriterOperations(content, relativeFile));
    }
  }

  if (operations.length === 0) {
    issues.push('No approval_requests writers were discovered. This likely indicates a parser failure.');
  }

  for (const op of operations) {
    const location = `${op.file}:${op.line}`;

    if (!op.objectText && op.operation !== 'delete') {
      warnings.push(`${location} uses ${op.operation} without statically analyzable payload.`);
      continue;
    }

    if (!op.objectText) continue;

    const unknownKeys = op.keys.filter((key) => !APPROVAL_REQUEST_COLUMNS.has(key));
    if (unknownKeys.length > 0) {
      issues.push(`${location} uses unknown columns in ${op.operation}: ${unknownKeys.join(', ')}`);
    }

    if (op.operation === 'insert') {
      const missing = REQUIRED_INSERT_COLUMNS.filter((required) => !op.keys.includes(required));
      if (missing.length > 0) {
        issues.push(`${location} is missing required insert columns: ${missing.join(', ')}`);
      }
    }

    const approvalTypeLiteral = extractLiteralValue(op.objectText, 'approval_type');
    if (approvalTypeLiteral && !ALLOWED_APPROVAL_TYPES.has(approvalTypeLiteral)) {
      issues.push(`${location} uses invalid approval_type literal "${approvalTypeLiteral}".`);
    }

    const ownerRoleLiteral = extractLiteralValue(op.objectText, 'owner_role');
    if (ownerRoleLiteral && !ALLOWED_OWNER_ROLES.has(ownerRoleLiteral)) {
      issues.push(`${location} uses invalid owner_role literal "${ownerRoleLiteral}".`);
    }
  }

  const modalTestContent = readIfExists('frontend/src/__tests__/components/approvals/ApprovalDetailModal.test.tsx');
  if (!modalTestContent.includes('Object.entries(HITL_CHECKPOINT_CONTRACT)')) {
    issues.push(
      'frontend/src/__tests__/components/approvals/ApprovalDetailModal.test.tsx must iterate HITL_CHECKPOINT_CONTRACT to enforce per-checkpoint render coverage.'
    );
  }

  const webhookRouteTestContent = readIfExists('frontend/src/__tests__/api/crewai/webhook/route.test.ts');
  const webhookUsesContractLoop =
    webhookRouteTestContent.includes('Object.keys(HITL_CHECKPOINT_CONTRACT)') ||
    webhookRouteTestContent.includes('HITL_CHECKPOINT_IDS');
  if (!webhookUsesContractLoop) {
    for (const checkpoint of HITL_CHECKPOINT_IDS) {
      if (!webhookRouteTestContent.includes(`'${checkpoint}'`) && !webhookRouteTestContent.includes(`"${checkpoint}"`)) {
        issues.push(`frontend/src/__tests__/api/crewai/webhook/route.test.ts is missing checkpoint "${checkpoint}".`);
      }
    }
  }

  const e2eContractContent = readIfExists(E2E_CONTRACT_SPEC_PATH);
  if (!e2eContractContent) {
    issues.push(`${E2E_CONTRACT_SPEC_PATH} is required for checkpoint-level E2E contract coverage.`);
  } else if (!e2eContractContent.includes('HITL_CHECKPOINT_IDS')) {
    issues.push(`${E2E_CONTRACT_SPEC_PATH} must iterate HITL_CHECKPOINT_IDS for automatic checkpoint coverage.`);
  }
  if (readIfExists('frontend/src/__tests__/e2e/hitl-checkpoint-contract.spec.ts')) {
    issues.push(
      'frontend/src/__tests__/e2e/hitl-checkpoint-contract.spec.ts must be removed to avoid split E2E discovery.'
    );
  }

  const manifest = readJsonIfExists<CheckpointManifest>(CHECKPOINT_MANIFEST_PATH);
  if (!manifest) {
    issues.push(`${CHECKPOINT_MANIFEST_PATH} is required and must be valid JSON.`);
  } else {
    if (!Array.isArray(manifest.requiredSpecs) || manifest.requiredSpecs.length === 0) {
      issues.push(`${CHECKPOINT_MANIFEST_PATH} must declare requiredSpecs.`);
    }
    if (!manifest.requiredSpecs.includes(E2E_CONTRACT_SPEC_PATH.replace('frontend/', ''))) {
      issues.push(
        `${CHECKPOINT_MANIFEST_PATH} must include "${E2E_CONTRACT_SPEC_PATH.replace('frontend/', '')}" in requiredSpecs.`
      );
    }

    const manifestIds = manifest.checkpoints.map((entry) => entry.id);
    for (const checkpoint of HITL_CHECKPOINT_IDS) {
      if (!manifestIds.includes(checkpoint)) {
        issues.push(`${CHECKPOINT_MANIFEST_PATH} is missing checkpoint "${checkpoint}".`);
      }
    }

    for (const entry of manifest.checkpoints) {
      if (!HITL_CHECKPOINT_IDS.includes(entry.id as (typeof HITL_CHECKPOINT_IDS)[number])) {
        issues.push(`${CHECKPOINT_MANIFEST_PATH} references unknown checkpoint "${entry.id}".`);
      }
      const expectedTestId = `checkpoint-contract:${entry.id}`;
      if (entry.testId !== expectedTestId) {
        issues.push(
          `${CHECKPOINT_MANIFEST_PATH} has invalid testId for "${entry.id}". Expected "${expectedTestId}", got "${entry.testId}".`
        );
      }
    }
  }

  const webhookSchemaContent = readIfExists('frontend/src/app/api/crewai/webhook/schemas.ts');
  if (!webhookSchemaContent.includes('hitlCheckpointIdSchema')) {
    issues.push(
      'frontend/src/app/api/crewai/webhook/schemas.ts must define hitlCheckpointIdSchema to enforce known checkpoint IDs.'
    );
  }

  const webhookRouteContent = readIfExists('frontend/src/app/api/crewai/webhook/route.ts');
  if (
    webhookRouteContent.includes("checkpointContract?.approvalType || 'gate_progression'") ||
    webhookRouteContent.includes("checkpointContract?.ownerRole || 'compass'")
  ) {
    issues.push(
      'frontend/src/app/api/crewai/webhook/route.ts must not fallback to default checkpoint mappings.'
    );
  }
  if (!webhookRouteContent.includes('UNKNOWN_HITL_CHECKPOINT')) {
    issues.push(
      'frontend/src/app/api/crewai/webhook/route.ts must fail closed with UNKNOWN_HITL_CHECKPOINT when mapping is missing.'
    );
  }

  const contractEntries = Object.entries(HITL_CHECKPOINT_CONTRACT);
  for (const [checkpoint, contract] of contractEntries) {
    if (!ALLOWED_APPROVAL_TYPES.has(contract.approvalType)) {
      issues.push(`HITL_CHECKPOINT_CONTRACT["${checkpoint}"] has unsupported approvalType "${contract.approvalType}".`);
    }
    if (!ALLOWED_OWNER_ROLES.has(contract.ownerRole)) {
      issues.push(`HITL_CHECKPOINT_CONTRACT["${checkpoint}"] has unsupported ownerRole "${contract.ownerRole}".`);
    }
    if (!['founders_brief_panel', 'discovery_output_panel', 'generic'].includes(contract.renderVariant)) {
      issues.push(`HITL_CHECKPOINT_CONTRACT["${checkpoint}"] has unsupported renderVariant "${contract.renderVariant}".`);
    }
  }

  console.log('Approval contract audit');
  console.log(`- Writers discovered: ${operations.length}`);
  for (const op of operations) {
    const summary = op.keys.length > 0 ? `keys=${op.keys.join(',')}` : 'keys=unresolved';
    console.log(`  - ${op.file}:${op.line} ${op.operation} (${summary})`);
  }
  console.log(`- Checkpoint contracts: ${HITL_CHECKPOINT_IDS.length}`);

  if (warnings.length > 0) {
    console.log('\nWarnings');
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (issues.length > 0) {
    console.error('\nIssues');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log('\nAudit passed');
}

main();

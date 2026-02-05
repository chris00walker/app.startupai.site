/**
 * Evidence Boundary Validation
 *
 * Runtime validation for Supabase payloads entering the Evidence Explorer.
 * @story US-F14
 */

import { z } from 'zod'
import { isValid } from 'date-fns'
import type { Evidence } from '@/db/schema/evidence'
import type { CrewAIValidationEvidenceState } from '@/types/evidence-explorer'
import type {
  DesirabilitySignal,
  FeasibilitySignal,
  ViabilitySignal,
} from '@/types/crewai'

export const EVIDENCE_SCHEMA_VERSION = '1.0'
export const CREWAI_STATE_SCHEMA_VERSION = '1.0'

export type ValidationMode = 'open' | 'closed'

export interface EvidenceValidationPolicy {
  source: string
  mode: ValidationMode
  strict: boolean
  sampleRate: number
}

const EVIDENCE_CATEGORIES = [
  'Survey',
  'Interview',
  'Experiment',
  'Analytics',
  'Research',
] as const

const EVIDENCE_STRENGTHS = ['weak', 'medium', 'strong'] as const
const FIT_TYPES = ['Desirability', 'Feasibility', 'Viability'] as const

const DESIRABILITY_SIGNALS: DesirabilitySignal[] = [
  'no_signal',
  'no_interest',
  'weak_interest',
  'strong_commitment',
]

const FEASIBILITY_SIGNALS: FeasibilitySignal[] = [
  'unknown',
  'green',
  'orange_constrained',
  'red_impossible',
]

const VIABILITY_SIGNALS: ViabilitySignal[] = [
  'unknown',
  'profitable',
  'marginal',
  'underwater',
  'zombie_market',
]

const EvidenceRowSchema = z
  .object({
    id: z.string(),
    project_id: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    evidence_category: z.enum(EVIDENCE_CATEGORIES).optional().nullable(),
    summary: z.string().optional().nullable(),
    full_text: z.string().optional().nullable(),
    content: z.string().optional().nullable(),
    embedding: z.any().optional().nullable(),
    strength: z.enum(EVIDENCE_STRENGTHS).optional().nullable(),
    is_contradiction: z.boolean().optional().nullable(),
    fit_type: z.enum(FIT_TYPES).optional().nullable(),
    source_type: z.string().optional().nullable(),
    source_url: z.string().optional().nullable(),
    author: z.string().optional().nullable(),
    evidence_source: z.string().optional().nullable(),
    occurred_on: z.union([z.string(), z.date()]).optional().nullable(),
    linked_assumptions: z.array(z.string()).optional().nullable(),
    narrative_category: z.enum(['DO-direct', 'DO-indirect', 'SAY'] as const).optional().nullable(),
    tags: z.array(z.string()).optional().nullable(),
    created_at: z.union([z.string(), z.date()]).optional().nullable(),
    updated_at: z.union([z.string(), z.date()]).optional().nullable(),
  })
  .passthrough()

const CrewAIValidationStateRowSchema = z
  .object({
    id: z.string(),
    iteration: z.number().int().optional().nullable(),
    updated_at: z.union([z.string(), z.date()]).optional().nullable(),
    desirability_signal: z.enum(DESIRABILITY_SIGNALS).optional().nullable(),
    feasibility_signal: z.enum(FEASIBILITY_SIGNALS).optional().nullable(),
    viability_signal: z.enum(VIABILITY_SIGNALS).optional().nullable(),
    desirability_evidence: z.any().optional().nullable(),
    feasibility_evidence: z.any().optional().nullable(),
    viability_evidence: z.any().optional().nullable(),
  })
  .passthrough()

const evidenceCache = new WeakMap<object, Evidence[]>()
const validationStateCache = new WeakMap<object, CrewAIValidationEvidenceState[]>()

function safeParseDate(value: unknown): Date {
  if (!value) return new Date()
  const date = value instanceof Date ? value : new Date(value as string)
  return isValid(date) ? date : new Date()
}

function shouldSample(rate: number): boolean {
  if (rate <= 0) return false
  if (rate >= 1) return true
  return Math.random() < rate
}

function redactIssues(issues: z.ZodIssue[]) {
  return issues.slice(0, 10).map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
  }))
}

function logIssues(
  policy: EvidenceValidationPolicy,
  schemaVersion: string,
  issues: z.ZodIssue[]
) {
  if (!shouldSample(policy.sampleRate)) return
  console.warn('[EvidenceBoundary] Validation issues', {
    source: policy.source,
    schemaVersion,
    issueCount: issues.length,
    issues: redactIssues(issues),
  })
}

export function getEvidenceValidationPolicy(
  overrides: Partial<EvidenceValidationPolicy> = {}
): EvidenceValidationPolicy {
  const strictFlag = process.env.NEXT_PUBLIC_EVIDENCE_VALIDATION_STRICT === 'true'
  const defaultSample =
    process.env.NODE_ENV === 'production' ? 0.1 : 1
  const sampleEnv = Number(process.env.NEXT_PUBLIC_EVIDENCE_VALIDATION_SAMPLE_RATE)
  const rawSampleRate = Number.isFinite(sampleEnv) ? sampleEnv : defaultSample
  const sampleRate = Math.min(1, Math.max(0, rawSampleRate))

  return {
    source: 'evidence-boundary',
    mode: 'open',
    strict: strictFlag,
    sampleRate,
    ...overrides,
  }
}

export function parseEvidenceRows(
  rows: unknown[] | null | undefined,
  policy: EvidenceValidationPolicy
): Evidence[] {
  if (!rows || rows.length === 0) return []
  if (evidenceCache.has(rows)) {
    return evidenceCache.get(rows) || []
  }

  const parsed: Evidence[] = []
  const issues: z.ZodIssue[] = []

  rows.forEach((row, index) => {
    const result = EvidenceRowSchema.safeParse(row)
    if (!result.success) {
      issues.push(
        ...result.error.issues.map((issue) => ({
          ...issue,
          path: ['evidence', index, ...issue.path],
        }))
      )
      return
    }

    const data = result.data
    parsed.push({
      id: data.id,
      projectId: data.project_id || '',
      title: data.title ?? null,
      evidenceCategory: data.evidence_category ?? null,
      summary: data.summary ?? null,
      fullText: data.full_text ?? null,
      content: data.content ?? '',
      embedding: data.embedding ?? null,
      strength: data.strength ?? null,
      isContradiction: data.is_contradiction ?? false,
      fitType: data.fit_type ?? null,
      sourceType: data.source_type ?? null,
      sourceUrl: data.source_url ?? null,
      author: data.author ?? null,
      evidenceSource: data.evidence_source ?? null,
      occurredOn: data.occurred_on
        ? data.occurred_on instanceof Date
          ? data.occurred_on.toISOString().slice(0, 10)
          : data.occurred_on
        : null,
      linkedAssumptions: data.linked_assumptions ?? null,
      narrativeCategory: data.narrative_category ?? null,
      tags: data.tags ?? null,
      createdAt: safeParseDate(data.created_at),
      updatedAt: safeParseDate(data.updated_at),
    })
  })

  if (issues.length > 0) {
    logIssues(policy, EVIDENCE_SCHEMA_VERSION, issues)
    if (policy.mode === 'closed' || policy.strict) {
      throw new Error('Evidence boundary validation failed')
    }
  }

  evidenceCache.set(rows, parsed)
  return parsed
}

export function parseValidationStateRows(
  rows: unknown[] | null | undefined,
  policy: EvidenceValidationPolicy
): CrewAIValidationEvidenceState[] {
  if (!rows || rows.length === 0) return []
  if (validationStateCache.has(rows)) {
    return validationStateCache.get(rows) || []
  }

  const parsed: CrewAIValidationEvidenceState[] = []
  const issues: z.ZodIssue[] = []

  rows.forEach((row, index) => {
    const result = CrewAIValidationStateRowSchema.safeParse(row)
    if (!result.success) {
      issues.push(
        ...result.error.issues.map((issue) => ({
          ...issue,
          path: ['crewai_validation_states', index, ...issue.path],
        }))
      )
      return
    }

    const data = result.data
    parsed.push({
      id: data.id,
      iteration: data.iteration ?? 1,
      updatedAt: safeParseDate(data.updated_at),
      desirabilitySignal: (data.desirability_signal ?? 'no_signal') as DesirabilitySignal,
      feasibilitySignal: (data.feasibility_signal ?? 'unknown') as FeasibilitySignal,
      viabilitySignal: (data.viability_signal ?? 'unknown') as ViabilitySignal,
      desirabilityEvidence: data.desirability_evidence ?? null,
      feasibilityEvidence: data.feasibility_evidence ?? null,
      viabilityEvidence: data.viability_evidence ?? null,
    })
  })

  if (issues.length > 0) {
    logIssues(policy, CREWAI_STATE_SCHEMA_VERSION, issues)
    if (policy.mode === 'closed' || policy.strict) {
      throw new Error('CrewAI validation state boundary validation failed')
    }
  }

  validationStateCache.set(rows, parsed)
  return parsed
}

export function parseEvidenceSources(
  userRows: unknown[] | null | undefined,
  aiRows: unknown[] | null | undefined,
  policy: EvidenceValidationPolicy
) {
  return {
    userEvidence: parseEvidenceRows(userRows, policy),
    aiStates: parseValidationStateRows(aiRows, policy),
  }
}

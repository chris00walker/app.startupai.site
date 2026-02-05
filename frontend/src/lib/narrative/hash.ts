/**
 * Narrative Layer Hash Functions
 *
 * Three distinct hash functions + shared canonicalization for content integrity.
 * Uses SHA-256, hex-encoded (64 characters).
 *
 * Hash types:
 * 1. computeNarrativeHash() — for generation_hash on narrative_exports
 * 2. computeSourceEvidenceHash() — for source_evidence_hash on pitch_narratives
 * 3. computeIntegrityHash() — for integrity_hash on evidence_packages
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2083-2160, :3682-3855
 */

import { createHash } from 'crypto';
import type {
  PitchNarrativeContent,
  ValidationEvidence,
  EvidenceIntegrity,
  BusinessModelCanvas,
} from './types';

// --- Shared Canonicalization ---

/**
 * Recursively sort object keys for deterministic JSON output.
 * Arrays are preserved in given order (sorting happens before this).
 * null/undefined → "null" in final output via JSON.stringify.
 */
function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === 'object' && obj !== null) {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeys((obj as Record<string, unknown>)[key]);
        return acc;
      }, {} as Record<string, unknown>);
  }
  return obj;
}

/**
 * Stable JSON stringify with recursively sorted keys.
 * Matches Python: json.dumps(data, sort_keys=True, separators=(',', ':'))
 */
export function stableStringify(obj: unknown): string {
  return JSON.stringify(sortKeys(obj));
}

/**
 * Sort all BMC string arrays alphabetically for deterministic hashing.
 */
export function sortBmcArrays(bmc: BusinessModelCanvas): BusinessModelCanvas {
  return {
    ...bmc,
    key_partners: [...bmc.key_partners].sort(),
    key_activities: [...bmc.key_activities].sort(),
    key_resources: [...bmc.key_resources].sort(),
    value_propositions: [...bmc.value_propositions].sort(),
    customer_relationships: [...bmc.customer_relationships].sort(),
    channels: [...bmc.channels].sort(),
    customer_segments: [...bmc.customer_segments].sort(),
    cost_structure: bmc.cost_structure,
    revenue_streams: bmc.revenue_streams,
  };
}

/**
 * Canonicalize evidence data with field-by-field sorting before hashing.
 */
export function canonicalizeEvidence(evidence: ValidationEvidence): ValidationEvidence {
  return {
    vpc: {
      ...evidence.vpc,
      customer_jobs: [...evidence.vpc.customer_jobs].sort(),
      pains: [...evidence.vpc.pains].sort((a, b) => a.description.localeCompare(b.description)),
      gains: [...evidence.vpc.gains].sort((a, b) => a.description.localeCompare(b.description)),
      pain_relievers: [...evidence.vpc.pain_relievers].sort(),
      gain_creators: [...evidence.vpc.gain_creators].sort(),
      products_services: [...evidence.vpc.products_services].sort(),
    },
    customer_profile: {
      ...evidence.customer_profile,
      jobs_to_be_done: [...evidence.customer_profile.jobs_to_be_done].sort((a, b) =>
        a.job.localeCompare(b.job)
      ),
      pains: [...evidence.customer_profile.pains].sort((a, b) =>
        a.pain.localeCompare(b.pain)
      ),
      gains: [...evidence.customer_profile.gains].sort((a, b) =>
        a.gain.localeCompare(b.gain)
      ),
      behavioral_insights: [...evidence.customer_profile.behavioral_insights].sort(),
    },
    competitor_map: {
      ...evidence.competitor_map,
      competitors: [...evidence.competitor_map.competitors].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    },
    bmc: sortBmcArrays(evidence.bmc),
    experiment_results: [...evidence.experiment_results].sort((a, b) =>
      a.experiment_id.localeCompare(b.experiment_id)
    ),
    gate_scores: evidence.gate_scores,
    hitl_record: {
      ...evidence.hitl_record,
      checkpoints: [...evidence.hitl_record.checkpoints].sort((a, b) => {
        const typeCompare = a.checkpoint_type.localeCompare(b.checkpoint_type);
        if (typeCompare !== 0) return typeCompare;
        const aTime = a.responded_at ?? a.triggered_at;
        const bTime = b.responded_at ?? b.triggered_at;
        return aTime.localeCompare(bTime);
      }),
    },
  };
}

// --- Hash Functions ---

/**
 * Compute hash of narrative content for generation_hash on narrative_exports.
 * Hashes narrative_data JSONB (PitchNarrativeContent) only.
 * Metadata columns (timestamps, alignment_status, etc.) are separate DB columns
 * and NOT in narrative_data by design.
 */
export function computeNarrativeHash(narrativeData: PitchNarrativeContent): string {
  const canonical = stableStringify(narrativeData);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Compute hash of input evidence for source_evidence_hash on pitch_narratives.
 * Hashes the evidence used to generate the narrative.
 */
export function computeSourceEvidenceHash(evidence: ValidationEvidence): string {
  const canonicalized = canonicalizeEvidence(evidence);
  const canonical = stableStringify(canonicalized);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Compute integrity hash for evidence_packages.
 * Hashes validation_evidence + integrity metadata (NOT pitch_narrative, generated_at, access.*, or integrity.evidence_hash).
 */
export function computeIntegrityHash(
  evidence: ValidationEvidence,
  integrity: Omit<EvidenceIntegrity, 'evidence_hash'>
): string {
  const canonicalized = canonicalizeEvidence(evidence);
  const integrityForHash = {
    ...integrity,
    agent_versions: [...integrity.agent_versions].sort((a, b) =>
      a.agent_name.localeCompare(b.agent_name)
    ),
  };
  const hashInput = {
    validation_evidence: canonicalized,
    integrity: integrityForHash,
  };
  const canonical = stableStringify(hashInput);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

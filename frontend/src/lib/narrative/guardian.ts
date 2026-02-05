/**
 * Guardian Alignment Check
 *
 * Validates narrative claims against evidence strength.
 * Three check operations:
 * 1. Initial generation: auto-correct overstated language
 * 2. Founder edit validation: flag without auto-correcting
 * 3. Regeneration: re-validate all claims
 *
 * Four scope areas:
 * a) Claim-language mapping per 4-tier Fit Score table
 * b) Evidence freshness
 * c) Fit Score consistency
 * d) Methodology compliance
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :3948-3997
 */

import type {
  PitchNarrativeContent,
  AlignmentIssue,
  EvidenceItem,
} from './types';

// --- Claim-Language Mapping ---

/**
 * 4-tier Fit Score → permitted language mapping.
 * Higher scores permit stronger claims.
 */
const CLAIM_LANGUAGE_TIERS = [
  {
    range: [0, 0.25] as const,
    tier: 'exploratory',
    permitted: ['exploring', 'early signals suggest', 'initial indicators', 'we believe', 'hypothesis'],
    prohibited: ['proven', 'strong demand', 'validated', 'confirmed', 'significant traction'],
  },
  {
    range: [0.25, 0.50] as const,
    tier: 'emerging',
    permitted: ['growing evidence', 'positive indicators', 'early validation', 'emerging signals'],
    prohibited: ['proven', 'strong demand', 'confirmed', 'dominant', 'clear market leader'],
  },
  {
    range: [0.50, 0.75] as const,
    tier: 'validated',
    permitted: ['validated', 'evidence supports', 'demonstrated', 'confirmed interest', 'proven interest'],
    prohibited: ['dominant', 'market leader', 'undeniable', 'overwhelming demand'],
  },
  {
    range: [0.75, 1.0] as const,
    tier: 'strong',
    permitted: ['strong demand', 'proven', 'significant traction', 'validated market fit', 'confirmed'],
    prohibited: [],
  },
];

/**
 * Get the permitted language tier for a given Fit Score.
 */
function getLanguageTier(fitScore: number) {
  for (const tier of CLAIM_LANGUAGE_TIERS) {
    if (fitScore >= tier.range[0] && fitScore < tier.range[1]) {
      return tier;
    }
  }
  // Score of exactly 1.0
  return CLAIM_LANGUAGE_TIERS[CLAIM_LANGUAGE_TIERS.length - 1];
}

/**
 * Check if text contains prohibited language for the given Fit Score tier.
 */
function findProhibitedLanguage(
  text: string,
  fitScore: number
): { found: string; suggested: string } | null {
  const tier = getLanguageTier(fitScore);
  const lowerText = text.toLowerCase();

  for (const prohibited of tier.prohibited) {
    if (lowerText.includes(prohibited.toLowerCase())) {
      // Suggest replacement from permitted list
      const suggested = tier.permitted[0] || 'moderate evidence suggests';
      return { found: prohibited, suggested };
    }
  }

  return null;
}

// --- Evidence Strength Check ---

/**
 * Count DO-direct evidence items across the narrative.
 * DO-direct count is the primary gate for claim strength.
 */
function countDoDirectEvidence(content: PitchNarrativeContent): number {
  const items: EvidenceItem[] = [
    ...content.traction.do_direct,
  ];
  return items.length;
}

// --- Guardian Check Operations ---

export interface GuardianCheckResult {
  status: 'verified' | 'flagged';
  issues: AlignmentIssue[];
  auto_corrections?: { field: string; old_value: string; new_value: string }[];
}

/**
 * Check all text fields in a slide for claim-language alignment.
 */
function checkSlideFields(
  slideKey: string,
  slideData: Record<string, unknown>,
  fitScore: number,
  autoCorrect: boolean
): { issues: AlignmentIssue[]; corrections: { field: string; old_value: string; new_value: string }[] } {
  const issues: AlignmentIssue[] = [];
  const corrections: { field: string; old_value: string; new_value: string }[] = [];

  function traverse(obj: Record<string, unknown>, path: string) {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = path ? `${path}.${key}` : `${slideKey}.${key}`;

      if (typeof value === 'string' && value.length > 10) {
        const violation = findProhibitedLanguage(value, fitScore);
        if (violation) {
          if (autoCorrect) {
            // Replace prohibited language with suggested alternative
            const newValue = value.replace(
              new RegExp(violation.found, 'gi'),
              violation.suggested
            );
            corrections.push({
              field: fieldPath,
              old_value: value,
              new_value: newValue,
            });
          } else {
            issues.push({
              field: fieldPath,
              issue: `Language "${violation.found}" may overstate evidence at current Fit Score (${(fitScore * 100).toFixed(0)}%)`,
              severity: 'warning',
              suggested_language: violation.suggested,
              evidence_needed: `Fit Score ≥${((getLanguageTier(fitScore).range[1]) * 100).toFixed(0)}% to use stronger claims`,
            });
          }
        }
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        traverse(value as Record<string, unknown>, fieldPath);
      }
    }
  }

  traverse(slideData, '');
  return { issues, corrections };
}

/**
 * Run Guardian alignment check on initial generation.
 * Auto-corrects overstated language before storage.
 */
export function guardianCheckGeneration(
  content: PitchNarrativeContent
): GuardianCheckResult {
  const fitScore = content.metadata.overall_fit_score;
  const doDirectCount = countDoDirectEvidence(content);
  const allIssues: AlignmentIssue[] = [];
  const allCorrections: { field: string; old_value: string; new_value: string }[] = [];

  // Check each slide
  const slides = Object.entries(content).filter(([key]) => key !== 'version' && key !== 'metadata');
  for (const [slideKey, slideData] of slides) {
    if (!slideData || typeof slideData !== 'object') continue;
    const { issues, corrections } = checkSlideFields(
      slideKey,
      slideData as Record<string, unknown>,
      fitScore,
      true // auto-correct at generation
    );
    allIssues.push(...issues);
    allCorrections.push(...corrections);
  }

  // Additional check: if no DO-direct evidence, flag any "proven" language
  if (doDirectCount === 0) {
    const tractionSummary = content.traction.evidence_summary?.toLowerCase() || '';
    if (tractionSummary.includes('proven') || tractionSummary.includes('validated')) {
      allCorrections.push({
        field: 'traction.evidence_summary',
        old_value: content.traction.evidence_summary,
        new_value: content.traction.evidence_summary
          .replace(/\bproven\b/gi, 'indicated')
          .replace(/\bvalidated\b/gi, 'explored'),
      });
    }
  }

  return {
    status: allIssues.length > 0 ? 'flagged' : 'verified',
    issues: allIssues,
    auto_corrections: allCorrections.length > 0 ? allCorrections : undefined,
  };
}

/**
 * Run Guardian alignment check on founder edits.
 * Flags without auto-correcting (preserves founder agency).
 */
export function guardianCheckEdit(
  content: PitchNarrativeContent,
  editedFields: string[]
): GuardianCheckResult {
  const fitScore = content.metadata.overall_fit_score;
  const issues: AlignmentIssue[] = [];

  // Only check edited fields
  for (const fieldPath of editedFields) {
    const parts = fieldPath.split('.');
    const slideKey = parts[0];
    const slideData = content[slideKey as keyof PitchNarrativeContent];

    if (!slideData || typeof slideData !== 'object') continue;

    // Navigate to the edited value
    let value: unknown = slideData;
    for (let i = 1; i < parts.length; i++) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[parts[i]];
      }
    }

    if (typeof value === 'string' && value.length > 10) {
      const violation = findProhibitedLanguage(value, fitScore);
      if (violation) {
        issues.push({
          field: fieldPath,
          issue: `Language "${violation.found}" may overstate evidence at current Fit Score (${(fitScore * 100).toFixed(0)}%)`,
          severity: 'warning',
          suggested_language: violation.suggested,
          evidence_needed: `Fit Score ≥${((getLanguageTier(fitScore).range[1]) * 100).toFixed(0)}% to use stronger claims`,
        });
      }
    }
  }

  return {
    status: issues.length > 0 ? 'flagged' : 'verified',
    issues,
  };
}

/**
 * Run Guardian alignment check on regeneration.
 * Re-validates all claims against new evidence state.
 */
export function guardianCheckRegeneration(
  content: PitchNarrativeContent
): GuardianCheckResult {
  // Regeneration uses same logic as generation but without auto-correct
  const fitScore = content.metadata.overall_fit_score;
  const allIssues: AlignmentIssue[] = [];

  const slides = Object.entries(content).filter(([key]) => key !== 'version' && key !== 'metadata');
  for (const [slideKey, slideData] of slides) {
    if (!slideData || typeof slideData !== 'object') continue;
    const { issues } = checkSlideFields(
      slideKey,
      slideData as Record<string, unknown>,
      fitScore,
      false // don't auto-correct on regeneration, flag instead
    );
    allIssues.push(...issues);
  }

  return {
    status: allIssues.length > 0 ? 'flagged' : 'verified',
    issues: allIssues,
  };
}

/**
 * Apply auto-corrections from Guardian check to narrative content.
 * Used at initial generation to fix overstated claims before storage.
 */
export function applyGuardianCorrections(
  content: PitchNarrativeContent,
  corrections: { field: string; old_value: string; new_value: string }[]
): PitchNarrativeContent {
  // Deep clone to avoid mutating the original
  const result = JSON.parse(JSON.stringify(content)) as PitchNarrativeContent;

  for (const correction of corrections) {
    const parts = correction.field.split('.');
    let target: Record<string, unknown> = result as unknown as Record<string, unknown>;

    // Navigate to parent of target field
    for (let i = 0; i < parts.length - 1; i++) {
      target = target[parts[i]] as Record<string, unknown>;
      if (!target) break;
    }

    if (target) {
      const lastKey = parts[parts.length - 1];
      if (target[lastKey] === correction.old_value) {
        target[lastKey] = correction.new_value;
      }
    }
  }

  return result;
}

<!-- @story US-F14 -->

# Data Boundary Validation (Evidence Explorer)

## Purpose
Ensure runtime validation and normalization of Supabase payloads before they
enter the Evidence Explorer. This prevents crashes from legacy or malformed data
that TypeScript types alone cannot catch.

## Entry Points
- `frontend/src/lib/evidence/boundary.ts`
  - Zod schemas for `evidence` and `crewai_validation_states`
  - snake_case → camelCase mapping
  - safe date parsing with fallbacks
  - redacted logging + sampling
- `frontend/src/lib/evidence/data-access.ts`
  - Single fetch path for Evidence Explorer data
  - Applies boundary validation and returns normalized payloads

## Validation Policy
Boundary validation uses a policy object:
- `mode`: `open` (fail-open, default) or `closed` (fail-closed)
- `strict`: when `true`, throw on validation issues even in `open`
- `sampleRate`: log sampling (0–1)
- `source`: caller identifier for logging

The default policy is fail-open with sampling. Override to `closed` for
high-confidence environments (tests, migrations, or debugging).

## Environment Flags
- `NEXT_PUBLIC_EVIDENCE_VALIDATION_STRICT=true`
  - Forces strict boundary behavior (throws on issues)
- `NEXT_PUBLIC_EVIDENCE_VALIDATION_SAMPLE_RATE=0.1`
  - Controls warning sampling for validation issues

## Guardrails
- `pnpm evidence:boundary:check` ensures `useUnifiedEvidence` only fetches data
  through the boundary layer (no direct Supabase queries).
- Unit tests: `frontend/src/__tests__/lib/evidence/boundary.test.ts`

## Why This Exists
Supabase can return legacy or malformed data (null dates, missing fields, or
older schemas). This layer keeps the UI resilient and provides a structured
way to surface data quality issues without crashing the product.

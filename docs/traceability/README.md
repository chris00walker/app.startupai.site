# Story-Code Traceability System

Bidirectional links between user stories and code for instant lookup.

## Quick Reference

```bash
# Generate the story-code-map
pnpm traceability:generate

# Validate annotations and overrides
pnpm traceability:validate

# View gaps (stories without implementations)
pnpm traceability:gaps

# Run tests
pnpm traceability:test
```

## API Wiring Validation

The API wiring system validates API callers against route inventories across the ecosystem.
See `docs/traceability/api-wiring/README.md` for full details.

```bash
# Generate this repo's API inventory
pnpm api-inventory:generate

# Generate wiring map (callers -> routes)
pnpm api-wiring:generate

# Validate wiring (single-repo)
pnpm api-wiring:ci

# Validate wiring (ecosystem)
pnpm api-wiring:ci:ecosystem
```

## The 100x Factor

**Before:** Finding code for US-F01 requires reading 4 docs and grepping manually (5-10 minutes).

**After:** Instant lookup via `story-code-map.json` (<5 seconds).

## Architecture

```
Story Definitions          Code Annotations          Manual Overrides
(stories/*.md)             (@story US-XXX)           (story-code-overrides.yaml)
       │                          │                          │
       ▼                          ▼                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    generate-story-map.ts                      │
│                                                               │
│  1. Parse story definitions → empty entries for all stories   │
│  2. Parse journey-test-matrix.md → baseline test mappings     │
│  3. Parse feature-inventory.md → baseline code hints          │
│  4. Parse code annotations → populate annotated links (authoritative)
│  5. Merge overrides → adds db_tables, notes, domain hints      │
│  6. Write story-code-map.json                                 │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────┐
              │   story-code-map.json     │
              │   (generated, read-only)  │
              └───────────────────────────┘
```

## Artifacts

| File | Purpose | Editable? |
|------|---------|-----------|
| `story-code-map.json` | The master index | **No** (generated) |
| `story-code-overrides.yaml` | Manual metadata (db_tables, notes) | Yes |
| `gap-report.md` | Stories without **annotated** implementations | No (generated) |
| `orphan-report.md` | Files without **@story annotations** | No (generated) |

## Provenance & Status

The map now separates **evidence** from **hints**:

- `links.annotated` → files proven by `@story` tags (authoritative)
- `links.baseline` → files hinted by journey-test-matrix or feature-inventory

Status fields:
- `implementation_status` → computed from **annotated** links only
- `implementation_status_inferred` → computed from annotated + baseline links

## Code Annotations

Add `@story` JSDoc tags to link code to stories:

### Components

```typescript
/**
 * Quick Start Form Component
 * @story US-F01, US-FT01
 */
export function QuickStartForm() { ... }
```

### API Routes

```typescript
/**
 * @story US-F03, US-H01, US-H02
 */
export async function GET(request: NextRequest) { ... }
```

### E2E Tests

```typescript
/**
 * @story US-F01, US-FT01
 */
test.describe('Quick Start Form', () => { ... });
```

### Python (CrewAI / serverless)

```python
# @story US-H01, US-H06
def handle_checkpoint(payload):
    ...
```

### YAML (CrewAI config)

```yaml
# @story US-AB01
o1_interview_gap_analyzer:
  role: "Interview Gap Analyzer"
```

### Syntax Rules

- Single tag only: `@story US-F01`
- Multiple stories comma-separated: `@story US-F01, US-FT01, US-H01`
- No wildcards (explicit IDs only)
- Story IDs must exist in `stories/*.md`
- Agent stories use prefixes: `US-AB` (Brief), `US-AD` (Discovery), `US-ADB` (Desirability), `US-AFB` (Feasibility), `US-AVB` (Viability), `US-AH` (HITL)

## Override Rules

The override file (`story-code-overrides.yaml`) can ONLY contain:

| Field | Purpose | Example |
|-------|---------|---------|
| `db_tables` | Database tables used | `[onboarding_sessions, projects]` |
| `notes` | Context (ADR refs, etc.) | `"Quick Start replaced 7-stage (ADR-006)"` |
| `implementation_status` | Override auto-detected | `gap`, `partial`, `complete` |
| `domain_candidate` | Mark as future domain extraction | `true` |
| `domain_function` | Future function name | `calculate_fit_score` |

**Forbidden fields** (must come from annotations):
- `components`, `api_routes`, `pages`, `hooks`, `lib`, `e2e_tests`, `unit_tests`

Unknown fields are ignored and reported during validation.

## Lookup Examples

### Forward Lookup (Story → Files)

```bash
# Using jq
jq '.stories["US-F01"]' docs/traceability/story-code-map.json

# Output:
{
  "title": "Complete Quick Start Onboarding",
  "components": ["frontend/src/components/onboarding/QuickStartForm.tsx"],
  "api_routes": ["frontend/src/app/api/onboarding/start/route.ts"],
  "pages": ["frontend/src/app/onboarding/founder/page.tsx"],
  "e2e_tests": [{"file": "16-quick-start-founder.spec.ts"}],
  "links": {
    "annotated": {
      "components": ["frontend/src/components/onboarding/QuickStartForm.tsx"],
      "api_routes": ["frontend/src/app/api/onboarding/start/route.ts"],
      "pages": ["frontend/src/app/onboarding/founder/page.tsx"],
      "e2e_tests": [{"file": "16-quick-start-founder.spec.ts"}],
      "hooks": [],
      "lib": [],
      "unit_tests": []
    },
    "baseline": {
      "components": [],
      "api_routes": [],
      "pages": [],
      "e2e_tests": [],
      "hooks": [],
      "lib": [],
      "unit_tests": []
    }
  },
  "db_tables": ["onboarding_sessions", "projects", "entrepreneur_briefs"],
  "implementation_status": "complete",
  "implementation_status_inferred": "complete"
}
```

### Reverse Lookup (File → Stories)

```bash
jq '.files["frontend/src/components/onboarding/QuickStartForm.tsx"]' \
  docs/traceability/story-code-map.json

# Output:
{
  "stories": ["US-F01", "US-FT01"]
}
```

## Scan Scope

The generator scans these directories:

```
frontend/src/           # All frontend source
frontend/tests/e2e/     # E2E tests
backend/netlify/functions/  # Backend functions
netlify/functions/      # Serverless functions
../startupai.site/src   # Marketing site (cross-repo)
../startupai-crew/src   # CrewAI backend (cross-repo)
```

Extensions: `.ts`, `.tsx`, `.py`, `.yaml`, `.yml`

## Verification

```bash
# Verify annotations are greppable
grep -rE "@story\s+US-" frontend/src/ frontend/tests/e2e/ backend/netlify/functions/ netlify/functions/ ../startupai.site/src/ ../startupai-crew/src/ \
  --include="*.ts" --include="*.tsx" --include="*.py" --include="*.yaml" --include="*.yml"

# Verify regeneration is idempotent
pnpm traceability:generate
pnpm traceability:generate
git diff docs/traceability/story-code-map.json  # Should show no changes
```

## Integration with Claude

The `/story-lookup` skill uses this map for instant file discovery:

```
User: "Implement US-F04 (Archive Project)"
AI: [Reads story-code-map.json]
    → Components: ProjectsTab.tsx
    → API: /api/projects/[id]/route.ts
    → Test: 11-project-lifecycle.spec.ts
    [Begins work immediately]
```

## Adding New Stories

1. Add story definition to appropriate `stories/*.md`
2. Add `@story` annotations to code as you implement
3. Add override entry with `db_tables` if applicable
4. Run `pnpm traceability:generate`
5. Verify with `pnpm traceability:validate`

## Maintenance

- Run `pnpm traceability:validate` in CI (warns on missing annotations)
- Update `story-code-overrides.yaml` when db schema changes
- Regenerate after adding annotations: `pnpm traceability:generate`

## Subsystems

The traceability system includes additional validation tools:

| Subsystem | Purpose | Skill/Command |
|-----------|---------|---------------|
| [API Wiring](./api-wiring/README.md) | Validate API calls against route inventory across repos | `pnpm api-wiring:ci`, `pnpm api-wiring:generate` |
| [Schema Drift](./schema-drift/README.md) | Detect drift between Drizzle TypeScript and production Supabase columns | `/schema-drift` |
| [Schema Coverage](./schema-coverage.md) | Find tables referenced in code but missing from Drizzle schema | `/schema-coverage`, `pnpm schema:coverage` |
| FK Consistency | Validate foreign key type consistency across Drizzle schemas | `pnpm schema:fk`, `pnpm schema:fk:ci` |

## Related Docs

- [User Stories](../user-experience/stories/README.md)
- [Journey-Test Matrix](../testing/journey-test-matrix.md)
- [Feature Inventory](../features/feature-inventory.md)

# API Wiring Validation System

**Purpose:** Prevent broken API integrations from reaching production by validating app-repo callers against a merged, versioned API inventory from all three repos (app.startupai.site, startupai-crew, startupai.site).

## Quick Start

```bash
# Generate API inventory (this repo's routes)
pnpm api-inventory:generate

# Generate wiring map (callers → routes)
pnpm api-wiring:generate

# Validate (CI mode)
pnpm api-wiring:ci

# Validate with ecosystem checks (requires external repos)
pnpm api-wiring:ci:ecosystem

# Run tests
pnpm api-wiring:test
```

## Generated Files

| File | Purpose |
|------|---------|
| `api-inventory.json` | This repo's route definitions |
| `api-wiring-map.json` | Caller → route mappings with dependencies |
| `orphan-report.md` | Calls to non-existent routes |
| `e2e-coverage-report.md` | E2E test coverage gaps |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cross-Repo Validation                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  app.startupai.site          startupai-crew                 │
│  ┌─────────────────┐        ┌─────────────────┐            │
│  │ api-inventory   │        │ api-inventory   │            │
│  │ ~96 routes      │        │ ~15 routes      │            │
│  └────────┬────────┘        └────────┬────────┘            │
│           │                          │                      │
│           └──────────┬───────────────┘                      │
│                      ▼                                      │
│           ┌──────────────────┐                              │
│           │ Merged Inventory │                              │
│           └────────┬─────────┘                              │
│                    ▼                                        │
│           ┌──────────────────┐                              │
│           │   Reconciliation │ ← Callers from frontend      │
│           └────────┬─────────┘                              │
│                    ▼                                        │
│           ┌──────────────────┐                              │
│           │ api-wiring-map   │                              │
│           └──────────────────┘                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Validation Modes

### Single-Repo Mode (`pnpm api-wiring:ci`)

- Validates local routes and callers
- **Warns** on missing external inventories
- Suitable for regular CI

### Ecosystem Mode (`pnpm api-wiring:ci:ecosystem`)

- Validates across all repos
- **Fails** on missing/stale external inventories
- Suitable for nightly/release CI

## Issue Codes

| Code | Severity | Description |
|------|----------|-------------|
| `ORPHAN_CALL` | Error | Call to non-existent route |
| `INVENTORY_MISSING` | Error (ecosystem) | External inventory not found |
| `INVENTORY_STALE` | Error (ecosystem) | External inventory outdated |
| `INVENTORY_SCHEMA_MISMATCH` | Error | Incompatible inventory version |
| `EXCLUDED_ORPHAN` | Warning | Orphan in excluded file (tests, etc.) |
| `SKIPPED_CALLS` | Warning | Many unresolvable calls |
| `E2E_SPECIFIC_GAP` | Warning | E2E mock doesn't match route |
| `STALE_MAP` | Warning | Map needs regeneration |
| `HIGH_FANOUT` | Info | Route touches >5 tables |
| `E2E_WILDCARD` | Info | E2E uses wildcard mock |

## Cross-Repo Inventory Format

Each repo generates `api-inventory.json`:

```json
{
  "schema_version": "1.0",
  "repo": "startupai-crew",
  "generated_at": "2024-01-28T00:00:00Z",
  "routes": [
    {
      "path": "/kickoff",
      "methods": ["POST"],
      "type": "modal",
      "base_url": "https://startupai--crew.modal.run"
    }
  ]
}
```

### Inventory Locations

| Repo | Path |
|------|------|
| app.startupai.site | `docs/traceability/api-wiring/api-inventory.json` |
| startupai-crew | `docs/traceability/api-wiring/api-inventory.json` |
| startupai.site | `docs/traceability/api-wiring/api-inventory.json` |

## Detected Patterns

### Supported Call Patterns

```typescript
// Direct fetch
fetch('/api/projects')

// Template literal with variable
fetch(`/api/projects/${id}`)

// API wrapper
api.get('/projects')
api.post(`/projects/${projectId}`)

// Netlify functions
fetch('/.netlify/functions/crew-analyze')

// External URLs (cross-repo)
fetch('https://startupai--crew.modal.run/kickoff')
```

### Skipped Patterns (Unresolvable)

```typescript
// Variable prefix
fetch(`${baseUrl}/api/projects`)

// Runtime function
fetch(`/api/${getEndpoint()}`)

// Complex expression
fetch(condition ? '/api/a' : '/api/b')
```

## Exclusion Patterns

The following patterns are excluded from orphan reporting:

- Test files (`*.test.ts`, `*.spec.ts`, `__tests__/`)
- Known dead code (`useOnboardingRecovery.ts`, `useCrewAIState.ts`)
- Legacy directories (`/legacy/`)
- Mock files (`__mocks__/`)

## Integration with Quality Gate

The validation runs as part of the quality gate:

```json
{
  "quality-gate": "... && pnpm api-wiring:ci"
}
```

## Troubleshooting

### "Map not found" Error

Run the generators:

```bash
pnpm api-inventory:generate
pnpm api-wiring:generate
```

### "External inventory missing" Error (Ecosystem Mode)

Ensure sibling repos have inventories:

```bash
# In startupai-crew
cd ../startupai-crew
# Create docs/traceability/api-wiring/api-inventory.json
```

### "Orphan call" Error

Either:
1. Create the missing route
2. Remove the call if the feature isn't ready
3. Add to ORPHAN_EXCLUDE_PATTERNS if it's expected (tests, dead code)

### High Number of Skipped Calls

Review `skipped_calls` in the map. Consider:
- Using constant paths instead of variables
- Adding to SERVER_ROUTE_ALLOWLIST for valid server-side calls

## Development

### Adding New Call Patterns

Edit `scripts/api-wiring/config.ts`:

```typescript
// Add new regex pattern
export const NEW_PATTERN = /your-pattern/g;
```

Then update `core.ts` to use the pattern in `extractApiCalls()`.

### Adding External Repos

Edit `scripts/api-wiring/config.ts`:

```typescript
export const EXTERNAL_INVENTORIES: ExternalInventoryConfig[] = [
  // Add new repo
  {
    repo: 'new-repo',
    path: '../new-repo/docs/traceability/api-wiring/api-inventory.json',
    source_dir: '../new-repo/src/api',
  },
];
```

### Running Tests

```bash
pnpm api-wiring:test
```

## Related Documentation

- [Traceability System](../README.md)
- [Schema Coverage](../schema-coverage/README.md)
- [Schema Drift](../schema-drift/README.md)

# CLAUDE.md - StartupAI Product Platform

## Quick Reference
- **Status**: ~85% Complete (Phase Alpha)
- **Framework**: Next.js 15.5.3 (App Router + Pages Router)
- **Deployment**: Netlify
- **CLI Tools**: See `~/.claude/CLAUDE.md`
- **Master Architecture**: [`startupai-crew/docs/master-architecture/`](../startupai-crew/docs/master-architecture/)
- **Testing**: TDD with JDTD methodology - see [`docs/testing/tdd-workflow.md`](docs/testing/tdd-workflow.md)
- **E2E Anti-Patterns**: 8 patterns to avoid - see [`frontend/tests/e2e/TESTING-GUIDELINES.md`](frontend/tests/e2e/TESTING-GUIDELINES.md)

## Architecture
```
[Next.js Frontend] → [Supabase Backend] → [Vercel AI SDK] → [OpenAI/Anthropic]
                          ↓
                   [Drizzle ORM + pgvector]
                          ↓
                [Modal FastAPI + CrewAI Flows]
```

## Directory Structure
```
frontend/
├── app/           # App Router (new pages)
├── pages/         # Pages Router (legacy, migrating)
├── components/    # Shadcn UI + custom
├── lib/           # Utilities, hooks, Supabase client
├── db/            # Drizzle schema + migrations
└── styles/        # Tailwind config
```

## Debugging Rule
If a change doesn't work after one attempt, stop and verify the change is actually being applied before trying more fixes.

## Commands
```bash
pnpm dev              # Dev server (port 3000)
pnpm lint             # ESLint
pnpm type-check       # TypeScript
pnpm test             # Jest unit tests
pnpm test:e2e         # Playwright E2E
pnpm db:generate      # Generate Drizzle migration
pnpm db:push          # Push schema to Supabase
pnpm build            # Production build
```

## ExecPlans
- Use an ExecPlan (see `.agent/PLANS.md`) for complex features, cross-layer integrations, or significant refactors.
- ExecPlans are living documents; update them as decisions change.
- Execute milestone by milestone without asking for "next steps" between milestones unless blocked or scope changes.

## Package Management

Use `pnpm` for installs, upgrades, and scripts. Avoid `npm` for dependency changes.
When asked to upgrade dependencies, default to `pnpm up -L` unless a task specifies otherwise.

## Coding Standards

### TypeScript
- Strict mode enabled
- No `any` - use `unknown` or proper types
- Drizzle ORM only (no raw SQL)

### React
- Functional components with hooks
- Error boundaries for all routes
- Loading states with Suspense

### Database (Drizzle)
```typescript
// Always type-safe queries
const projects = await db.select().from(projectsTable).where(eq(projectsTable.userId, userId));
```

### API Routes
- Validate inputs with Zod
- Use Supabase Service Role only when needed

## Knowledge Index Lookup Protocol (MANDATORY)

**BEFORE using Glob, Grep, or any file search tool to find information, you MUST query the knowledge index first.**

### Step 1: Query the Index

```bash
# Find documents by topic
jq '.navigation.by_topic["<topic>"]' docs/traceability/unified-knowledge-index.json

# Search docs-registry for titles/categories
jq '.[] | select(.title | test("<keyword>"; "i"))' docs/traceability/docs-registry.json

# Check if a specific document type exists
jq '.[] | select(.category == "spec")' docs/traceability/docs-registry.json
```

### Step 2: Only Use File Search as Fallback

If the knowledge index doesn't contain what you need, THEN use Glob/Grep.

### Index Locations

| Index | Purpose |
|-------|---------|
| `docs/traceability/unified-knowledge-index.json` | Master navigation index |
| `docs/traceability/docs-registry.json` | All canonical documents |
| `docs/traceability/story-code-map.json` | Story ↔ code mappings |
| `docs/traceability/agent-indexes/*.json` | Per-agent curated docs |

## Traceability Protocol

**Self-sustaining story-code traceability.** Follow this protocol to maintain bidirectional links between user stories and code.

### Before Implementing Any US-* Story

1. **Query the knowledge index** first (see above)
2. **Look up the story** using `/story-lookup` or:
   ```bash
   jq '.stories["US-XXX"]' docs/traceability/story-code-map.json
   ```
3. **Read existing files** listed in the lookup
4. **Check gap report** if exploring a category: `docs/traceability/gap-report.md`

### While Implementing

Add `@story` annotations to every file you create or modify for a story:

```typescript
/**
 * Component description
 * @story US-F01, US-FT01
 */
export function MyComponent() { ... }
```

```python
# @story US-AD01, US-AD02
def discovery_task():
    ...
```

### After Implementing

1. **Regenerate the map**:
   ```bash
   pnpm traceability:generate
   ```
2. **Validate annotations**:
   ```bash
   pnpm traceability:validate
   ```

### Key Commands

| Command | Purpose |
|---------|---------|
| `pnpm traceability:generate` | Regenerate story-code-map.json |
| `pnpm traceability:validate` | Check for unknown/missing annotations |
| `pnpm traceability:gaps` | Show stories without implementations |

### Why This Matters

- **100x lookup speed**: Find all code for a story in <5 seconds
- **Self-documenting**: Code declares which stories it implements
- **Gap visibility**: Know what's unimplemented at a glance
- **Audit trail**: Every file links back to requirements

## Schema Validation

**Policy**: All tables queried in code MUST have Drizzle schemas.

### Validation Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `pnpm schema:fk` | Check FK type consistency | Before any commit with schema changes |
| `pnpm schema:fk:ci` | Same, exits with error if mismatches | CI/quality-gate |
| `pnpm schema:coverage` | Find tables missing Drizzle schemas | Debugging runtime errors |
| `/schema-drift` | Compare Drizzle vs production Supabase | Before deploying schema changes |

### Why This Matters

The original "invalid input syntax for type uuid" bug was caused by:
- `validation_progress.run_id` was UUID
- `validation_runs.run_id` was TEXT
- FK type mismatch caused runtime query failures

The `pnpm schema:fk` check catches this pattern before it reaches production.

## Quality Gates
- [ ] `NEXT_PUBLIC_ONBOARDING_BYPASS=false` in production
- [ ] No mock data in components
- [ ] No console.log (use proper logging)
- [ ] No hardcoded secrets
- [ ] TypeScript and ESLint errors resolved
- [ ] Test coverage >70%
- [ ] `pnpm schema:fk:ci` passes (no FK type mismatches)

## Integration Rules

Before creating UI components for CrewAI/Modal data:

1. **Audit existing components first** - Check `components/approvals/`, `components/vpc/`, `components/validation/`
2. **Check data transformation** - Is webhook handler populating correct fields?
3. **Map contracts** - Modal sends → Webhook transforms → Supabase stores → UI reads

Data flow: `Modal → /api/crewai/webhook → Supabase → Components`

## Key Tables
- `users` - Extended Supabase auth
- `projects` - User business ideas
- `hypotheses` - Testable assumptions
- `evidence` - Validation data with pgvector
- `onboarding_sessions` - AI chat state
- `entrepreneur_briefs` - Structured onboarding output

## Cross-Repo
- **Upstream**: `startupai-crew` (CrewAI backend)
- **Downstream**: `startupai.site` (marketing)
- **Blockers**: `docs/work/cross-repo-blockers.md`
- **Master Architecture**: `startupai-crew/docs/master-architecture/`

## Documentation
| Folder | Purpose |
|--------|---------|
| `docs/specs/` | Technical specs (auth, APIs, schema) |
| `docs/features/` | Feature specifications |
| `docs/testing/` | Test strategy, E2E guides |
| `docs/user-experience/` | Journey maps, personas, user stories |
| `docs/work/WORK.md` | **Main work tracker** (consolidated) |
| `docs/work/` | Detailed work files (in-progress, done, backlog) |

---
**Last Updated**: 2026-01-29

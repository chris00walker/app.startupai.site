# CLAUDE.md - StartupAI Product Platform

## Quick Reference
- **Status**: ~85% Complete (Phase Alpha)
- **Framework**: Next.js 15.5.3 (App Router + Pages Router)
- **Deployment**: Netlify
- **CLI Tools**: See `~/.claude/CLAUDE.md`
- **Master Architecture**: [`startupai-crew/docs/master-architecture/`](../startupai-crew/docs/master-architecture/)
- **Testing**: TDD with JDTD methodology - see [`docs/testing/tdd-workflow.md`](docs/testing/tdd-workflow.md)

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

## Critical: CSS Variables
**The only CSS file that matters:** `frontend/src/styles/globals.css`

- All CSS variables (colors, spacing, sidebar, etc.) go here
- `frontend/tailwind.css` in root is NOT imported - do not edit it
- Before editing any CSS variable, verify it exists in `globals.css`

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

## Traceability Protocol

**Self-sustaining story-code traceability.** Follow this protocol to maintain bidirectional links between user stories and code.

### Before Implementing Any US-* Story

1. **Look up the story** using `/story-lookup` or:
   ```bash
   jq '.stories["US-XXX"]' docs/traceability/story-code-map.json
   ```
2. **Read existing files** listed in the lookup
3. **Check gap report** if exploring a category: `docs/traceability/gap-report.md`

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

## Quality Gates
- [ ] `NEXT_PUBLIC_ONBOARDING_BYPASS=false` in production
- [ ] No mock data in components
- [ ] No console.log (use proper logging)
- [ ] No hardcoded secrets
- [ ] TypeScript and ESLint errors resolved
- [ ] Test coverage >70%

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
**Last Updated**: 2026-01-23

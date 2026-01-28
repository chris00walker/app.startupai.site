# Schema Drift Validator

Detects schema drift between local Drizzle TypeScript definitions and production Supabase database.

## Problem Statement

Schema drift occurs when the Drizzle TypeScript schema defines columns that don't exist in production. This causes runtime errors like:

```
PostgresError: column "raw_idea" does not exist
```

**Root cause:** Drizzle migrations and Supabase migrations are two independent systems with no relationship. A developer can add columns to the TypeScript schema without applying the corresponding migration to production.

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│  Drizzle Schema     │     │  Production DB      │
│  (TypeScript)       │     │  (Supabase MCP)     │
├─────────────────────┤     ├─────────────────────┤
│ frontend/src/db/    │     │ information_schema  │
│   schema/*.ts       │     │   .columns          │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           │    ┌──────────────────┐   │
           └───►│  /schema-drift   │◄──┘
                │  (Claude Skill)  │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │  Drift Report    │
                │  + Remediation   │
                └──────────────────┘
```

### Why Claude Skill (Not Bash Script)?

- Supabase MCP tools (`mcp__supabase__execute_sql`) are only available to Claude
- Script-based approach would require database credentials in environment variables (security risk)
- The skill combines local TypeScript parsing with remote database queries

### Two-Part Approach

1. **NPM Script** (`pnpm schema:expected`) - Parses local Drizzle files, outputs JSON
2. **Claude Skill** (`/schema-drift`) - Queries production via MCP, compares, reports

## Usage

### Invoke the Skill

```
/schema-drift
```

Or just ask Claude: "Check for schema drift" or "Why am I getting column not found errors?"

### Manual Commands

```bash
# Parse local Drizzle schema (outputs JSON)
pnpm schema:expected

# Run unit tests
pnpm schema:test
```

## When to Use

- **Before deploying** features that modify database schema
- **Debugging** "column does not exist" errors
- **Validating** database state after migrations
- **Pre-PR checks** for schema changes

## Output Examples

### No Drift

```
Schema Drift Report
===================
Status: NO DRIFT

Checked 33 tables, 450+ columns
All Drizzle schema columns exist in production.
```

### Drift Detected

```
Schema Drift Report
===================
Status: DRIFT DETECTED

Missing Columns (blocking - will cause query failures):
| Table    | Missing Column      |
|----------|---------------------|
| projects | raw_idea            |
| projects | hints               |

Remediation SQL:
ALTER TABLE projects ADD COLUMN IF NOT EXISTS raw_idea TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hints JSONB;

Run this via mcp__supabase__apply_migration or Supabase SQL Editor
```

## File Structure

```
scripts/schema-drift/
├── config.ts           # Constants, project ID, exclusions
├── schema.ts           # TypeScript type definitions
├── core.ts             # Pure parsing functions
├── analyze.ts          # CLI: outputs expected schema JSON
└── __tests__/
    └── run.ts          # Custom test harness

~/.claude/skills/schema-drift/
└── SKILL.md            # Claude skill definition
```

## How Parsing Works

The parser uses a **permissive regex pattern** that matches ANY function call with a string first argument:

```typescript
// Matches standard types
id: uuid('id').primaryKey()
name: text('name').notNull()

// Matches custom pgEnum types
role: userRoleEnum('role').default('founder')
platform: adPlatformEnum('platform').notNull()

// Matches complex types with options
budget: numeric('budget', { precision: 10, scale: 2 })
```

This avoids maintaining a list of all Drizzle column types.

## Comparison with /schema-check

| Skill | Compares | Purpose |
|-------|----------|---------|
| `/schema-check` | Drizzle vs Documentation (state-schemas.md) | Validate schema matches spec |
| `/schema-drift` | Drizzle vs Production Database | Detect unapplied migrations |

Both are valuable:
- **schema-check**: Spec compliance (design-time)
- **schema-drift**: Deployment validation (deploy-time)

## Extending the System

### Adding New Schema Files

1. Add export to `frontend/src/db/schema/index.ts`
2. The parser auto-discovers from index.ts exports
3. No configuration needed

### Handling New Column Types

The permissive regex handles any function with a string argument. No changes needed for:
- New Drizzle types (e.g., `vector()`, `citext()`)
- Custom pgEnum types
- Types with configuration objects

### Excluding Tables

Edit `scripts/schema-drift/config.ts`:

```typescript
export const EXCLUDE_TABLES = [
  '_prisma_migrations',
  'schema_migrations',
  'your_excluded_table',
];
```

## Limitations

1. **Not automated in CI** - Requires Claude invocation (MCP dependency)
2. **Extra columns info only** - Production may have columns not in Drizzle; reported but not flagged as errors
3. **Type matching not checked** - Only column existence, not type compatibility
4. **Manual remediation** - Generates SQL but doesn't auto-apply without confirmation
5. **Block comments** - Columns inside `/* */` would be incorrectly parsed

## Troubleshooting

### Script Errors

```bash
# Ensure dependencies installed
pnpm install

# Check schema directory exists
ls frontend/src/db/schema/

# Run tests to verify parsing
pnpm schema:test
```

### MCP Errors

If `mcp__supabase__execute_sql` fails:
1. Verify project ID in `scripts/schema-drift/config.ts`
2. Test connectivity: ask Claude to run `mcp__supabase__list_projects`
3. Check MCP server status

## Related Documentation

- [Traceability System](../README.md) - Story-to-code mapping
- [Data Schema](../../specs/data-schema.md) - Local schema specification
- [State Schemas](../../../../startupai-crew/docs/master-architecture/reference/state-schemas.md) - Master architecture state schemas
- [Supabase Config](../../specs/supabase.md) - Supabase configuration

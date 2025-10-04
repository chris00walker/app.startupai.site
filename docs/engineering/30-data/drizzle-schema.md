# Drizzle ORM Schema Documentation

**Status:** ✅ Complete (4 Tables Deployed with RLS)  
**Last Updated:** October 2, 2025  
**Database:** Supabase PostgreSQL (StartupAI - `eqxropalhxjeyvfcoyxg`)

---

## Overview

This document describes the Drizzle ORM schema implementation for the StartupAI application. The schema provides type-safe database operations for user profiles, projects, evidence collection, and AI-generated reports.

**Related Documentation:**
- [Supabase Setup](./supabase-setup.md)
- [Master Implementation Guide](../../../../startupai.site/docs/technical/two-site-implementation-plan.md) - Database architecture

---

## Schema Files

### Location
All schema files are located in `frontend/src/db/schema/`:

```
frontend/src/db/schema/
├── index.ts         # Schema exports
├── users.ts         # User profiles
├── projects.ts      # User projects
├── evidence.ts      # Evidence with vector embeddings
└── reports.ts       # AI-generated reports
```

### Database Architecture Decision

**Browser vs Server Queries:**

When building React applications with Supabase, it's critical to use the right client for the right context:

#### ✅ **Browser Queries (React Hooks)**
```typescript
// In Client Components ('use client')
import { createClient } from '@/lib/supabase/client';

export function useProjects() {
  const supabase = createClient();
  const { data } = await supabase.from('projects').select('*');
  return data;
}
```

#### ✅ **Server Queries (API Routes/Server Components)**
```typescript
// In API Routes and Server Components
import { db } from '@/db/client';

export async function GET() {
  const data = await db.select().from(projects);
  return Response.json(data);
}
```

**Rule of Thumb:**
- **Client Components** → Supabase client (browser-compatible)
- **Server Components/API Routes** → Drizzle ORM (Node.js)
- **Never mix** → Don't import Drizzle in client components

---

## Schema Files

---

## Tables

### 1. user_profiles

Stores user profile information linked to Supabase Auth.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | References auth.users(id) |
| `email` | TEXT | NOT NULL | User email address |
| `full_name` | TEXT | NULLABLE | User's full name |
| `company` | TEXT | NULLABLE | Company name |
| `subscription_tier` | TEXT | DEFAULT 'free', NOT NULL | Subscription level |
| `subscription_status` | TEXT | DEFAULT 'trial' | Account status |
| `trial_expires_at` | TIMESTAMPTZ | NULLABLE | Trial expiration date |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Last update timestamp |

**TypeScript Types:**
```typescript
type UserProfile = typeof userProfiles.$inferSelect;
type NewUserProfile = typeof userProfiles.$inferInsert;
```

---

### 2. projects

Stores user projects for evidence-led strategy development with comprehensive portfolio management.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Project identifier |
| `user_id` | UUID | FOREIGN KEY → user_profiles(id), CASCADE | Project owner |
| `name` | TEXT | NOT NULL | Project name |
| `description` | TEXT | NULLABLE | Project description |
| `status` | TEXT | DEFAULT 'active', NOT NULL | Project status |

#### Portfolio Management Fields (Added Oct 2, 2025)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `stage` | TEXT | DEFAULT 'DESIRABILITY', CHECK (stage IN (...)) | Current validation stage |
| `gate_status` | TEXT | DEFAULT 'Pending', CHECK (gate_status IN (...)) | Gate passage status |
| `risk_budget_planned` | DECIMAL(10,2) | DEFAULT 0 | Planned risk budget allocation |
| `risk_budget_actual` | DECIMAL(10,2) | DEFAULT 0 | Actual risk budget spent |
| `risk_budget_delta` | DECIMAL(10,2) | DEFAULT 0 | Budget variance percentage |
| `assigned_consultant` | TEXT | NULLABLE | Consultant name |
| `last_activity` | TIMESTAMPTZ | DEFAULT NOW() | Last activity timestamp |
| `next_gate_date` | DATE | NULLABLE | Next gate assessment date |
| `evidence_quality` | DECIMAL(3,2) | DEFAULT 0, CHECK (0-1) | Overall evidence quality score |
| `hypotheses_count` | INTEGER | DEFAULT 0 | Number of hypotheses defined |
| `experiments_count` | INTEGER | DEFAULT 0 | Number of experiments conducted |
| `evidence_count` | INTEGER | DEFAULT 0 | Total evidence items collected |

**Foreign Keys:**
- `user_id` → `user_profiles(id)` ON DELETE CASCADE

**TypeScript Types:**
```typescript
type Project = typeof projects.$inferSelect;
type NewProject = typeof projects.$inferInsert;
```

**Portfolio Project Mapping:**
Database fields automatically transform to UI `PortfolioProject` type:
```typescript
// Database (snake_case)
{
  name: "TechStart Inc.",
  gate_status: "Pending",
  risk_budget_planned: 5.0,
  last_activity: "2025-10-02T18:30:00Z"
}

// ↓ Transforms to ↓

// UI (PortfolioProject camelCase)
{
  clientName: "TechStart Inc.",
  gateStatus: "Pending",
  riskBudget: { planned: 5.0, ... },
  lastActivity: "2 hours ago"
}
```

---

### 3. evidence

Stores evidence with vector embeddings for semantic search.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Evidence identifier |
| `project_id` | UUID | FOREIGN KEY → projects(id), CASCADE | Parent project |
| `content` | TEXT | NOT NULL | Evidence content |
| `embedding` | VECTOR(1536) | NULLABLE | OpenAI embedding vector |
| `source_type` | TEXT | NULLABLE | Source type (user_input, web_scrape, etc.) |
| `source_url` | TEXT | NULLABLE | Source URL if applicable |
| `tags` | TEXT[] | NULLABLE | Array of tags |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Last update timestamp |

**Foreign Keys:**
- `project_id` → `projects(id)` ON DELETE CASCADE

**Vector Search:**
- Uses pgvector extension with 1536 dimensions (OpenAI ada-002)
- Supports semantic similarity search using cosine distance

**TypeScript Types:**
```typescript
type Evidence = typeof evidence.$inferSelect;
type NewEvidence = typeof evidence.$inferInsert;
```

---

### 4. reports

Stores AI-generated reports and insights.

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Report identifier |
| `project_id` | UUID | FOREIGN KEY → projects(id), CASCADE | Parent project |
| `report_type` | TEXT | NOT NULL | Type of report |
| `title` | TEXT | NOT NULL | Report title |
| `content` | JSONB | NOT NULL | Report content (flexible structure) |
| `model` | TEXT | NULLABLE | AI model used (gpt-4, claude-3, etc.) |
| `tokens_used` | TEXT | NULLABLE | Token usage tracking |
| `generated_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Generation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Last update timestamp |

**Foreign Keys:**
- `project_id` → `projects(id)` ON DELETE CASCADE

**TypeScript Types:**
```typescript
type Report = typeof reports.$inferSelect;
type NewReport = typeof reports.$inferInsert;
```

---

## Entity Relationships

```
user_profiles (1) ──< (n) projects
                              │
                              ├──< (n) evidence
                              │
                              └──< (n) reports
```

**Cascade Deletes:**
- Deleting a user profile → deletes all projects
- Deleting a project → deletes all evidence and reports

---

## Usage Examples

### Connecting to Database

```typescript
import { db } from '@/db/client';
import { userProfiles, projects, evidence, reports } from '@/db/schema';
```

### Creating a Project

```typescript
const newProject = await db.insert(projects).values({
  userId: user.id,
  name: 'My Startup Strategy',
  description: 'Evidence-led validation for SaaS product',
}).returning();
```

### Querying with Relations

```typescript
import { eq } from 'drizzle-orm';

const userProjects = await db
  .select()
  .from(projects)
  .where(eq(projects.userId, userId));
```

### Vector Search (via SQL)

```typescript
// Semantic search for similar evidence
const similarEvidence = await db.execute`
  SELECT * FROM evidence
  WHERE project_id = ${projectId}
    AND embedding <=> ${queryEmbedding} < ${threshold}
  ORDER BY embedding <=> ${queryEmbedding}
  LIMIT 10
`;
```

---

## Database Scripts

Available in `package.json`:

```bash
# Generate migrations from schema
pnpm run db:generate

# Push schema to database
pnpm run db:push

# Run migrations
pnpm run db:migrate

# Open Drizzle Studio (database GUI)
pnpm run db:studio

# Introspect database
pnpm run db:introspect
```

---

## Extensions Required

The following PostgreSQL extensions must be enabled:

- ✅ `vector` - pgvector for embeddings (enabled)
- ✅ `uuid-ossp` - UUID generation (enabled)
- ✅ `pg_net` - HTTP requests (enabled)
- ✅ `hstore` - Key-value storage (enabled)

---

## Configuration Files

### drizzle.config.ts

Located at project root, configures Drizzle Kit:

```typescript
export default defineConfig({
  schema: './frontend/src/db/schema/index.ts',
  out: './frontend/src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
```

### Environment Variables

Required in `frontend/.env.local`:

```bash
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## Next Steps

1. **Enable Row Level Security (RLS)**
   - Add RLS policies for secure multi-tenant access
   - See [Master Implementation Guide](../../../../startupai.site/docs/technical/two-site-implementation-plan.md#33-database-architecture)

2. **Add Indexes**
   - Create indexes for frequently queried columns
   - Add vector indexes for semantic search (HNSW or IVFFlat)

3. **Implement Database Queries**
   - Create type-safe query functions
   - Add pagination and filtering utilities

4. **Connect to Frontend**
   - Integrate with Next.js Server Actions
   - Add React Query for data fetching

---

**Status:** ✅ Schema implemented and deployed  
**Tables:** 4 tables with proper foreign key relationships  
**Next:** Row Level Security implementation

---
purpose: "User stories for design asset infrastructure - storage, generation tracking, and Figma integration"
status: "active"
last_reviewed: "2026-01-30"
last_updated: "2026-01-30"
---

# Design Asset Infrastructure User Stories

Stories for implementing design asset storage, generation tracking, and Figma integration infrastructure.

## Design Philosophy

Design agents generate visual assets (illustrations, backgrounds, marketing images) that need:
1. **Persistent storage** - Assets stored in Supabase Storage with metadata
2. **Cost tracking** - Every DALL-E generation logged with costs
3. **Workflow state** - Assets progress from draft to approved/rejected
4. **Figma linkage** - Assets can be linked to Figma node IDs for bidirectional sync

---

### US-DA01: Design Asset Storage

**As a** design agent,
**I want to** store generated design assets (illustrations, backgrounds, marketing images) with metadata,
**So that** they can be retrieved, reused, and tracked across projects.

**Acceptance Criteria:**

**Given** a design agent generates an image
**When** the asset is stored
**Then** the following requirements are met:

### Storage Requirements

| Requirement | Implementation |
|-------------|----------------|
| Storage location | Supabase Storage bucket `design-assets` |
| Path structure | `{project_id}/{asset_type}/{filename}` |
| File formats | PNG, JPEG, WebP, SVG |
| Max file size | 10MB per asset |
| Access control | Project-scoped RLS policies |

### Metadata Schema

```typescript
interface DesignAsset {
  id: string;                    // UUID primary key
  project_id: string;            // FK to projects

  // Asset identification
  asset_type: 'illustration' | 'background' | 'marketing' | 'icon' | 'logo';
  name: string;                  // Human-readable name
  description: string | null;    // What this asset depicts

  // Storage reference
  storage_path: string;          // Path in Supabase Storage
  public_url: string;            // CDN URL for access

  // Generation metadata
  prompt: string | null;         // DALL-E prompt used
  model: string | null;          // e.g., "dall-e-3"
  dimensions: {
    width: number;
    height: number;
  };
  quality: 'standard' | 'hd';
  generation_cost_cents: number; // Cost in cents (e.g., 4 for $0.04)

  // Workflow state
  status: 'draft' | 'review' | 'approved' | 'rejected';
  reviewed_by: string | null;    // User ID who reviewed
  reviewed_at: string | null;    // Timestamp of review
  rejection_reason: string | null;

  // Figma integration
  figma_node_id: string | null;  // Figma node this asset is linked to
  figma_file_key: string | null; // Figma file containing the node

  // Timestamps
  created_at: string;
  updated_at: string;
}
```

### Drizzle Schema

```typescript
// frontend/db/schema/design-assets.ts
import { pgTable, uuid, text, integer, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const assetTypeEnum = pgEnum('asset_type', [
  'illustration', 'background', 'marketing', 'icon', 'logo'
]);

export const assetStatusEnum = pgEnum('asset_status', [
  'draft', 'review', 'approved', 'rejected'
]);

export const assetQualityEnum = pgEnum('asset_quality', [
  'standard', 'hd'
]);

export const designAssets = pgTable('design_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id),

  assetType: assetTypeEnum('asset_type').notNull(),
  name: text('name').notNull(),
  description: text('description'),

  storagePath: text('storage_path').notNull(),
  publicUrl: text('public_url').notNull(),

  prompt: text('prompt'),
  model: text('model'),
  dimensions: jsonb('dimensions').$type<{ width: number; height: number }>(),
  quality: assetQualityEnum('quality').default('standard'),
  generationCostCents: integer('generation_cost_cents').default(0),

  status: assetStatusEnum('status').default('draft').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),

  figmaNodeId: text('figma_node_id'),
  figmaFileKey: text('figma_file_key'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/projects/[id]/assets` | GET | List assets for project |
| `/api/projects/[id]/assets` | POST | Create new asset record |
| `/api/assets/[id]` | GET | Get asset details |
| `/api/assets/[id]` | PATCH | Update asset (status, metadata) |
| `/api/assets/[id]` | DELETE | Delete asset |
| `/api/assets/[id]/approve` | POST | Approve asset |
| `/api/assets/[id]/reject` | POST | Reject asset with reason |

### RLS Policies

```sql
-- Users can view assets in their projects
CREATE POLICY "Users can view project assets" ON design_assets
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can create assets in their projects
CREATE POLICY "Users can create project assets" ON design_assets
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can update their project assets
CREATE POLICY "Users can update project assets" ON design_assets
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
```

**Files:**
- `frontend/db/schema/design-assets.ts` (NEW)
- `frontend/src/app/api/projects/[id]/assets/route.ts` (NEW)
- `frontend/src/app/api/assets/[id]/route.ts` (NEW)
- `supabase/migrations/XXXX_design_assets.sql` (NEW)

**Blocking:** US-AT12 (AI Image Generation), Figma integration features

---

### US-DA02: Design Generation Logging

**As a** system administrator,
**I want to** track all DALL-E image generation calls with costs,
**So that** I can monitor budget usage and optimize generation patterns.

**Acceptance Criteria:**

**Given** an image generation request is made
**When** the API call completes (success or failure)
**Then** the generation is logged with full details:

### Log Schema

```typescript
interface DesignGenerationLog {
  id: string;                    // UUID primary key
  project_id: string | null;     // FK to projects (null for system generations)
  asset_id: string | null;       // FK to design_assets if asset created

  // Request details
  prompt: string;                // Full prompt sent to DALL-E
  model: string;                 // "dall-e-3" or "dall-e-2"
  dimensions: {
    width: number;               // 1024, 1792, etc.
    height: number;
  };
  quality: 'standard' | 'hd';
  style: 'natural' | 'vivid' | null; // DALL-E 3 style parameter

  // Response details
  status: 'success' | 'failed' | 'filtered';
  error_message: string | null;  // Error details if failed
  error_code: string | null;     // API error code if applicable

  // Cost tracking
  cost_cents: number;            // Actual cost in cents

  // Performance metrics
  request_duration_ms: number;   // Time to complete request

  // Context
  triggered_by: 'agent' | 'user' | 'system';
  agent_name: string | null;     // Which agent triggered (if agent)
  user_id: string | null;        // Which user triggered (if user)

  // Timestamps
  created_at: string;
}
```

### Drizzle Schema

```typescript
// frontend/db/schema/design-generation-logs.ts
import { pgTable, uuid, text, integer, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const generationStatusEnum = pgEnum('generation_status', [
  'success', 'failed', 'filtered'
]);

export const generationTriggerEnum = pgEnum('generation_trigger', [
  'agent', 'user', 'system'
]);

export const designGenerationLogs = pgTable('design_generation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id),
  assetId: uuid('asset_id').references(() => designAssets.id),

  prompt: text('prompt').notNull(),
  model: text('model').notNull(),
  dimensions: jsonb('dimensions').$type<{ width: number; height: number }>().notNull(),
  quality: assetQualityEnum('quality').notNull(),
  style: text('style'),

  status: generationStatusEnum('status').notNull(),
  errorMessage: text('error_message'),
  errorCode: text('error_code'),

  costCents: integer('cost_cents').notNull(),
  requestDurationMs: integer('request_duration_ms'),

  triggeredBy: generationTriggerEnum('triggered_by').notNull(),
  agentName: text('agent_name'),
  userId: uuid('user_id').references(() => users.id),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Index for cost aggregation queries
// CREATE INDEX idx_generation_logs_project_created ON design_generation_logs(project_id, created_at);
// CREATE INDEX idx_generation_logs_status ON design_generation_logs(status);
```

### Cost Calculation

| Model | Size | Quality | Cost |
|-------|------|---------|------|
| dall-e-3 | 1024x1024 | standard | $0.040 |
| dall-e-3 | 1024x1024 | hd | $0.080 |
| dall-e-3 | 1024x1792 | standard | $0.080 |
| dall-e-3 | 1024x1792 | hd | $0.120 |
| dall-e-3 | 1792x1024 | standard | $0.080 |
| dall-e-3 | 1792x1024 | hd | $0.120 |
| dall-e-2 | 1024x1024 | - | $0.020 |
| dall-e-2 | 512x512 | - | $0.018 |
| dall-e-2 | 256x256 | - | $0.016 |

### Logging Service

```typescript
// frontend/src/lib/design/generation-logger.ts

export interface GenerationLogInput {
  projectId?: string;
  prompt: string;
  model: string;
  dimensions: { width: number; height: number };
  quality: 'standard' | 'hd';
  style?: 'natural' | 'vivid';
  triggeredBy: 'agent' | 'user' | 'system';
  agentName?: string;
  userId?: string;
}

export interface GenerationLogResult {
  logId: string;
  assetId?: string;
  status: 'success' | 'failed' | 'filtered';
  errorMessage?: string;
  costCents: number;
  durationMs: number;
}

export async function logGeneration(
  input: GenerationLogInput,
  result: GenerationLogResult
): Promise<void> {
  await db.insert(designGenerationLogs).values({
    projectId: input.projectId,
    assetId: result.assetId,
    prompt: input.prompt,
    model: input.model,
    dimensions: input.dimensions,
    quality: input.quality,
    style: input.style,
    status: result.status,
    errorMessage: result.errorMessage,
    costCents: result.costCents,
    requestDurationMs: result.durationMs,
    triggeredBy: input.triggeredBy,
    agentName: input.agentName,
    userId: input.userId,
  });
}

export function calculateCost(
  model: string,
  dimensions: { width: number; height: number },
  quality: 'standard' | 'hd'
): number {
  const isLarge = dimensions.width > 1024 || dimensions.height > 1024;

  if (model === 'dall-e-3') {
    if (isLarge) {
      return quality === 'hd' ? 12 : 8; // cents
    }
    return quality === 'hd' ? 8 : 4; // cents
  }

  if (model === 'dall-e-2') {
    if (dimensions.width >= 1024) return 2;
    if (dimensions.width >= 512) return 1.8;
    return 1.6;
  }

  return 0;
}
```

### Admin Dashboard Queries

```typescript
// Get total cost for a project
const projectCost = await db
  .select({ total: sql<number>`sum(cost_cents)` })
  .from(designGenerationLogs)
  .where(eq(designGenerationLogs.projectId, projectId));

// Get daily cost breakdown
const dailyCosts = await db
  .select({
    date: sql<string>`date_trunc('day', created_at)`,
    total: sql<number>`sum(cost_cents)`,
    count: sql<number>`count(*)`,
  })
  .from(designGenerationLogs)
  .where(gte(designGenerationLogs.createdAt, thirtyDaysAgo))
  .groupBy(sql`date_trunc('day', created_at)`)
  .orderBy(sql`date_trunc('day', created_at)`);

// Get failure rate
const failureRate = await db
  .select({
    status: designGenerationLogs.status,
    count: sql<number>`count(*)`,
  })
  .from(designGenerationLogs)
  .groupBy(designGenerationLogs.status);
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/generation-logs` | GET | List all generation logs (admin) |
| `/api/admin/generation-logs/stats` | GET | Aggregated statistics |
| `/api/projects/[id]/generation-costs` | GET | Project-specific costs |

**Files:**
- `frontend/db/schema/design-generation-logs.ts` (NEW)
- `frontend/src/lib/design/generation-logger.ts` (NEW)
- `frontend/src/app/api/admin/generation-logs/route.ts` (NEW)
- `supabase/migrations/XXXX_design_generation_logs.sql` (NEW)

**Related:** US-AT12 (AI Image Generation), US-DA01 (Design Asset Storage)

---

## Implementation Priority

| Priority | Story | Dependencies | Est. Hours |
|----------|-------|--------------|------------|
| P0 | US-DA01 | None | 4h |
| P0 | US-DA02 | US-DA01 (for asset_id FK) | 3h |

**Total: ~7 hours**

---

## Cross-References

| Document | Relationship |
|----------|--------------|
| [asset-templates.md](./asset-templates.md) | US-AT12 uses design asset storage |
| [core-infrastructure.md](./core-infrastructure.md) | Supabase Storage patterns |
| [state-schemas.md](../../../../../startupai-crew/docs/master-architecture/reference/state-schemas.md) | State schema patterns |

---

**Last Updated**: 2026-01-30

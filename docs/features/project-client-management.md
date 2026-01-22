---
purpose: "Project and Client management feature specification"
status: "active"
last_reviewed: "2026-01-14"
---

# Project & Client Management

## Overview

This feature enables:
1. **Founders** to archive or permanently delete their validation projects
2. **Consultants** to archive client relationships without affecting client data

Both features are accessed via the **Settings** page with role-aware tabs.

## Role-Based Access Matrix

### Project Operations (Founders)

| Operation | Founder | Consultant |
|-----------|---------|------------|
| Archive Project | Yes | No |
| Unarchive Project | Yes | No |
| Delete Project | Yes | No |

### Client Operations (Consultants)

| Operation | Founder | Consultant |
|-----------|---------|------------|
| Archive Client | No | Yes |
| Unarchive Client | No | Yes |

**Critical Constraint**: Client archive NEVER affects Founder's actual project data. Archiving a client only hides them from the Consultant's portfolio view.

## UI Location

Settings page (`/settings`) with role-aware tabs:
- **Founders see**: Projects tab (7th tab)
- **Consultants see**: Clients tab (7th tab)

Both include a "Danger Zone" section styled with red border/background for destructive actions.

---

## Feature 1: Project Management (Founders)

### User Stories

Stories defined in [`stories/README.md`](../user-experience/stories/README.md):

- **US-F04**: As a Founder, I want to archive a project so I can hide it from my dashboard without losing data
- **US-F05**: As a Founder, I want to delete a project permanently when I no longer need it and want to free up resources
- (US-F04 includes unarchive as part of the archive story)

### Existing Infrastructure

| Component | File | Status |
|-----------|------|--------|
| `archiveProject()` | `frontend/src/db/queries/projects.ts:94-96` | Exists |
| `deleteProject()` | `frontend/src/db/queries/projects.ts:85-89` | Exists |
| `projects.status` | `frontend/src/db/schema/projects.ts:24` | Supports `active\|archived\|completed` |
| `getActiveUserProjects()` | `frontend/src/db/queries/projects.ts:25-36` | Filters by `status: active` |

### Archive Flow

1. Navigate to Settings → Projects tab
2. Select project from dropdown
3. Click "Archive Project" button
4. Confirmation toast: "Project archived. You can restore it anytime."
5. Project `status` → `archived`
6. Hidden from dashboard (can show with "Include archived" filter)

### Unarchive Flow

1. Navigate to Settings → Projects tab
2. Toggle "Show archived projects"
3. Select archived project from dropdown
4. Click "Restore Project" button
5. Project `status` → `active`
6. Visible on dashboard again

### Delete Flow (Danger Zone)

1. Navigate to Settings → Projects tab
2. Select project from dropdown
3. Review impact summary showing what will be deleted:
   - X hypotheses
   - Y evidence items
   - Z experiments
   - All AI analysis reports
   - All canvas data (VPC, BMC, TBI)
4. Click "Delete Forever" button (red, destructive style)
5. AlertDialog appears with type-to-confirm:
   - Title: "Are you absolutely sure?"
   - Description: "This action cannot be undone..."
   - Input: Type project name to confirm
6. Click "Yes, delete project" (disabled until name matches)
7. Hard delete with cascade

### Data Impact

**Archive (soft delete)**:
- `projects.status` → `'archived'`
- All related data preserved
- Reversible via unarchive

**Delete (hard delete)**:
- `DELETE FROM projects WHERE id = ?`
- Cascade deletes (via `onDelete: 'cascade'` in schema):
  - `hypotheses`
  - `evidence` (including pgvector embeddings)
  - `experiments`
  - `reports`
  - `crewai_validation_states`
  - `value_proposition_canvas`
  - `business_model_canvas`

---

## Feature 2: Client Management (Consultants)

### User Stories

Stories defined in [`stories/README.md`](../user-experience/stories/README.md):

- **US-C05**: As a Consultant, I want to archive a client relationship when I'm no longer actively working with them
- (US-C05 includes restore as part of the archive story)
- **Critical Constraint**: Archiving must NOT affect client's actual project data

### Current Data Model

The Consultant-Client relationship is tracked via:

| Table | Field | Purpose |
|-------|-------|---------|
| `user_profiles` | `consultant_id` | Links Founder to their Consultant |
| `clients` | `consultant_id` | Legacy table with `status` field |

**Note**: `useClients` hook queries `user_profiles` with `consultant_id`, not the `clients` table.

### Archive Flow

1. Navigate to Settings → Clients tab
2. Select client from dropdown
3. Click "Archive Client" button
4. Confirmation toast: "Client archived. Their projects are unchanged."
5. Client hidden from portfolio dashboard
6. **Founder's projects are completely UNCHANGED**

### Unarchive Flow

1. Navigate to Settings → Clients tab
2. Toggle "Show archived clients"
3. Select archived client from dropdown
4. Click "Restore Client" button
5. Client visible in portfolio dashboard again

### Data Approach Options

Since archiving a client should NOT touch Founder data, we need a separate mechanism:

**Option 1: Add `archived_clients` junction table** (Recommended)
```sql
CREATE TABLE archived_clients (
  consultant_id UUID REFERENCES user_profiles(id),
  client_id UUID REFERENCES user_profiles(id),
  archived_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (consultant_id, client_id)
);
```
- Pros: Clean separation, doesn't modify user_profiles
- Cons: Additional table

**Option 2: Use existing `clients` table**
- Set `clients.status = 'archived'`
- Pros: Table already exists with status field
- Cons: May be legacy/unused, unclear relationship to user_profiles

**Option 3: Add `archived_by_consultant` JSONB to user_profiles**
- Store array of consultant IDs who archived this client
- Pros: No new tables
- Cons: Awkward query pattern

### Data Impact

**Archive**:
- Consultant's view is filtered
- Founder's `user_profiles` record unchanged
- Founder's `projects` unchanged
- All validation data preserved

---

## API Endpoints

### Project Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| PATCH | `/api/projects/[id]` | Archive/unarchive project | Founder (owner) |
| DELETE | `/api/projects/[id]` | Permanently delete project | Founder (owner) |

**PATCH /api/projects/[id]**
```typescript
// Request
{ status: 'archived' | 'active' }

// Response
{ success: true, project: { id, status, ... } }
```

**DELETE /api/projects/[id]**
```typescript
// Response
{ success: true }

// Errors
{ error: 'Unauthorized' } // 401 - not logged in
{ error: 'Forbidden - you do not own this project' } // 403
{ error: 'Project not found' } // 404
```

### Client Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| PATCH | `/api/clients/[id]/archive` | Archive/unarchive client | Consultant |

**PATCH /api/clients/[id]/archive**
```typescript
// Request
{ archived: true | false }

// Response
{ success: true }
```

---

## UI Components

### Settings → Projects Tab (Founders)

```
┌─────────────────────────────────────────────────────┐
│  📁 Project Management                              │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Select project: [StartupAI ▼]                     │
│                                                     │
│  [ ] Show archived projects                        │
│                                                     │
│  [📦 Archive Project]  [🔄 Restore Project]        │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ⚠️ Danger Zone                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ This will permanently delete:               │   │
│  │ • 12 hypotheses                             │   │
│  │ • 34 evidence items                         │   │
│  │ • 8 experiments                             │   │
│  │ • All AI analysis reports                   │   │
│  │ • All canvas data                           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [🗑️ Delete Project Forever]                       │
└─────────────────────────────────────────────────────┘
```

### Settings → Clients Tab (Consultants)

```
┌─────────────────────────────────────────────────────┐
│  👥 Client Management                               │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Select client: [Acme Corp - John Doe ▼]           │
│                                                     │
│  [ ] Show archived clients                         │
│                                                     │
│  [📦 Archive Client]  [🔄 Restore Client]          │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  ℹ️ Archiving a client hides them from your        │
│     portfolio. Their projects are not affected.    │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Project Management (Founders)

- [x] Create `DELETE /api/projects/[id]` endpoint with ownership verification
- [x] Create `PATCH /api/projects/[id]` endpoint for status updates
- [x] Add `deleteProject` mutation to `useProjects` hook
- [x] Add `archiveProject` / `unarchiveProject` mutations to `useProjects` hook
- [x] Create `ProjectsTab` component for Settings page
- [x] Add project selector dropdown
- [x] Add archive/restore buttons with confirmation
- [x] Create delete AlertDialog with type-to-confirm
- [x] Show deletion impact summary (count of related records)
- [ ] Add "Show archived" filter to Founder dashboard (optional, can use Settings)

### Client Management (Consultants)

- [x] Decide on data approach (junction table vs existing table) → Junction table chosen
- [x] Create database migration for chosen approach (`archived_clients` table)
- [x] Create `PATCH /api/clients/[id]/archive` endpoint
- [x] Add `archiveClient` / `unarchiveClient` mutations to `useClients` hook
- [x] Create `ClientsTab` component for Settings page
- [x] Add client selector dropdown
- [x] Add archive/restore buttons with confirmation
- [ ] Add "Show archived" filter to Consultant dashboard (optional, can use Settings)

### Settings Page Updates

- [x] Add 7th tab (Projects for Founders, Clients for Consultants)
- [x] Implement role-based tab visibility
- [x] Style Danger Zone section with red border/background (Projects only - Clients uses info styling)

---

## Related Files

### Existing Implementation
- `frontend/src/db/queries/projects.ts` - `deleteProject()`, `archiveProject()` functions
- `frontend/src/db/schema/projects.ts` - Project schema with status field
- `frontend/src/hooks/useProjects.ts` - Project data fetching hook
- `frontend/src/hooks/useClients.ts` - Client data fetching hook
- `frontend/src/pages/settings.tsx` - Settings page (6 tabs currently)
- `frontend/src/components/ui/alert-dialog.tsx` - AlertDialog component

### Created (Jan 14, 2026)
- `frontend/src/app/api/projects/[id]/route.ts` - GET + PATCH + DELETE endpoints ✅
- `frontend/src/app/api/clients/[id]/archive/route.ts` - Archive endpoint ✅
- `frontend/src/components/settings/ProjectsTab.tsx` - Projects tab component ✅
- `frontend/src/components/settings/ClientsTab.tsx` - Clients tab component ✅

### Database Tables Created
- `archived_clients` - Junction table for consultant-client archive relationships

---

## Security Considerations

1. **Ownership Verification**: DELETE/PATCH endpoints must verify `project.user_id === currentUser.id`
2. **Consultant Scope**: Consultants can only archive clients assigned to them (`consultant_id` match)
3. **Cascade Awareness**: Users must understand what data will be deleted
4. **No Soft Delete for Delete**: Hard delete is intentional - no recovery after confirmation
5. **Audit Trail**: Consider logging deletion events for compliance

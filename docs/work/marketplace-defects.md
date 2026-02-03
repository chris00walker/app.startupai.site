# Portfolio Holder Marketplace - Defect Remediation Plan

**Created**: 2026-02-03
**Status**: Active
**Total Defects**: 55+ across schema, API, UI, and integration

---

## Defect Summary by Severity

| Severity | Schema/RLS | API Routes | UI Components | Total |
|----------|------------|------------|---------------|-------|
| Critical | 1 | 3 | 2 | **6** |
| High | 3 | 7 | 5 | **15** |
| Medium | 4 | 8 | 11 | **23** |
| Low | 8 | 5 | 7 | **20** |

**Critical Defects (Must Fix Before Deployment):**
- S-001: INSERT fails - consultant_clients requires NOT NULL invite fields
- A-001: Missing cooldown check for founder-initiated connections
- A-002: RFQ accept creates duplicate connections
- A-003: Missing verification check for consultant accept/decline endpoints
- U-001: Missing ARIA labels on interactive buttons
- U-002: Missing screen reader announcements per wireframe spec

---

## Decision Points (Blocking)

Before implementing fixes, these architectural decisions are needed:

### DP-1: Invite Fields Strategy
**Question**: Should `consultant_clients` keep invite fields for legacy flows, or should they become nullable / moved to a separate table?

**Options**:
1. **Make nullable** (recommended) - Fastest fix, maintains backward compatibility
2. **Separate `client_invites` table** - Cleaner separation but requires migration of existing data
3. **Generate placeholder values** - Hacky, creates orphan data

**Decision**: ✅ **Make nullable** - Fastest fix, maintains backward compatibility

### DP-2: Founder Directory DB Access
**Question**: Should founders/consultants be able to query the Founder Directory via Supabase directly, or should access be strictly limited to verified consultants at the DB layer?

**Options**:
1. **DB-level gating** (recommended) - Add `is_verified_consultant()` to view WHERE clause
2. **API-only gating** - Current approach, but allows bypass via PostgREST

**Decision**: ✅ **DB-level gating** - Add `is_verified_consultant()` to view WHERE clause

---

## User Findings Cross-Reference

These 9 findings from the user's manual audit are mapped to tasks below:

| # | Severity | Finding | Task(s) |
|---|----------|---------|---------|
| 1 | Critical | NOT NULL invite fields blocking inserts | TASK-001 |
| 2 | High | status vs connection_status divergence | TASK-002 |
| 3 | High | Founder consent/PII protection not enforced | TASK-003, TASK-015 |
| 4 | High | Marketplace UI not wired | TASK-022, TASK-023, TASK-024 |
| 5 | Medium | Relationship type defaults instead of explicit selection | TASK-004b |
| 6 | Medium | confirmedRelationshipType not persisted | TASK-012 |
| 7 | Medium | Connection counts always zero due to RLS | TASK-010 |
| 8 | Low | relationshipType filter no-op | TASK-009 |
| 9 | Low | RFQ response counts undercounted | TASK-011 |

**Test Gaps Noted**: No E2E tests for marketplace endpoints or UI → TASK-032

---

## Task List

### Phase 1: Critical Schema Fixes (Blocking Deployment)

#### TASK-001: Fix NOT NULL invite fields blocking connection requests
**Severity**: Critical
**ID**: S-001
**Files**:
- `supabase/migrations/20260118000002_consultant_clients.sql` (lines 19-24)
- `frontend/src/db/schema/consultant-clients.ts`
- `supabase/migrations/20260203000003_fix_invite_fields.sql` (create)

**Problem**: S-001 - INSERT fails on consultant_clients because `invite_email`, `invite_token`, `invite_expires_at` are NOT NULL but marketplace connection requests don't provide them.

**Actions**:
1. [ ] Create new migration to make invite fields nullable:
   ```sql
   ALTER TABLE consultant_clients
   ALTER COLUMN invite_email DROP NOT NULL,
   ALTER COLUMN invite_token DROP NOT NULL,
   ALTER COLUMN invite_expires_at DROP NOT NULL;
   ```
2. [ ] Update Drizzle schema to mark fields as nullable:
   ```typescript
   inviteEmail: text('invite_email'),  // Remove .notNull()
   inviteToken: text('invite_token').unique(),
   inviteExpiresAt: timestamp('invite_expires_at', { withTimezone: true }),
   ```
3. [ ] Run `pnpm db:generate` to verify schema sync
4. [ ] Add test case for marketplace connection without invite fields

**Depends on**: DP-1 decision
**Estimate**: 1 hour

---

#### TASK-002: Synchronize status and connection_status across all flows
**Severity**: High
**Files**:
- `supabase/migrations/20260118000002_consultant_clients.sql` (lines 168-173)
- `frontend/src/app/api/client/consultant/unlink/route.ts` (lines 53-61)
- `frontend/src/app/api/consultant/clients/[id]/archive/route.ts` (lines 71-79)
- `frontend/src/app/api/consultant/connections/route.ts`
- `frontend/src/app/api/founder/consultants/route.ts`

**Problem**: Legacy flows update `status` only; new flows use `connection_status`. This causes:
- Active connections invisible to new endpoints
- Archived relationships appear "active" in new status field

**Actions**:
1. [ ] Audit all files that update `status`:
   - `frontend/src/app/api/client/consultant/unlink/route.ts`
   - `frontend/src/app/api/consultant/clients/[id]/archive/route.ts`
   - `frontend/src/app/api/consultant/invites/[id]/route.ts`
2. [ ] Update each to also update `connection_status`:
   ```typescript
   .update({
     status: 'archived',
     connection_status: 'archived',  // Add this
   })
   ```
3. [ ] Create migration to sync existing data:
   ```sql
   UPDATE consultant_clients
   SET connection_status = status
   WHERE connection_status != status;
   ```
4. [ ] Update new endpoints to also query by `status` for backward compatibility
5. [ ] Add test to verify both fields stay in sync

**Estimate**: 2 hours

---

### Phase 2: Security & Consent Fixes

#### TASK-003: Enforce founder consent and PII protection
**Severity**: High
**IDs**: S-008, A-010
**Files**:
- `supabase/migrations/20260203000002_marketplace_rls.sql` (lines 363-401)
- `frontend/src/app/api/consultant/connections/route.ts` (lines 151-205)
- `frontend/src/app/api/projects/quick-start/route.ts` (lines 119-128)

**Problem**:
- S-008: `founder_directory` view exposed to ALL authenticated users - bypasses API verification check
- A-010: Founder connections response leaks `consultantEmail` before connection is active
- `founderId` returned for all statuses (should be hidden until active)
- `/projects/quick-start` checks any `consultant_clients` row, not `connection_status`

**Actions**:
1. [ ] Fix `founder_directory` view to require verification:
   ```sql
   -- Option A: Add function check in view
   CREATE OR REPLACE VIEW public.founder_directory AS
   SELECT ... FROM user_profiles u
   JOIN projects p ON p.user_id = u.id
   WHERE u.founder_directory_opt_in = TRUE
     AND p.problem_fit IN ('partial_fit', 'strong_fit')
     AND public.is_verified_consultant();  -- Add this gate
   ```
2. [ ] Update consultant connections GET to hide founder details:
   ```typescript
   const transformedConnections = connections.map((c) => ({
     id: c.id,
     founderId: c.connection_status === 'active' ? c.client_id : null,  // Hide until active
     founderName: c.connection_status === 'active' ? ... : null,
     founderEmail: c.connection_status === 'active' ? ... : null,
     // ...
   }));
   ```
3. [ ] Fix quick-start endpoint to check `connection_status = 'active'`:
   ```typescript
   const { data: consultant } = await supabase
     .from('consultant_clients')
     .select('consultant_id')
     .eq('client_id', user.id)
     .eq('connection_status', 'active')  // Add this filter
     .single();
   ```
4. [ ] Add RLS test for founder_directory access control

**Estimate**: 2 hours

---

#### TASK-004: Add missing cooldown check for founder-initiated connections
**Severity**: Critical
**ID**: A-001
**Files**:
- `frontend/src/app/api/founder/connections/route.ts`

**Problem**: A-001 - Missing cooldown check for founder-initiated connections - founders can spam consultants with repeated connection requests.

**Actions**:
1. [ ] Add cooldown check before creating connection:
   ```typescript
   // Check cooldown (same as consultant side)
   const { data: cooldown } = await supabase.rpc('check_connection_cooldown', {
     p_consultant_id: consultantId,
     p_founder_id: user.id,
   });

   if (cooldown?.cooldown_active) {
     return NextResponse.json(
       {
         error: 'cooldown_active',
         message: `You can reconnect with this consultant in ${cooldown.days_remaining} days.`,
         cooldownEndsAt: cooldown.cooldown_ends_at,
         daysRemaining: cooldown.days_remaining,
       },
       { status: 429 }
     );
   }
   ```
2. [ ] Add test case for cooldown enforcement

**Estimate**: 30 minutes

---

#### TASK-004b: Enforce explicit relationship type selection (no defaults)
**Severity**: Medium (A-006 related)
**ID**: A-006-partial
**Files**:
- `frontend/src/app/api/consultant/invites/route.ts` (lines 16-23)
- `frontend/src/components/consultant/InviteClientModal.tsx` (lines 90-105)

**Problem**: Plan requires "no default, explicit selection" but:
- Invite API defaults to 'advisory'
- Modal initializes with a default value

**Actions**:
1. [ ] Remove default from invite API Zod schema:
   ```typescript
   // frontend/src/app/api/consultant/invites/route.ts
   const inviteSchema = z.object({
     email: z.string().email(),
     relationshipType: z.enum(['advisory', 'capital', 'program', 'service', 'ecosystem']),
     // Remove .default('advisory')
   });
   ```
2. [ ] Update InviteClientModal to not pre-select:
   ```typescript
   // Change from:
   const [relationshipType, setRelationshipType] = useState<RelationshipType>(defaultRelationshipType || 'advisory');
   // To:
   const [relationshipType, setRelationshipType] = useState<RelationshipType | ''>('');

   // Disable submit until selected
   disabled={isInviting || !relationshipType}
   ```
3. [ ] Add validation error message when not selected
4. [ ] Add placeholder text: "Select relationship type"

**Estimate**: 45 minutes

---

#### TASK-005: Add duplicate connection check for RFQ acceptance
**Severity**: Critical
**ID**: A-002
**Files**:
- `frontend/src/app/api/founder/rfq/[id]/responses/[responseId]/accept/route.ts`

**Problem**: RFQ acceptance creates connection without checking for existing active/pending connection.

**Actions**:
1. [ ] Add duplicate check before creating connection:
   ```typescript
   // Check for existing connection
   const { data: existing } = await supabase
     .from('consultant_clients')
     .select('id, connection_status')
     .eq('consultant_id', response.consultant_id)
     .eq('client_id', user.id)
     .in('connection_status', ['requested', 'active'])
     .single();

   if (existing) {
     // Skip connection creation, just update response status
     return NextResponse.json({
       responseId,
       status: 'accepted',
       connectionId: existing.id,
       message: `Already connected with ${consultant?.full_name || 'the consultant'}.`,
       existingConnection: true,
     });
   }
   ```
2. [ ] Fix hardcoded 'advisory' relationship_type (A-006):
   ```typescript
   // Current broken code:
   relationship_type: 'advisory',  // WRONG - hardcoded

   // Fetch RFQ to get actual relationship_type
   const { data: rfq } = await supabase
     .from('consultant_requests')
     .select('id, founder_id, relationship_type')
     .eq('id', rfqId)
     .single();

   // Use the RFQ's relationship_type:
   relationship_type: rfq.relationship_type,  // Correct
   ```

**Estimate**: 1 hour

---

#### TASK-005b: Fix RFQ accept hardcoded relationship_type
**Severity**: High
**ID**: A-006
**Files**:
- `frontend/src/app/api/founder/rfq/[id]/responses/[responseId]/accept/route.ts` (line 112-123)

**Problem**: RFQ acceptance hardcodes `relationship_type: 'advisory'` instead of using the RFQ's actual type.

**Actions**:
1. [ ] Query the RFQ to get its relationship_type before creating connection
2. [ ] Use the RFQ's type in the connection creation
3. [ ] Add validation that RFQ exists and belongs to founder
4. [ ] Add test for correct relationship_type propagation

**Estimate**: 30 minutes (merged with TASK-005)

---

#### TASK-006: Add verification check for consultant connection accept/decline
**Severity**: Critical
**ID**: A-003
**Files**:
- `frontend/src/app/api/consultant/connections/[id]/accept/route.ts`
- `frontend/src/app/api/consultant/connections/[id]/decline/route.ts`

**Problem**: Endpoints don't verify user is a verified consultant before allowing action (A-003).

**Actions**:
1. [ ] Add verification check to both endpoints:
   ```typescript
   // Verify user is a verified consultant
   const { data: isVerified } = await supabase.rpc('is_verified_consultant');

   if (!isVerified) {
     return NextResponse.json(
       { error: 'unverified', message: 'Upgrade to access this feature.' },
       { status: 403 }
     );
   }
   ```

**Estimate**: 30 minutes

---

### Phase 3: API Correctness Fixes

#### TASK-007: Add UUID validation for all path parameters
**Severity**: High
**ID**: A-005
**Files**: All endpoints with `[id]` or `[responseId]` params

**Problem**: A-005 - Path parameters (id, responseId) not validated as UUIDs - causes 500 instead of 400.

**Actions**:
1. [ ] Create shared validation utility:
   ```typescript
   // frontend/src/lib/api/validation.ts
   import { z } from 'zod';

   export const uuidSchema = z.string().uuid();

   export function validateUuid(value: string, paramName: string = 'id') {
     const result = uuidSchema.safeParse(value);
     if (!result.success) {
       return {
         error: 'invalid_parameter',
         message: `Invalid ${paramName}: must be a valid UUID`
       };
     }
     return null;
   }
   ```
2. [ ] Add validation to each endpoint:
   - `founder/connections/[id]/accept/route.ts`
   - `founder/connections/[id]/decline/route.ts`
   - `consultant/connections/[id]/accept/route.ts`
   - `consultant/connections/[id]/decline/route.ts`
   - `consultant/rfq/[id]/respond/route.ts`
   - `founder/rfq/[id]/responses/route.ts`
   - `founder/rfq/[id]/responses/[responseId]/accept/route.ts`
   - `founder/rfq/[id]/responses/[responseId]/decline/route.ts`

**Estimate**: 1 hour

---

#### TASK-008: Add missing role verification to founder endpoints
**Severity**: High
**ID**: A-007
**Files**:
- `frontend/src/app/api/founder/consultants/route.ts`
- `frontend/src/app/api/founder/rfq/route.ts`
- `frontend/src/app/api/founder/connections/route.ts`
- `frontend/src/app/api/founder/profile/marketplace/route.ts`

**Problem**: A-007 - Missing role verification on founder endpoints (non-founders could access).

**Actions**:
1. [ ] Create founder role check utility:
   ```typescript
   // frontend/src/lib/auth/roles.ts (extend existing)
   export async function isFounder(supabase: SupabaseClient): Promise<boolean> {
     const { data } = await supabase
       .from('user_profiles')
       .select('role')
       .eq('id', (await supabase.auth.getUser()).data.user?.id)
       .single();
     return data?.role === 'founder' || data?.role === 'founder_trial';
   }
   ```
2. [ ] Add role check to each endpoint

**Estimate**: 1 hour

---

#### TASK-009: Fix unused relationshipType filter in Founder Directory
**Severity**: Low
**ID**: A-004
**Files**:
- `frontend/src/app/api/consultant/founders/route.ts` (line 48)

**Problem**: A-004 - relationshipType filter parsed but never used in /consultant/founders.

**Actions**:
1. [ ] Apply the filter (if it makes sense for this endpoint):
   ```typescript
   // Note: This may not be applicable since founders don't have relationship types
   // Consider removing the parameter from the API spec instead
   ```
2. [ ] Either implement or remove from API spec

**Estimate**: 15 minutes

---

#### TASK-010: Fix connection counts always zero due to RLS
**Severity**: Medium
**Files**:
- `frontend/src/app/api/founder/consultants/route.ts` (lines 79-85)

**Problem**: Counts query uses founder's auth context; RLS hides rows not tied to the founder.

**Actions**:
1. [ ] Use a count aggregation in the main query or create a service role query:
   ```typescript
   // Option A: Use service role for counts (recommended)
   const adminClient = createAdminClient();
   const { data: connectionCounts } = await adminClient
     .from('consultant_clients')
     .select('consultant_id')
     .in('consultant_id', consultantIds)
     .eq('connection_status', 'active');

   // Option B: Create a DB function that bypasses RLS for counts
   const { data: counts } = await supabase.rpc('get_consultant_connection_counts', {
     consultant_ids: consultantIds
   });
   ```

**Estimate**: 45 minutes

---

#### TASK-011: Fix RFQ response counts undercounted
**Severity**: Low
**Files**:
- `frontend/src/app/api/consultant/rfq/route.ts` (lines 64-108)

**Problem**: RLS only allows consultants to see their own responses, so responseCount isn't total.

**Actions**:
1. [ ] Use a service role client for counting:
   ```typescript
   const adminClient = createAdminClient();
   const { data: responses } = await adminClient
     .from('consultant_request_responses')
     .select('request_id, consultant_id')
     .in('request_id', rfqIds);
   ```

**Estimate**: 30 minutes

---

#### TASK-012: Fix confirmedRelationshipType not persisted
**Severity**: Medium
**Files**:
- `frontend/src/app/api/founder/connections/[id]/accept/route.ts`
- `supabase/migrations/20260203000002_marketplace_rls.sql` (accept_connection function)

**Problem**: API parses `confirmedRelationshipType` but the RPC function doesn't accept or persist it.

**Actions**:
1. [ ] Update `accept_connection` function to accept relationship type:
   ```sql
   CREATE OR REPLACE FUNCTION public.accept_connection(
     connection_id UUID,
     confirmed_relationship_type TEXT DEFAULT NULL
   )
   RETURNS JSON AS $$
   DECLARE
     v_connection RECORD;
   BEGIN
     -- ... validation ...

     UPDATE consultant_clients
     SET connection_status = 'active',
         accepted_at = NOW(),
         linked_at = NOW(),
         relationship_type = COALESCE(confirmed_relationship_type, relationship_type)
     WHERE id = connection_id;

     -- ...
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```
2. [ ] Update API to pass the value:
   ```typescript
   const { data: result } = await supabase.rpc('accept_connection', {
     connection_id: connectionId,
     confirmed_relationship_type: validation.data?.confirmedRelationshipType || null,
   });
   ```

**Estimate**: 45 minutes

---

#### TASK-013: Fix NaN handling for pagination parameters
**Severity**: Medium
**Files**:
- `frontend/src/app/api/consultant/founders/route.ts`
- `frontend/src/app/api/founder/consultants/route.ts`
- `frontend/src/app/api/consultant/rfq/route.ts`

**Problem**: `parseInt` on invalid input returns `NaN`, which isn't caught.

**Actions**:
1. [ ] Add fallback for NaN:
   ```typescript
   const limit = Math.min(parseInt(searchParams.get('limit') || '20') || 20, 50);
   const offset = parseInt(searchParams.get('offset') || '0') || 0;
   ```

**Estimate**: 15 minutes

---

#### TASK-014: Add pagination to connections endpoints
**Severity**: Medium
**Files**:
- `frontend/src/app/api/consultant/connections/route.ts`
- `frontend/src/app/api/founder/connections/route.ts`

**Problem**: GET returns all connections without pagination.

**Actions**:
1. [ ] Add limit/offset params and total count:
   ```typescript
   const limit = Math.min(parseInt(searchParams.get('limit') || '50') || 50, 100);
   const offset = parseInt(searchParams.get('offset') || '0') || 0;

   let query = supabase
     .from('consultant_clients')
     .select('...', { count: 'exact' })
     // ...
     .range(offset, offset + limit - 1);

   return NextResponse.json({
     connections: transformedConnections,
     total: count || 0,
     limit,
     offset,
   });
   ```

**Estimate**: 30 minutes

---

#### TASK-015: Hide consultant email until connection active
**Severity**: High
**ID**: A-010
**Files**:
- `frontend/src/app/api/founder/connections/route.ts`

**Problem**: A-010 - Founder connections response leaks consultantEmail before connection is active.

**Actions**:
1. [ ] Only include email for active connections:
   ```typescript
   return {
     // ...
     consultantEmail: c.connection_status === 'active' ? resolvedUserProfile?.email : null,
     // ...
   };
   ```

**Estimate**: 15 minutes

---

### Phase 4: Schema & RLS Fixes

#### TASK-016: Fix founder_directory view column references
**Severity**: High
**ID**: S-004
**Files**:
- `supabase/migrations/20260203000002_marketplace_rls.sql` (lines 365-395)

**Problem**: S-004 - View references `p.company_name`, `p.fit_score`, `p.stage` which may not exist.

**Actions**:
1. [ ] Verify which columns exist in `projects` table
2. [ ] Update view to use correct column names:
   ```sql
   -- Use COALESCE with fallbacks for potentially missing columns
   COALESCE(p.company, 'Stealth startup') as company,  -- company not company_name
   -- Check if industry/stage/fit_score exist, add if missing
   ```
3. [ ] Add missing columns to projects table if needed

**Estimate**: 1 hour

---

#### TASK-017: Fix trial consultants blocked from invite flow
**Severity**: High
**ID**: S-005
**Files**:
- `supabase/migrations/20260203000002_marketplace_rls.sql` (lines 246-254)

**Problem**: S-005 - INSERT policy requires `is_verified_consultant()` which blocks trial users from inviting (legacy flow should work for all consultants).

**Actions**:
1. [ ] Update RLS policy to allow invite flow for all consultants:
   ```sql
   CREATE POLICY "consultant_clients_insert_policy" ON consultant_clients
   FOR INSERT
   WITH CHECK (
     -- Legacy invite flow: any consultant can invite
     (connection_status = 'invited' AND consultant_id = auth.uid() AND public.is_consultant())
     OR
     -- Marketplace flow: verified consultants only
     (connection_status = 'requested' AND initiated_by = 'consultant'
      AND consultant_id = auth.uid() AND public.is_verified_consultant())
     OR
     -- Founder-initiated: any authenticated founder
     (initiated_by = 'founder' AND client_id = auth.uid())
   );
   ```

**Estimate**: 30 minutes

---

#### TASK-018: Add DELETE policy on consultant_clients
**Severity**: Medium
**Files**:
- `supabase/migrations/20260203000002_marketplace_rls.sql`

**Problem**: No DELETE policy exists.

**Actions**:
1. [ ] Add DELETE policy (or confirm deletion should not be allowed):
   ```sql
   -- Option A: Allow deletion by service role only
   CREATE POLICY "consultant_clients_delete_policy" ON consultant_clients
   FOR DELETE
   USING (FALSE);  -- Block all client-side deletes

   -- Option B: Allow parties to delete their own connections
   CREATE POLICY "consultant_clients_delete_policy" ON consultant_clients
   FOR DELETE
   USING (consultant_id = auth.uid() OR client_id = auth.uid());
   ```

**Estimate**: 15 minutes

---

#### TASK-019: Fix accept_connection to set linkedAt
**Severity**: Medium
**Files**:
- `supabase/migrations/20260203000002_marketplace_rls.sql` (lines 77-80)

**Problem**: Function sets `accepted_at` but not `linkedAt`.

**Actions**:
1. [ ] Update function:
   ```sql
   UPDATE consultant_clients
   SET connection_status = 'active',
       accepted_at = NOW(),
       linked_at = NOW()  -- Add this
   WHERE id = connection_id;
   ```

**Estimate**: 15 minutes

---

#### TASK-020: Fix archive_connection to set audit columns
**Severity**: Medium
**Files**:
- `supabase/migrations/20260203000002_marketplace_rls.sql` (lines 167-170)

**Problem**: Function doesn't set `archivedAt` or `archivedBy`.

**Actions**:
1. [ ] Update function:
   ```sql
   UPDATE consultant_clients
   SET connection_status = 'archived',
       archived_at = NOW(),
       archived_by = auth.uid()
   WHERE id = connection_id;
   ```

**Estimate**: 15 minutes

---

#### TASK-021: Create archive endpoint for connections
**Severity**: Medium
**Files**:
- `frontend/src/app/api/consultant/connections/[id]/archive/route.ts` (create)
- `frontend/src/app/api/founder/connections/[id]/archive/route.ts` (create)

**Problem**: SQL function exists but no API endpoint.

**Actions**:
1. [ ] Create both archive endpoints following accept/decline pattern

**Estimate**: 30 minutes

---

### Phase 5: UI Integration

#### TASK-022: Wire MarketplaceTab into settings page
**Severity**: High
**Files**:
- `frontend/src/pages/settings.tsx`
- `frontend/src/components/settings/MarketplaceTab.tsx`

**Problem**: MarketplaceTab exists but isn't added to settings tabs.

**Actions**:
1. [ ] Import MarketplaceTab in settings.tsx
2. [ ] Add "Marketplace" tab to the tabs array
3. [ ] Render MarketplaceTab when tab is selected:
   ```typescript
   import { MarketplaceTab } from '@/components/settings/MarketplaceTab';

   // In tabs array:
   { id: 'marketplace', label: 'Marketplace', icon: Store },

   // In render:
   {activeTab === 'marketplace' && (
     <MarketplaceTab role={profile.role} userId={user.id} />
   )}
   ```

**Estimate**: 30 minutes

---

#### TASK-023: Create pages for marketplace components
**Severity**: High
**Files**: Create new pages

**Problem**: Directory and RFQ components have no pages to mount them.

**Actions**:
1. [ ] Create `frontend/src/app/consultant/founders/page.tsx` for FounderDirectory
2. [ ] Create `frontend/src/app/founder/consultants/page.tsx` for ConsultantDirectory
3. [ ] Create `frontend/src/app/consultant/rfq/page.tsx` for RFQBoard
4. [ ] Create `frontend/src/app/founder/rfq/page.tsx` for founder's RFQ list
5. [ ] Create `frontend/src/app/founder/rfq/create/page.tsx` for RFQForm
6. [ ] Create connection pages:
   - `frontend/src/app/consultant/connections/page.tsx`
   - `frontend/src/app/founder/connections/page.tsx`
7. [ ] Add navigation links to dashboards

**Estimate**: 3 hours

---

#### TASK-024: Wire ConnectionRequestCard into dashboards
**Severity**: High
**Files**:
- `frontend/src/app/consultant/dashboard/page.tsx` (or equivalent)
- `frontend/src/app/founder/dashboard/page.tsx` (or equivalent)

**Problem**: ConnectionRequestCard exists but isn't used in dashboards.

**Actions**:
1. [ ] Add ConnectionRequestCard to founder dashboard:
   ```typescript
   import { ConnectionRequestCard } from '@/components/dashboard/ConnectionRequestCard';

   // Fetch pending count
   const { data: connections } = await supabase
     .from('consultant_clients')
     .select('id', { count: 'exact' })
     .eq('client_id', user.id)
     .eq('connection_status', 'requested')
     .eq('initiated_by', 'consultant');

   // Render
   <ConnectionRequestCard count={connections?.length || 0} role="founder" />
   ```
2. [ ] Add to consultant dashboard for founder-initiated requests

**Estimate**: 1 hour

---

### Phase 6: UI Quality Fixes

#### TASK-025: Add ARIA labels and screen reader announcements (U-001, U-002)
**Severity**: Critical
**IDs**: U-001, U-002
**Files**:
- `frontend/src/components/consultant/InviteClientModal.tsx`
- `frontend/src/components/dashboard/ConnectionRequestCard.tsx`
- `frontend/src/components/consultant/FounderDirectory.tsx`
- `frontend/src/components/founder/ConsultantDirectory.tsx`
- `frontend/src/components/consultant/RFQBoard.tsx`
- `frontend/src/components/founder/RFQForm.tsx`
- `frontend/src/components/settings/MarketplaceTab.tsx`

**Problem**:
- U-001: Missing ARIA labels on icon buttons (copy, accept/decline, refresh)
- U-002: Missing screen reader announcements per wireframe spec

**Actions**:
1. [ ] Add aria-label to copy button in InviteClientModal:
   ```tsx
   aria-label={copied ? 'Copied to clipboard' : 'Copy invite URL'}
   ```
2. [ ] Add aria-label to all refresh buttons:
   ```tsx
   aria-label="Refresh list"
   ```
3. [ ] Add aria-label to accept/decline buttons in ConnectionRequestCard:
   ```tsx
   <Button aria-label="Accept connection request">Accept</Button>
   <Button aria-label="Decline connection request">Decline</Button>
   ```
4. [ ] Add aria-live regions for dynamic content updates:
   ```tsx
   // After loading completes
   <div aria-live="polite" className="sr-only">
     {isLoading ? 'Loading results...' : `Showing ${items.length} of ${total} items`}
   </div>
   ```
5. [ ] Add aria-live for filter changes:
   ```tsx
   // Announce when filters change and results update
   <div aria-live="polite" aria-atomic="true" className="sr-only">
     {filterAnnouncement}
   </div>
   ```
6. [ ] Add screen reader announcements for:
   - Connection request sent successfully
   - Connection accepted/declined
   - RFQ response submitted
   - Settings saved
7. [ ] Add `aria-describedby` for form fields with helper text
8. [ ] Ensure all modals have proper focus management and `aria-modal="true"`
9. [ ] Add `aria-busy` during loading states

**Estimate**: 2 hours

---

#### TASK-026: Fix race condition in filter/pagination effects
**Severity**: High
**ID**: U-003
**Files**:
- `frontend/src/components/consultant/FounderDirectory.tsx`
- `frontend/src/components/founder/ConsultantDirectory.tsx`
- `frontend/src/components/consultant/RFQBoard.tsx`

**Problem**: U-003 - Changing filter triggers two fetches due to separate effects (FounderDirectory, ConsultantDirectory, RFQBoard).

**Actions**:
1. [ ] Consolidate effects:
   ```typescript
   // Remove the separate setOffset effect
   // Instead, reset offset in the filter change handlers:
   const handleFilterChange = (setter: Dispatch<SetStateAction<string>>) =>
     (value: string) => {
       setter(value);
       setOffset(0);
     };

   // Only fetch on offset changes:
   useEffect(() => {
     fetchData();
   }, [offset, /* other deps that should trigger refetch */]);
   ```
2. [ ] Or use useCallback with stable deps

**Estimate**: 1 hour

---

#### TASK-027: Add error display in RFQBoard response modal
**Severity**: High
**ID**: U-007
**Files**:
- `frontend/src/components/consultant/RFQBoard.tsx`

**Problem**: U-007 - Error state from handleRespond never displayed in RFQBoard modal.

**Actions**:
1. [ ] Add responseError state and display:
   ```typescript
   const [responseError, setResponseError] = useState<string | null>(null);

   // In catch block:
   setResponseError(err instanceof Error ? err.message : 'Failed to submit response');

   // In modal:
   {responseError && (
     <Alert variant="destructive">
       <AlertDescription>{responseError}</AlertDescription>
     </Alert>
   )}
   ```

**Estimate**: 15 minutes

---

#### TASK-028: Add missing industries multi-select to RFQForm
**Severity**: Medium
**Files**:
- `frontend/src/components/founder/RFQForm.tsx`

**Problem**: `industries` state declared but no UI input exists.

**Actions**:
1. [ ] Add multi-select component for industries per wireframe
2. [ ] Connect to industries state

**Estimate**: 45 minutes

---

#### TASK-029: Fix empty string as Select value
**Severity**: Medium
**Files**:
- `frontend/src/components/founder/ConsultantDirectory.tsx`
- `frontend/src/components/consultant/FounderDirectory.tsx`
- `frontend/src/components/consultant/RFQBoard.tsx`
- `frontend/src/components/founder/RFQForm.tsx`

**Problem**: Using `""` as SelectItem value is problematic with Radix UI.

**Actions**:
1. [ ] Use sentinel value like "all":
   ```tsx
   <SelectItem value="all">All Types</SelectItem>

   // In fetch:
   if (relationshipType && relationshipType !== 'all') {
     params.set('relationship_type', relationshipType);
   }
   ```

**Estimate**: 30 minutes

---

#### TASK-030: Remove unused imports
**Severity**: Low
**Files**:
- `frontend/src/components/consultant/FounderDirectory.tsx` (unused Input)

**Actions**:
1. [ ] Remove unused `Input` import
2. [ ] Run lint to find other unused imports

**Estimate**: 15 minutes

---

#### TASK-031: Centralize pricing configuration
**Severity**: Low
**Files**: Multiple components with hardcoded pricing

**Problem**: Pricing is hardcoded in multiple places ($149, $199, $499).

**Actions**:
1. [ ] Create pricing config:
   ```typescript
   // frontend/src/config/pricing.ts
   export const PRICING = {
     advisor: { monthly: 199, annual: 1990 },
     capital: { monthly: 499, annual: 4990 },
   };
   ```
2. [ ] Update components to use config

**Estimate**: 30 minutes

---

### Phase 7: Testing

#### TASK-032: Add E2E tests for marketplace flows
**Severity**: High
**Files**: Create new test files

**Problem**: No tests for marketplace endpoints or UI.

**Actions**:
1. [ ] Create `frontend/tests/e2e/marketplace/connection-request.spec.ts`:
   - Test consultant → founder connection request
   - Test founder → consultant connection request
   - Test accept/decline flows
   - Test cooldown enforcement
2. [ ] Create `frontend/tests/e2e/marketplace/rfq.spec.ts`:
   - Test RFQ creation
   - Test consultant response
   - Test accept/decline response
3. [ ] Create `frontend/tests/e2e/marketplace/directory.spec.ts`:
   - Test founder directory access (verified only)
   - Test consultant directory browsing
   - Test filters and pagination
4. [ ] Create API integration tests for each endpoint

**Estimate**: 8 hours

---

## Summary

| Phase | Tasks | Critical | High | Est. Hours |
|-------|-------|----------|------|------------|
| 1. Schema Fixes | 2 | 1 | 1 | 3 |
| 2. Security/Consent | 6 | 3 | 2 | 5.75 |
| 3. API Correctness | 9 | 0 | 3 | 5 |
| 4. Schema/RLS | 6 | 0 | 2 | 2.5 |
| 5. UI Integration | 3 | 0 | 3 | 4.5 |
| 6. UI Quality | 7 | 1 | 2 | 5 |
| 7. Testing | 1 | 0 | 1 | 8 |
| **Total** | **34** | **5** | **14** | **33.75** |

---

## Audit ID Cross-Reference

| Audit ID | Severity | Task | Description |
|----------|----------|------|-------------|
| S-001 | Critical | TASK-001 | NOT NULL invite fields blocking inserts |
| S-004 | High | TASK-016 | founder_directory view references non-existent columns |
| S-005 | High | TASK-017 | Trial consultants blocked from invite flow |
| S-008 | High | TASK-003 | founder_directory exposed to all authenticated users |
| A-001 | Critical | TASK-004 | Missing cooldown for founder connections |
| A-002 | Critical | TASK-005 | RFQ accept creates duplicate connections |
| A-003 | Critical | TASK-006 | Missing verification for consultant accept/decline |
| A-004 | Low | TASK-009 | relationshipType filter unused |
| A-005 | High | TASK-007 | Path parameters not validated as UUIDs |
| A-006 | High | TASK-005b | RFQ accept hardcodes relationship_type |
| A-007 | High | TASK-008 | Missing role verification on founder endpoints |
| A-010 | High | TASK-003, TASK-015 | Leaks email before connection active |
| U-001 | Critical | TASK-025 | Missing ARIA labels on interactive buttons |
| U-002 | Critical | TASK-025 | Missing screen reader announcements |
| U-003 | High | TASK-026 | Race condition in filter/pagination effects |
| U-007 | High | TASK-027 | Error state never displayed in RFQBoard modal |

---

## Execution Order

1. **Immediate (Blocking)**: Resolve DP-1 and DP-2 decisions
2. **Sprint 1**: TASK-001 through TASK-006 (Critical and blocking high)
3. **Sprint 2**: TASK-007 through TASK-015 (API correctness)
4. **Sprint 3**: TASK-016 through TASK-024 (Schema/RLS + UI integration)
5. **Sprint 4**: TASK-025 through TASK-032 (UI quality + testing)

---

## Immediate Action Items (Top 6 Critical)

1. **Fix Critical Schema Issue (S-001/TASK-001)**
   - Make inviteEmail, inviteToken, inviteExpiresAt nullable in the schema
   - Or generate placeholder values for marketplace connection requests

2. **Add Founder Cooldown Check (A-001/TASK-004)**
   ```typescript
   // In founder/connections/route.ts POST
   const { data: cooldown } = await supabase.rpc('check_connection_cooldown', {
     p_consultant_id: consultantId,
     p_founder_id: user.id,
   });
   ```

3. **Add Duplicate Connection Check (A-002/TASK-005)**
   - Check for existing connection before creating from RFQ acceptance

4. **Add Verification Check (A-003/TASK-006)**
   - Add `is_verified_consultant()` check to consultant accept/decline endpoints

5. **Fix RLS View Security (S-008/TASK-003)**
   - Add `is_verified_consultant()` check to founder_directory view WHERE clause

6. **Add ARIA Labels (U-001, U-002/TASK-025)**
   - Add aria-label to all icon buttons
   - Add aria-live regions for dynamic content

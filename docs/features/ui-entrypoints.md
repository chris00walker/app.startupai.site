---
purpose: "UI entrypoints and wiring status (clickable actions)"
status: "draft"
last_reviewed: "2026-01-13"
---

# UI Entrypoints Map

Legend:
- wired: route/action connects to a real API or DB path
- demo: uses mock data or placeholder UI only
- stub: UI action exists but no API/hook implementation
- broken: link/route not found in code
- legacy: pages router or older flow still present

## App Router Pages

### `/login` (`frontend/src/app/login/page.tsx`, `frontend/src/components/auth/LoginForm.tsx`)
- Back to home -> `NEXT_PUBLIC_MARKETING_URL` or `http://localhost:3000` (external, wired)
- Sign in with GitHub -> `signInWithGitHub()` -> Supabase OAuth -> `/auth/callback` (wired)
- Sign in (email/password form) -> `signIn()` -> Supabase auth -> role-based redirect (wired)
- Forgot password -> `/forgot-password` (broken, no route found)
- Sign up -> `/signup` (wired)

### `/signup` (`frontend/src/app/signup/page.tsx`, `frontend/src/components/signup-form.tsx`)
- Back to marketing site -> `NEXT_PUBLIC_MARKETING_URL` or `http://localhost:3000` (external, wired)
- Create account -> `supabase.auth.signUp()` (wired)
- Sign up with GitHub -> `supabase.auth.signInWithOAuth()` -> `/auth/callback` (wired)
- Sign in -> `/login` (wired)

### `/auth/callback` (`frontend/src/app/auth/callback/route.ts`)
- OAuth exchange -> Supabase session + role/plan metadata update (wired)
- Redirect -> role-based destination (`/onboarding`, `/founder-dashboard`, `/consultant-dashboard`) (wired)

### `/auth/auth-code-error` (`frontend/src/app/auth/auth-code-error/page.tsx`)
- Error display only (no actions beyond browser navigation)

### `/debug-oauth` (`frontend/src/app/debug-oauth/page.tsx`)
- Debug page (intended for troubleshooting OAuth, use as needed)

### `/test-auth` (`frontend/src/app/test-auth/page.tsx`)
- Auth verification page (test-only; wiring depends on auth state)

### `/onboarding` and `/onboarding/founder` (`frontend/src/app/onboarding/page.tsx`, `frontend/src/components/onboarding/OnboardingWizardV2.tsx`)
- Start/resume session -> `POST /api/onboarding/start` (wired)
- Send message -> `POST /api/chat` (wired)
- Poll status -> `GET /api/onboarding/status` (wired)
- Complete onboarding -> `POST /api/onboarding/complete` (wired; triggers analysis workflow + redirect to `/project/[id]/gate`)
- Exit onboarding -> client-only event + redirect to `/founder-dashboard` or `/clients` (no API call)
- Start new conversation -> `POST /api/onboarding/abandon` (wired; clears current session before re-init)
- Analysis status polling -> `GET /api/crewai/status?run_id=...` (wired)
- Analysis completion redirect (analysis modal) -> `/dashboard/project/${id}` (legacy doc target; route not found in app)

### `/onboarding/consultant` (`frontend/src/app/onboarding/consultant/page.tsx`, `frontend/src/components/onboarding/ConsultantOnboardingWizardV2.tsx`)
- Start/resume session -> `POST /api/consultant/onboarding/start` (wired)
- Send message -> `POST /api/consultant/chat` (wired)
- Poll status -> `GET /api/consultant/onboarding/status` (wired)
- Complete onboarding -> `POST /api/consultant/onboarding/complete` (wired; saves `consultant_profiles` + `user_profiles`)
- Legacy save endpoint -> `POST /api/consultant/onboarding` (legacy; used by V1 component)

### `/approvals` (`frontend/src/app/approvals/page.tsx`, `frontend/src/hooks/useApprovals.ts`)
- Load approvals -> `GET /api/approvals` (wired)
- Approve/reject -> `PATCH /api/approvals/[id]` (wired)
- Refresh -> same as load (wired)

### `/projects/new` (`frontend/src/app/projects/new/page.tsx`, `frontend/src/components/onboarding/ProjectCreationWizard.tsx`)
- Create project -> `POST /api/projects/create` (wired)
- Trigger AI analysis -> `POST /api/analyze` (wired)
- Redirect to dashboards -> role-based (wired)

### `/client/[id]/projects/new` (`frontend/src/app/client/[id]/projects/new/page.tsx`)
- Same as `/projects/new`, but passes `clientId` to project creation (wired)

### `/project/current/evidence` (`frontend/src/app/project/current/evidence/page.tsx`)
- Redirect -> `/project/[id]/evidence` via `useProjects()` (wired)

### `/project/current/gate` (`frontend/src/app/project/current/gate/page.tsx`)
- Redirect -> `/project/[id]/gate` via `useProjects()` (wired)

### `/project/[id]/evidence` (`frontend/src/app/project/[id]/evidence/page.tsx`)
- Back to project -> `/project/[id]` (legacy route not defined, likely broken)
- Export -> button without handler (stub)
- Add Evidence -> `/project/[id]/fit` (broken, no route found)
- Data source -> Supabase `evidence` + `crewai_validation_states` via `useUnifiedEvidence()` (wired)

### `/project/[id]/gate` (`frontend/src/app/project/[id]/gate/page.tsx`, `frontend/src/hooks/useGateEvaluation.ts`)
- Refresh gate -> `POST /.netlify/functions/gate-evaluate` (wired)
- Dismiss alert -> local state + localStorage (`useGateAlerts()`)
- CrewAI summary -> Supabase `reports` table (wired)

### `/project/[id]/analysis` (`frontend/src/app/project/[id]/analysis/page.tsx`)
- Full Report -> `/project/[id]/report` (wired)
- Share -> disabled button (stub)
- Data source -> Supabase via `VPCReportViewer` and signals (wired)

### `/project/[id]/report` (`frontend/src/app/project/[id]/report/page.tsx`)
- Back -> `/project/[id]/analysis` (wired)
- Report data -> Supabase `reports` (wired)

## Pages Router (legacy)

### `/founder-dashboard` (`frontend/src/pages/founder-dashboard.tsx`)
- Start with Alex -> `/onboarding/founder` (wired)
- Quick Create -> `/projects/new` (wired)
- AI Strategic Analysis -> `/ai-analysis` (legacy page, wired)
- New Project -> `/onboarding/founder` (wired)
- VPC Summary Card -> `/project/[id]/analysis` (wired)
- Tabs switch -> in-page only (wired UI)
- Data sources -> Supabase via `useProjects`, `useGateEvaluation`, `useUnifiedEvidence` (wired)

### `/consultant-dashboard` (`frontend/src/pages/consultant-dashboard.tsx`)
- Add Project -> `/projects/new` (wired)
- Portfolio AI Analysis -> button without handler (stub)
- Gate Policies -> button without handler (stub)
- Click project card/alert -> `/client/[id]` (consultant) or `/project/[id]/gate` (non-consultant) (wired)
- Data sources -> Supabase via `useClients`, `useProjects` (wired)

### `/clients` (`frontend/src/pages/clients.tsx`)
- View client -> link via table item (wired to `/client/[id]`)
- New client -> `/clients/new` (wired)
- Demo banner shown when no real data (demo)
- Data sources -> Supabase via `useClients` with demo fallback (mixed)

### `/clients/new` (`frontend/src/pages/clients/new.tsx`)
- Create client -> `POST /api/clients` via `services/api.ts` (wired)
- Trigger discovery workflow -> `POST /api/clients/[id]/discovery` (demo)
- Cancel -> `/` (legacy dashboard root, likely not defined)

### `/client/[id]` (`frontend/src/pages/client/[id].tsx`)
- Back to Portfolio -> `/consultant-dashboard` (wired)
- New Project -> `/client/[id]/projects/new` (wired)
- VPC Summary Card -> `/project/[id]/analysis` (wired)
- Data sources -> Supabase via `useClients`, `useProjects`, `useUnifiedEvidence` (wired)

### `/ai-analysis` (`frontend/src/pages/ai-analysis.tsx`)
- Run analysis -> `POST /.netlify/functions/crew-analyze` (wired)
- Back -> `/founder-dashboard` (wired)
- Data sources -> Supabase auth token for function call (wired)

### `/workflows` (`frontend/src/pages/workflows.tsx`)
- New Workflow -> button without handler (demo)
- Workflow cards -> local demo data (demo)

### `/analytics` (`frontend/src/pages/analytics.tsx`)
- Export Report -> button without handler (demo)
- All data -> demo placeholders (demo)

### `/settings` (`frontend/src/pages/settings.tsx`)
- Save profile -> Supabase `user_profiles` update (wired)
- Save approvals settings -> `GET|PUT /api/settings/approvals` (wired)
- Save notification/security settings -> console log only (stub)

### `/settings` → Projects tab (planned, Founders only)
- Select project -> dropdown via `useProjects()` (planned)
- Toggle "Show archived" -> local filter state (planned)
- Archive Project -> `PATCH /api/projects/[id]` with `{ status: 'archived' }` (planned)
- Restore Project -> `PATCH /api/projects/[id]` with `{ status: 'active' }` (planned)
- Delete Forever -> AlertDialog with type-to-confirm -> `DELETE /api/projects/[id]` (planned)

### `/settings` → Clients tab (planned, Consultants only)
- Select client -> dropdown via `useClients()` (planned)
- Toggle "Show archived" -> local filter state (planned)
- Archive Client -> `PATCH /api/clients/[id]/archive` with `{ archived: true }` (planned)
- Restore Client -> `PATCH /api/clients/[id]/archive` with `{ archived: false }` (planned)

### `/export` (`frontend/src/pages/export.tsx`)
- Export evidence pack -> console log only (stub)
- Export canvases -> console log only (stub)

### `/canvas`, `/canvas/bmc`, `/canvas/vpc`, `/canvas/tbi` (`frontend/src/pages/canvas*.tsx`)
- Canvas gallery -> demo data (demo)
- Canvas editor -> `services/api.ts` canvas endpoints (broken, no matching API routes)

### `/validation` (`frontend/src/pages/validation/index.tsx`)
- Validation summary uses hooks for CrewAI state; see wiring matrix for missing endpoints (mixed)

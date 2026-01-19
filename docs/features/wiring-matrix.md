---
purpose: "Feature wiring matrix from UI -> hooks/services -> APIs -> data/services"
status: "active"
last_reviewed: "2026-01-19"
---

# Wiring Matrix

Legend: wired, demo, stub, broken, legacy.

| Feature / action | UI surface | Client hook/service | API / endpoint | Data / external | Status |
| --- | --- | --- | --- | --- | --- |
| Login (GitHub) | `/login` | `signInWithGitHub()` | `/auth/callback` | Supabase OAuth | wired |
| Login (email/password) | `/login` | `signIn()` | Supabase client auth (no callback) | Supabase auth + `user_profiles` lookup | wired |
| Forgot password | `/login` | none | `/forgot-password` | none | broken |
| Signup (email) | `/signup` | `supabase.auth.signUp()` | Supabase auth | Supabase auth + `handle_new_user` trigger -> `user_profiles` | wired |
| Signup (GitHub) | `/signup` | `supabase.auth.signInWithOAuth()` | `/auth/callback` | Supabase OAuth + `handle_new_user` trigger -> `user_profiles` | wired |
| Founder onboarding start | `/onboarding` | `OnboardingWizardV2` | `POST /api/onboarding/start` | `onboarding_sessions` | wired |
| Founder onboarding chat | `/onboarding` | `OnboardingWizardV2` | `POST /api/chat` | OpenAI + `onboarding_sessions` | wired |
| Founder onboarding chat (Two-Pass streaming) | `/onboarding` | `OnboardingWizardV2` | `POST /api/chat/stream` | OpenRouter → Groq streaming | wired |
| Founder onboarding chat (Two-Pass save) | `/onboarding` | `OnboardingWizardV2` | `POST /api/chat/save` | `onboarding_sessions` + quality assessment | wired |
| Founder onboarding status | `/onboarding` | `OnboardingWizardV2` | `GET /api/onboarding/status` | `onboarding_sessions` | wired |
| Founder onboarding complete | `/onboarding` | `OnboardingWizardV2` | `POST /api/onboarding/complete` | Modal kickoff + `projects`, `entrepreneur_briefs` (reports/evidence via `/api/crewai/webhook`) | wired |
| Onboarding start new conversation (abandon) | `/onboarding` | `OnboardingWizardV2` | `POST /api/onboarding/abandon` | `onboarding_sessions` | wired |
| Onboarding pause | `/onboarding` | `OnboardingWizardV2` | `POST /api/onboarding/pause` | `onboarding_sessions` | wired |
| Onboarding revise (return to stage) | `/onboarding` | `OnboardingWizardV2` | `POST /api/onboarding/revise` | `onboarding_sessions` | wired |
| Consultant onboarding start | `/onboarding/consultant` | `ConsultantOnboardingWizardV2` | `POST /api/consultant/onboarding/start` | `consultant_onboarding_sessions` | wired |
| Consultant onboarding chat | `/onboarding/consultant` | `ConsultantOnboardingWizardV2` | `POST /api/consultant/chat` | OpenAI + `consultant_onboarding_sessions` | wired |
| Consultant onboarding complete | `/onboarding/consultant` | `ConsultantOnboardingWizardV2` | `POST /api/consultant/onboarding/complete` | `consultant_onboarding_sessions`, `consultant_profiles`, `user_profiles` | wired |
| Consultant profile save (legacy V1) | `/onboarding/consultant` | `ConsultantOnboardingWizard` | `POST /api/consultant/onboarding` | `consultant_profiles`, `user_profiles` | legacy |
| Consultant invite create | `/clients`, `/consultant/client/new` | `useConsultantClients()` | `POST /api/consultant/invites` | `consultant_clients` | wired |
| Consultant invite resend | `/clients` | `useConsultantClients()` | `POST /api/consultant/invites/[id]/resend` | `consultant_clients` | wired |
| Consultant invite revoke | `/clients` | `useConsultantClients()` | `DELETE /api/consultant/invites/[id]` | `consultant_clients` | wired |
| Client-consultant unlink | `/settings` | `useConsultantClients()` | `POST /api/client/consultant/unlink` | `consultant_clients` | wired |
| Project creation | `/projects/new` | `ProjectCreationWizard` | `POST /api/projects/create` | `projects`, `hypotheses` | wired |
| Project analysis kickoff | `/projects/new` | `ProjectCreationWizard` | `POST /api/analyze` | Modal + `reports`, `evidence`, `entrepreneur_briefs`, `validation_runs` | wired |
| Legacy AI analysis | `/ai-analysis` | page-level `fetch()` | `POST /.netlify/functions/crew-analyze` | Netlify CrewAI function | legacy |
| CrewAI workflow status | onboarding | `OnboardingWizardV2` | `GET /api/crewai/status` | Modal + `validation_runs` cache | wired |
| CrewAI legacy kickoff | `useCrewAIState` | `useCrewAIKickoff()` | `POST /api/crewai/analyze` | none (missing) | broken |
| CrewAI legacy status | `useCrewAIState` | `useCrewAIKickoff()` | `GET /api/crewai/status/:id` | none (missing) | broken |
| CrewAI workflow resume | `/approvals` | `useApprovals()` | `POST /api/crewai/resume` | Modal + `approval_requests` | wired |
| Approvals list | `/approvals` | `useApprovals()` | `GET /api/approvals` | `approval_requests` | wired |
| Approvals decisions | `/approvals` | `useApprovals()` | `PATCH /api/approvals/[id]` | `approval_requests` + Modal webhooks | wired |
| Approval preferences | `/settings` | direct `fetch()` | `GET|PUT /api/settings/approvals` | `approval_preferences` | wired |
| AI assistant history | dashboards | `DashboardAIAssistant` | `GET /api/assistant/history` | `assistant_conversations` | wired |
| AI assistant chat | dashboards | `DashboardAIAssistant` | `POST /api/assistant/chat` | OpenAI + `assistant_conversations` | wired |
| Agents status | dashboards | `useFounderStatus()` | `GET /api/agents/status` | Modal + `projects`, `reports` | wired |
| Gate evaluation | `/project/[id]/gate` | `useGateEvaluation()` | `POST /.netlify/functions/gate-evaluate` | `evidence`, `projects` | wired |
| Evidence explorer | `/project/[id]/evidence` | `useUnifiedEvidence()` | Supabase direct | `evidence`, `crewai_validation_states` | wired |
| VPC fetch/save | `/project/[id]/analysis` | `useVPC()` | `GET|POST /api/vpc/[projectId]` | `value_proposition_canvas` | wired |
| VPC initialize | `/project/[id]/analysis` | `useVPC()` | `POST /api/vpc/[projectId]/initialize` | `crewai_validation_states` -> `value_proposition_canvas` | wired |
| Clients list | `/clients` | `useClients()` | Supabase direct | `user_profiles`, `projects`, `crewai_validation_states` | wired |
| Client creation | `/clients/new` | `services/api.ts` | `POST /api/clients` | Supabase auth admin + `user_profiles` | wired |
| Client discovery trigger | `/clients/new` | `services/api.ts` | `POST /api/clients/[id]/discovery` | `clients` metadata only | demo |
| Client tasks | `/client/[id]` | `services/api.ts` | `GET /api/clients/[id]/tasks` | none | stub |
| Client artefacts | `/client/[id]` | `services/api.ts` | `GET /api/clients/[id]/artefacts` | none | stub |
| Public metrics | marketing/public | none | `GET /api/v1/public/metrics` | `projects`, `evidence`, `hypotheses`, `crewai_validation_states` | wired |
| Public activity | marketing/public | none | `GET /api/v1/public/activity` | `public_activity_log` | wired |
| Canvas APIs (Strategyzer) | `/canvas/*` | `services/api.ts` | `/api/canvas/*` | none (missing) | broken |
| Export evidence pack | `/export` | page-local handlers | none | none | stub |
| Project archive | `/settings` | `useProjects()` | `PATCH /api/projects/[id]` | `projects.status` | wired |
| Project unarchive | `/settings` | `useProjects()` | `PATCH /api/projects/[id]` | `projects.status` | wired |
| Project delete | `/settings` | `useProjects()` | `DELETE /api/projects/[id]` | `projects` (cascade delete) | wired |
| Client archive | `/settings` | `useClients()` | `PATCH /api/clients/[id]/archive` | `archived_clients` junction table | wired |
| Client unarchive | `/settings` | `useClients()` | `PATCH /api/clients/[id]/archive` | `archived_clients` junction table | wired |

## Spec alignment notes (startupai-crew master architecture)

> **Resolved 2026-01-13**: All questions below answered in `../startupai-crew/docs/features/integration-contracts.md`

- ✅ **Modal API endpoints**: Confirmed matching - `POST /kickoff`, `GET /status/{run_id}`, `POST /hitl/approve` all implemented at `https://chris00walker--startupai-validation-fastapi-app.modal.run`. Product app calls via env-driven URLs are correct.
- ✅ **Phase 0 endpoint mapping**: By design - Product app handles interview UI (`/api/onboarding/*`, `/api/chat`), Modal Phase 0 receives final `entrepreneur_input` via `/kickoff`. The spec's `/interview/start` is not needed.
- ✅ **HITL checkpoint flow**: Confirmed correct - `approve_founders_brief` → webhook to `/api/crewai/webhook` → `approval_requests` → `/approvals` UI → `PATCH /api/approvals/[id]` → `POST /hitl/approve` to Modal.
- ✅ **Webhook vs Realtime**: BOTH patterns used - Supabase Realtime for progress streaming (`validation_progress` table), webhooks for HITL notifications and completion events (`POST /api/crewai/webhook`).

**Reference**: See `../startupai-crew/docs/features/` for complete feature audit:
- `integration-contracts.md` - Full API contracts and TypeScript types
- `hitl-checkpoint-map.md` - 10 HITL checkpoints with decision options
- `api-entrypoints.md` - Modal endpoint documentation
- `state-persistence.md` - Supabase table schemas

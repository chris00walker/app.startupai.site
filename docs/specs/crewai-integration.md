---
purpose: "Private technical source of truth for CrewAI integration"
status: "active"
last_reviewed: "2025-10-25"
---

# CrewAI Integration

## Agent Overview

- Crew configuration lives in `backend/config/agents.yaml` and is materialised by `backend/src/startupai/crew.py`.
- Six agents are defined today: research, analysis, validation, synthesis, reporting, and orchestration. Each agent’s role, goals, delegation flags, and tool bindings are YAML-driven for fast iteration without code changes.
- `StartupAICrew` exposes helpers (`research_agent()`, `analysis_agent()`, etc.) so tests can instantiate individual agents and verify tool wiring (`backend/src/startupai/crew.py:45` and beyond).
- Tool implementations in `backend/src/startupai/tools.py` wrap Supabase (evidence store), pgvector (semantic search), web search, and a markdown report generator stub. Each tool degrades gracefully when credentials are missing to keep local development frictionless.
- Persona tone and scripted prompts still live in the Next.js onboarding start handler; they will migrate into CrewAI context when the integration ships.

## Workflow

1. `OnboardingWizard` (`frontend/src/components/onboarding/OnboardingWizard.tsx`) calls `POST /api/onboarding/start` after Supabase auth. The route normalises plan tiers, emits a persona scaffold, and stores a new row in `onboarding_sessions` with empty JSON history (`frontend/src/app/api/onboarding/start/route.ts`).
2. Conversation turns hit `POST /api/onboarding/message`. We fetch and validate the session, run the deterministic `processUserMessage()` stage heuristic, persist the updated history + stage payloads, and echo simulated AI responses. CrewAI is not yet invoked here.
3. Completion flows run through `POST /api/onboarding/complete`, which currently synthesises an entrepreneur brief, creates a linked `projects` row (adding onboarding metadata as defined in migration `00009_onboarding_schema.sql`), and returns a dashboard redirect. Strategic content comes from a placeholder `generateStrategicAnalysis()`.
4. The planned CrewAI hand-off is `/.netlify/functions/crew-analyze`: a Netlify Python function that authenticates Supabase JWTs, instantiates `StartupAICrew`, and should persist evidence/outcomes to Supabase. The skeleton exists but still references undefined state (rate-limit counter) and writes no evidence today.
5. Product creation UI (`frontend/src/components/onboarding/ProjectCreationWizard.tsx`) already attempts to call that Netlify endpoint, falling back to mock insights when the function fails. This is the primary integration touchpoint once the crew backend is live.
6. Manual or CI-driven runs continue to go through `backend/src/startupai/main.py`, which loads `.env`, validates required inputs, and executes the sequential crew pipeline.

## Error Handling

- All onboarding endpoints return structured error payloads with a `retryable` hint so the client can decide whether to resubmit (`frontend/src/app/api/onboarding/message/route.ts:262`).
- Duplicate message submissions are detected by scanning the stored JSON conversation history. When replays happen we reply from a five-minute cache (`getCachedResponse()`) without double-writing Supabase.
- `updateOnboardingSession()` extends expiry on every successful turn. A failed write surfaces an error but preserves the previous state, preventing corrupted sessions.
- `EvidenceStoreTool` retries Supabase writes three times with exponential backoff, falls back to storing rows without embeddings when OpenAI errors occur, and emits accessibility-aware JSON errors (`backend/src/startupai/tools.py:120`).
- `netlify/functions/crew-analyze.py` includes JWT validation, logging, and rate-limit scaffolding; however the helper is not invoked and the response references an undefined `remaining` variable. These gaps must be closed before exposing the endpoint.

## Security & Compliance

- Supabase service-role access stays server-side. `createAdminClient()` is wrapped in try/catch so local development can fall back to user-scoped clients without leaking credentials.
- Backend `.env` guidance and the Netlify function both emphasise that `SUPABASE_SERVICE_ROLE_KEY` and LLM keys must never ship to the client (`backend/.env.example`, `netlify/functions/crew-analyze.py`).
- Until CrewAI activation, no user text leaves Supabase. When the Netlify hand-off is enabled we must port the masking rules from `archive/legacy/retention-and-pii.md` before serialising prompts.
- Evidence rows are tagged with `metadata.accessibility` hints and embeddings stay optional, aligning with internal accessibility targets and allowing OpenAI outages without data loss.
- Onboarding tables (`onboarding_sessions`, `entrepreneur_briefs`) are protected by RLS policies created in migration `00009`. Any CrewAI writer must continue to operate through service-role credentials or stored procedures.

Related documents:
- [`specs/api-onboarding.md`](api-onboarding.md) - HTTP contract that eventually hands requests off to CrewAI.
- [`specs/data-schema.md`](data-schema.md) - Supabase structures and functions used by the onboarding + CrewAI pipeline.
- [`overview/architecture.md`](../overview/architecture.md) - end-to-end system view linking marketing, onboarding, Supabase, and CrewAI.
- Persona reference remains in `archive/legacy/onboarding-agent-personality.md` until the CrewAI prompts are refreshed.
- Operational deep dive: [`backend/CREW_AI.md`](../../backend/CREW_AI.md).

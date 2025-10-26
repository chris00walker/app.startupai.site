---
purpose: "Private technical source of truth for CrewAI integration"
status: "active"
last_reviewed: "2025-10-27"
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
3. Completion flows run through `POST /api/onboarding/complete`, which now (a) upserts the entrepreneur brief, (b) creates/updates the linked `projects` row, and (c) calls the app-router hand-off at `POST /api/analyze`. The handler enforces trial/plan limits, proxies the request to CrewAI, persists evidence+reports with the service-role client, and returns the structured payload to the caller.
4. `/.netlify/functions/crew-analyze.py` authenticates Supabase JWTs, enforces the in-memory rate limiter, normalises the `StartupAICrew` output into a JSON contract (summary, insight_summaries, evidence scaffold), and hands that back to the Next.js route for database persistence.
5. Product creation (`frontend/src/components/onboarding/ProjectCreationWizard.tsx`) now calls `/api/analyze` instead of the raw Netlify function. It creates the project on-demand, shows live progress/error states, and regenerates insights on request.
6. Manual or CI-driven runs continue to go through `backend/src/startupai/main.py`, which loads `.env`, validates required inputs, and executes the sequential crew pipeline. Project gate pages now surface the latest CrewAI summary pulled from the persisted `reports` row.

## Error Handling

- All onboarding endpoints return structured error payloads with a `retryable` hint so the client can decide whether to resubmit (`frontend/src/app/api/onboarding/message/route.ts:262`).
- Duplicate message submissions are detected by scanning the stored JSON conversation history. When replays happen we reply from a five-minute cache (`getCachedResponse()`) without double-writing Supabase.
- `updateOnboardingSession()` extends expiry on every successful turn. A failed write surfaces an error but preserves the previous state, preventing corrupted sessions.
- `EvidenceStoreTool` retries Supabase writes three times with exponential backoff, falls back to storing rows without embeddings when OpenAI errors occur, and emits accessibility-aware JSON errors (`backend/src/startupai/tools.py:120`).
- `netlify/functions/crew-analyze.py` now validates JWTs, enforces the per-user rate limiter, normalises CrewAI output, and returns a structured payload containing `analysis_id`, `summary`, `insight_summaries`, and metadata about execution time and rate limits. Failures propagate clear error messages so the Next.js route can surface retries/fallbacks.
- `/api/analyze` guards plan usage (`assertTrialAllowance` + monthly workflow counts), wraps the Netlify call in a limited retry, and persists `reports`, `evidence`, and optional `entrepreneur_briefs` updates via the service-role client. Any persistence failure is logged but does not expose secrets to the client.

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

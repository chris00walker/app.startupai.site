---
purpose: "Private technical source of truth for onboarding API contracts"
status: "active"
last_reviewed: "2025-10-28"
updated: "2025-10-28"
---

# Onboarding API Specification

Implementation lives in `frontend/src/app/api/onboarding/{start,message,complete}/route.ts`. All routes are authenticated (Supabase server client derived from cookies) and return JSON.

## Backend Integration

**CrewAI AMP Platform:** The API routes integrate with CrewAI flows deployed on the CrewAI AMP platform. The onboarding completion triggers the strategic analysis workflow.

- **Onboarding:** Vercel AI SDK handles the conversational UI (frontend/src/app/api/chat/route.ts)
- **Analysis Workflow:** CrewAI Flows on AMP (kickoff triggered from /api/onboarding/complete)
- **Configuration:** See `docs/master-architecture/reference/amp-configuration.md`

The CrewAI backend handles the strategic validation workflow with 8 crews and 18 specialist agents.

## Endpoint Summary

| Route | Method | Handler | Key Responsibilities |
| --- | --- | --- | --- |
| `/api/onboarding/start` | POST | `start/route.ts` | Validate plan limits, create/resume session, return agent intro and first prompt. |
| `/api/onboarding/message` | POST | `message/route.ts` | Persist message, update stage progress, emit next prompt, optional CrewAI action hints. |
| `/api/onboarding/complete` | POST | `complete/route.ts` | Finalize session, write entrepreneur brief + feedback, enqueue CrewAI workflow. |

All responses follow `{ success: boolean, ... }` structure. Errors include `{ error: { code, message, retryable, fallbackOptions } }`.

## `/start`

### Request

```jsonc
{
  "planType": "trial",
  "resumeSessionId": null,
  "userContext": {
    "referralSource": "pricing_page",
    "previousExperience": "first_time",
    "timeAvailable": 20
  }
}
```

- `planType`: `'trial' | 'sprint' | 'founder' | 'enterprise'` (validated against `PLAN_LIMITS`).
- `resumeSessionId`: optional previous session ID.
- `userContext`: optional metadata (stored in `onboarding_sessions.user_context`).

### Response (success)

- `sessionId`: stable identifier (`onb_…`).
- `agentIntroduction`, `firstQuestion`, `estimatedDuration`.
- `stageInfo`: `{ currentStage, totalStages, stageName, stageDescription }`.
- `conversationContext`: includes persona, expected outcomes, privacy notice.

### Errors

- `INVALID_PLAN`, `SESSION_LIMIT_EXCEEDED`, `USER_NOT_FOUND`, `AI_SERVICE_UNAVAILABLE`.
- Plan limits enforced via `checkPlanLimits` (counts sessions since start of month).

## `/message`

### Request

```jsonc
{
  "sessionId": "onb_abcd123",
  "message": "We build AI tooling for founders",
  "intent": "answer",
  "metadata": { "stage": 2 }
}
```

- Persists message in `conversation_history` JSONB.
- Updates `stage_progress`, `overall_progress`, `last_activity`.
- Calculates `systemActions` (e.g., `triggerWorkflow`, `saveCheckpoint`).

### Response

- `agentResponse`: AI/system reply (scripted until CrewAI online).
- `followUpQuestion`: next prompt.
- `stageInfo`: updated progress.
- `analytics`: optional instrumentation payload.

### Error Codes

- `INVALID_SESSION`, `SESSION_EXPIRED`, `AI_SERVICE_UNAVAILABLE`, `RATE_LIMITED` (future).

## `/complete`

### Request

```jsonc
{
  "sessionId": "onb_abcd123",
  "finalConfirmation": true,
  "entrepreneurBrief": { /* structured payload */ },
  "userFeedback": {
    "satisfaction": 5,
    "comments": "Great flow"
  }
}
```

### Behaviour

1. Validates session ownership + status.
2. Writes entrepreneur brief into `entrepreneur_briefs` (see [`specs/data-schema.md`](data-schema.md)).
3. Updates `onboarding_sessions` status → `completed`, sets `completed_at`.
4. Inserts feedback (`onboarding_feedback`).
5. Updates usage counters (`trial_usage_counters`).
6. Returns success payload with next-step links (dashboard, reports). CrewAI enqueue will replace stub once workflow is live.

### Errors

- `BRIEF_VALIDATION_FAILED`, `SESSION_NOT_FOUND`, `DUPLICATE_COMPLETION`.

## Plan Limits

`PLAN_LIMITS` constant in `start/route.ts`:

| Plan | Sessions / month | Messages / session | Analysis workflows / month |
| --- | --- | --- | --- |
| trial | 3 | 100 | 3 |
| sprint | 5 | 150 | 5 |
| founder | 15 | 300 | 25 |
| enterprise | 100 | 1000 | 200 |

Violations return `SESSION_LIMIT_EXCEEDED` with `fallbackOptions` (upgrade, contact_support).

## Security & Compliance

- Requires Supabase session cookie; unauthenticated calls receive 401.
- No service-role usage except in admin utilities/tests.
- Logs redact PII before forwarding to PostHog.
- TODO: rate limiting (Netlify edge or Supabase function) to prevent abuse.

## Testing

- Specification-driven browser tests: `frontend/src/__tests__/business-requirements/marketing-promise-delivery.test.tsx`.
- Production smoke suite: `frontend/src/__tests__/production/deployment-validation.test.tsx`.
- Accessibility regression: `frontend/src/__tests__/accessibility/wcag-compliance.test.tsx`.
- Manual: Postman collection stored internally until CrewAI streaming is finalized.

## Roadmap

- Swap scripted responses with CrewAI output once workflows stabilize.
- Add resumable sessions UI flow once analytics confirm demand.
- Emit structured analytics events for stage drop-off analysis.

Marketing-facing summary maintained in `startupai.site/docs/specs/api-onboarding.md`.

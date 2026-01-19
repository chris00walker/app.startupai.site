---
purpose: "Private technical source of truth for onboarding API contracts"
status: "active"
last_reviewed: "2026-01-18"
updated: "2026-01-18"
---

# Onboarding API Specification

Implementation lives in `frontend/src/app/api/onboarding/*/route.ts` and `frontend/src/app/api/chat/*/route.ts`. All routes are authenticated (Supabase server client derived from cookies) and return JSON.

## Architecture

> **Source of Truth**: See [ADR-004: Two-Pass Onboarding Architecture](../../../startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md)

### Two-Pass Flow (Jan 2026)

The onboarding API uses a Two-Pass Architecture:
- **Pass 1**: LLM streams conversation via `/api/chat/stream` (no tools, pure conversation)
- **Pass 2**: Backend deterministically assesses quality after each message

For full implementation details, see ADR-004 in the master architecture.

### Split API (ADR-005)

Chat functionality is split into two atomic endpoints:
- `/api/chat/stream` - Stateless streaming (returns AI response)
- `/api/chat/save` - Atomic persistence (saves message + assessment to DB)

This replaces the deprecated `/api/onboarding/message` endpoint.

### Key Files (This Repo)
- `/api/chat/stream/route.ts` - Two-Pass streaming orchestration
- `/api/chat/save/route.ts` - Atomic message persistence
- `/lib/onboarding/founder-quality-assessment.ts` - Assessment logic
- `/lib/onboarding/consultant-quality-assessment.ts` - Consultant variant
- `/lib/onboarding/founder-stages-config.ts` - Stage configuration

## Backend Integration

**Modal Serverless:** The API routes integrate with CrewAI Flows deployed on Modal. The onboarding completion triggers the strategic analysis workflow.

- **Onboarding Chat:** Vercel AI SDK via OpenRouter → Groq (300 tok/s)
- **Quality Assessment:** OpenRouter auto-router for backend assessment
- **Analysis Workflow:** CrewAI Flows on Modal (kickoff triggered from `/api/onboarding/complete`)
- **Configuration:** See `startupai-crew/docs/master-architecture/reference/modal-configuration.md`

The CrewAI backend handles the strategic validation workflow with 5 flows, 14 crews, and 45 specialist agents.

## Session Lifecycle

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/onboarding/start` | POST | Create or resume session |
| `/api/onboarding/status` | GET | Get current progress |
| `/api/onboarding/pause` | POST | Save state for later |
| `/api/onboarding/abandon` | POST | Mark session abandoned |
| `/api/onboarding/recover` | POST | Resume abandoned session |
| `/api/onboarding/revise` | POST | Return to previous stage |
| `/api/onboarding/complete` | POST | Finalize and trigger CrewAI |
| `/api/onboarding/brief` | GET | Retrieve extracted brief |
| `/api/onboarding/queue` | POST | Queue session for background processing |

## Endpoint Reference

### `/api/onboarding/start`

**POST** - Create or resume an onboarding session.

#### Request

```jsonc
{
  "planType": "trial",
  "resumeSessionId": null,
  "userContext": {
    "referralSource": "pricing_page",
    "previousExperience": "first_time",
    "timeAvailable": 20
  },
  "mode": "founder" // or "client" for consultant intake
}
```

- `planType`: `'trial' | 'sprint' | 'founder' | 'enterprise'` (validated against `PLAN_LIMITS`).
- `resumeSessionId`: optional previous session ID for resumption.
- `userContext`: optional metadata (stored in `onboarding_sessions.user_context`).
- `mode`: `'founder'` (default) or `'client'` for consultant-driven intake.

#### Response (success)

```jsonc
{
  "success": true,
  "sessionId": "onb_abc123",
  "agentIntroduction": "Hi, I'm Alex...",
  "firstQuestion": "What problem are you solving?",
  "estimatedDuration": 20,
  "stageInfo": {
    "currentStage": 1,
    "totalStages": 7,
    "stageName": "Problem",
    "stageDescription": "Understanding the core problem"
  },
  "conversationContext": {
    "persona": "Alex",
    "expectedOutcomes": [...],
    "privacyNotice": "..."
  }
}
```

#### Errors

- `INVALID_PLAN` - Plan type not recognized
- `SESSION_LIMIT_EXCEEDED` - Monthly limit reached
- `USER_NOT_FOUND` - Auth user not found
- `AI_SERVICE_UNAVAILABLE` - LLM provider down

---

### `/api/onboarding/status`

**GET** - Get current session status and progress.

#### Query Parameters

- `sessionId` (required): The session identifier

#### Response

```jsonc
{
  "success": true,
  "currentStage": 3,
  "overallProgress": 45,
  "stageProgress": 60,
  "status": "active",
  "completed": false,
  "briefData": { /* extracted data so far */ }
}
```

---

### `/api/onboarding/pause`

**POST** - Pause session for later resumption.

#### Request

```jsonc
{
  "sessionId": "onb_abc123"
}
```

#### Response

```jsonc
{
  "success": true,
  "status": "paused",
  "resumeToken": "resume_xyz789"
}
```

---

### `/api/onboarding/abandon`

**POST** - Mark session as abandoned (user explicitly quit).

#### Request

```jsonc
{
  "sessionId": "onb_abc123",
  "reason": "too_long" // optional
}
```

---

### `/api/onboarding/recover`

**POST** - Recover an abandoned or expired session.

#### Request

```jsonc
{
  "sessionId": "onb_abc123"
}
```

#### Response

Returns same structure as `/start` with session state restored.

---

### `/api/onboarding/revise`

**POST** - Go back to a previous stage to revise answers.

#### Request

```jsonc
{
  "sessionId": "onb_abc123",
  "targetStage": 2
}
```

---

### `/api/onboarding/complete`

**POST** - Finalize session and trigger CrewAI validation.

#### Request

```jsonc
{
  "sessionId": "onb_abc123",
  "finalConfirmation": true,
  "userFeedback": {
    "satisfaction": 5,
    "comments": "Great flow"
  }
}
```

#### Behaviour

1. Validates session ownership + status
2. Extracts entrepreneur brief from conversation
3. Writes to `entrepreneur_briefs` (Layer 1 artifact)
4. Updates `onboarding_sessions` status → `completed`
5. Triggers CrewAI `/kickoff` on Modal
6. Returns success with dashboard links

#### Response

```jsonc
{
  "success": true,
  "briefId": "brief_abc123",
  "nextSteps": {
    "dashboardUrl": "/founder/dashboard",
    "validationStatus": "queued"
  }
}
```

---

### `/api/onboarding/brief`

**GET** - Retrieve the extracted entrepreneur brief.

#### Query Parameters

- `sessionId` (required): The session identifier

#### Response

```jsonc
{
  "success": true,
  "brief": {
    "company_name": "...",
    "problem_statement": "...",
    "target_customer": "...",
    // ... all extracted fields
  },
  "qualitySignals": {
    "clarity": 0.85,
    "completeness": 0.72,
    "detail": 0.68
  }
}
```

---

### `/api/onboarding/queue`

**POST** - Queue session for background processing (bulk operations).

#### Request

```jsonc
{
  "sessionId": "onb_abc123",
  "priority": "normal" // or "high"
}
```

## Chat Endpoints

### `/api/chat/stream`

**POST** - Stream AI response (Pass 1 of Two-Pass).

#### Request

```jsonc
{
  "sessionId": "onb_abc123",
  "message": "We build AI tooling for founders",
  "stage": 2
}
```

#### Response

Server-Sent Events stream with AI response chunks.

---

### `/api/chat/save`

**POST** - Persist message and assessment (Pass 2 of Two-Pass).

#### Request

```jsonc
{
  "sessionId": "onb_abc123",
  "userMessage": "We build AI tooling for founders",
  "assistantMessage": "That's interesting! Who are your target customers?",
  "stage": 2
}
```

#### Behaviour

1. Persists both messages to `conversation_history` JSONB
2. Runs quality assessment (founder-quality-assessment.ts)
3. Updates `stage_progress`, `overall_progress`
4. Determines if stage should advance

#### Response

```jsonc
{
  "success": true,
  "stageInfo": {
    "currentStage": 2,
    "stageProgress": 75,
    "overallProgress": 28,
    "shouldAdvance": false
  },
  "qualitySignals": {
    "clarity": 0.82,
    "completeness": 0.65,
    "topicsCovered": ["problem", "target_customer"]
  }
}
```

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

- Requires Supabase session cookie; unauthenticated calls receive 401
- No service-role usage except in admin utilities/tests
- Logs redact PII before forwarding to PostHog
- Rate limiting enforced at edge (Netlify)

## Error Response Format

All errors follow this structure:

```jsonc
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "The specified session does not exist",
    "retryable": false,
    "fallbackOptions": ["create_new"]
  }
}
```

## Related Documentation

- **Consultant API**: See [api-consultant.md](api-consultant.md)
- **CrewAI Integration**: See [api-crewai.md](api-crewai.md)
- **Approvals (HITL)**: See [api-approvals.md](api-approvals.md)
- **Master Architecture**: See `startupai-crew/docs/master-architecture/`

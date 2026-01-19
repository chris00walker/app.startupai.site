---
purpose: "Private technical source of truth for onboarding API contracts"
status: "active"
last_reviewed: "2026-01-19"
updated: "2026-01-19"
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
| `/api/onboarding/revise` | POST | Reset session for revision (from SummaryModal) |
| `/api/onboarding/complete` | POST | Finalize and trigger CrewAI |
| `/api/onboarding/brief` | GET | Retrieve extracted brief |
| `/api/onboarding/queue` | POST | Queue completed session for CrewAI kickoff |
| `/api/onboarding/debug` | GET | Debug endpoint (development only) |

## Endpoint Reference

### `/api/onboarding/start`

**POST** - Create or resume an onboarding session.

#### Request

```jsonc
{
  "userId": "uuid-of-user",  // Optional, derived from auth
  "planType": "trial",       // 'trial' | 'sprint' | 'founder' | 'enterprise'
  "resumeSessionId": null,   // Optional: resume specific session
  "forceNew": false,         // Skip session resumption, create fresh
  "mode": "founder",         // 'founder' (default) or 'client' (consultant intake)
  "clientProjectId": null,   // Optional: project ID when in client mode
  "userContext": {           // Optional metadata
    "referralSource": "pricing_page",
    "previousExperience": "first_time",  // 'first_time' | 'experienced' | 'serial_entrepreneur'
    "timeAvailable": 20      // minutes available
  }
}
```

#### Response (success)

```jsonc
{
  "success": true,
  "sessionId": "founder-{userId}-{timestamp}",
  "agentIntroduction": "Hi, I'm Alex...",
  "firstQuestion": "What problem are you solving?",
  "estimatedDuration": "20 minutes",
  "stageInfo": {
    "currentStage": 1,
    "totalStages": 7,
    "stageName": "Welcome & Introduction",
    "stageDescription": "Understanding you and your business concept"
  },
  "conversationContext": {
    "agentPersonality": { /* Alex personality config */ },
    "expectedOutcomes": ["Business concept clarity", "Problem definition"],
    "privacyNotice": "..."
  },
  "qualitySignals": {
    "clarity": { "label": "low", "score": 0 },
    "completeness": { "label": "low", "score": 0 },
    "detail_score": 0,
    "overall": 0
  },
  "stageSnapshot": {
    "stage": 1,
    "coverage": 0,
    "quality": { /* ... */ },
    "brief_fields": [],
    "updated_at": "2026-01-19T10:00:00Z"
  }
}
```

#### Errors

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Missing required fields |
| `INVALID_PLAN` | Plan type not recognized |
| `SESSION_LIMIT_EXCEEDED` | Monthly limit reached |
| `USER_NOT_FOUND` | Auth user not found |
| `AI_SERVICE_UNAVAILABLE` | LLM provider down |

---

### `/api/onboarding/status`

**GET** - Get current session status and progress.

#### Query Parameters

- `sessionId` (optional): The session identifier. If omitted, finds most recent active/paused session for user.

#### Response (session found)

```jsonc
{
  "success": true,
  "sessionId": "founder-{userId}-{timestamp}",
  "currentStage": 3,
  "totalStages": 7,
  "overallProgress": 45,
  "stageProgress": 60,
  "messageCount": 12,
  "status": "active",  // 'active' | 'paused' | 'completed' | 'abandoned'
  "lastActivity": "2026-01-19T10:00:00Z",
  // Only for completed sessions with stage_data.completion:
  "completion": { /* completion data if available */ }
}
```

#### Response (no session found, sessionId omitted)

```jsonc
{
  "success": true,
  "sessionId": null,
  "status": null
}
```

---

### `/api/onboarding/pause`

**POST** - Pause session for later resumption.

#### Request

```jsonc
{
  "sessionId": "founder-{userId}-{timestamp}"
}
```

#### Response

```jsonc
{
  "success": true,
  "message": "Session paused successfully"
}
```

#### Idempotent

If session is already paused, returns success without error.

#### Errors

- Cannot pause completed sessions
- Cannot pause abandoned sessions

---

### `/api/onboarding/abandon`

**POST** - Mark session as abandoned (user explicitly quit).

Session data is preserved for analytics and potential recovery via `/recover`.

#### Request

```jsonc
{
  "sessionId": "founder-{userId}-{timestamp}"
}
```

#### Response

```jsonc
{
  "success": true,
  "message": "Session abandoned successfully"
}
```

#### Errors

- Cannot abandon completed sessions

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

**POST** - Reset completed session for revision (called from SummaryModal "Revise" button).

Cancels any pending queue row and resets session status to `active`.

#### Request

```jsonc
{
  "sessionId": "founder-{userId}-{timestamp}"
}
```

#### Response (success)

```jsonc
{
  "success": true,
  "status": "reset",
  "queueDeleted": true  // true if pending queue row was cancelled
}
```

#### Response (cannot revise)

```jsonc
{
  "success": false,
  "status": "cannot_revise",
  "error": "Analysis already in progress or completed"
}
```

#### Notes

Part of the split completion flow:
1. Stage 7 completes → Session marked `completed` (no queue yet)
2. User clicks "Approve" → `/api/onboarding/queue` inserts queue row
3. User clicks "Revise" → This endpoint resets session to `active`

---

### `/api/onboarding/complete`

**POST** - Finalize session, create project, and trigger CrewAI validation.

#### Request

```jsonc
{
  "sessionId": "founder-{userId}-{timestamp}",
  "finalConfirmation": true,
  "entrepreneurBrief": { /* extracted brief data */ },
  "userFeedback": {          // Optional
    "conversationRating": 5, // 1-5
    "clarityRating": 5,      // 1-5
    "helpfulnessRating": 5,  // 1-5
    "comments": "Great flow"
  }
}
```

#### Behaviour

1. Validates session ownership + status
2. Creates `entrepreneur_briefs` record (Layer 1 artifact)
3. Creates `projects` record
4. Updates `onboarding_sessions` status → `completed`
5. Triggers CrewAI `/kickoff` on Modal
6. Returns project details + workflow info

#### Response

```jsonc
{
  "success": true,
  "workflowId": "wf_1705656000_abc123",
  "workflowTriggered": true,
  "estimatedCompletionTime": "5-10 minutes",
  "nextSteps": [
    {
      "step": "Review Brief",
      "description": "Review your entrepreneur brief",
      "estimatedTime": "2 minutes",
      "priority": "high"
    }
  ],
  "deliverables": {
    "analysisId": "uuid",
    "summary": "Brief summary...",
    "insights": [{ "id": "...", "headline": "...", "confidence": "high" }],
    "rawOutput": "..."
  },
  "dashboardRedirect": "/project/{projectId}/gate",
  "projectCreated": {
    "projectId": "uuid",
    "projectName": "My Startup",
    "projectUrl": "/project/{projectId}"
  },
  "analysisMetadata": {
    "evidenceCount": 5,
    "evidenceCreated": 5,
    "reportCreated": true,
    "rateLimit": { "limit": 10, "remaining": 9, "windowSeconds": 3600 }
  }
}
```

#### Errors

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Missing required fields |
| `INVALID_SESSION` | Session not found or not owned |
| `WORKFLOW_TRIGGER_FAILED` | Modal kickoff failed |
| `PROJECT_CREATION_FAILED` | Database error creating project |
| `PROCESSING_ERROR` | General processing error |

---

### `/api/onboarding/brief`

**GET** - Retrieve the extracted entrepreneur brief.

Used by HITL approval flow to display Founder's Brief for review.

#### Query Parameters

- `projectId` (optional): The project ID to fetch brief for
- `sessionId` (optional): The session ID to fetch brief for

One of `projectId` or `sessionId` is required. If `projectId` is provided, looks up `sessionId` from project metadata.

#### Response

```jsonc
{
  "success": true,
  "brief": {
    "id": "uuid",
    "session_id": "founder-{userId}-{timestamp}",
    "user_id": "uuid",
    "company_name": "...",
    "problem_description": "...",
    "solution_description": "...",
    "target_customers": "...",
    "competitive_advantages": "...",
    // ... all extracted fields from entrepreneur_briefs table
    "created_at": "2026-01-19T10:00:00Z",
    "updated_at": "2026-01-19T10:00:00Z"
  }
}
```

---

### `/api/onboarding/queue`

**POST** - Queue completed session for CrewAI kickoff (called from SummaryModal "Approve" button).

Inserts a row in `pending_completions` queue table.

#### Request

```jsonc
{
  "sessionId": "founder-{userId}-{timestamp}"
}
```

#### Response (success)

```jsonc
{
  "success": true,
  "status": "queued"
}
```

#### Response (already queued)

```jsonc
{
  "success": true,
  "status": "already_queued"
}
```

#### Response (invalid state)

```jsonc
{
  "success": false,
  "status": "invalid_state",
  "error": "Session not in completed state"
}
```

#### Notes

Part of the split completion flow:
1. Stage 7 completes → Session marked `completed` (no queue yet)
2. User clicks "Approve" → This endpoint inserts queue row
3. User clicks "Revise" → `/api/onboarding/revise` resets session

## Chat Endpoints

### `/api/chat/stream`

**POST** - Stream AI response (Pass 1 of Two-Pass).

Stateless streaming endpoint - NO persistence. Uses OpenRouter with Groq provider for ~300 tok/s streaming.

#### Request

```jsonc
{
  "messages": [
    { "role": "user", "content": "We build AI tooling for founders" }
  ],
  "sessionId": "founder-{userId}-{timestamp}"
}
```

#### Response

Server-Sent Events stream (`text/event-stream`) with AI response chunks.

After stream completes, client should call `/api/chat/save` to persist.

---

### `/api/chat/save`

**POST** - Atomic message persistence (Pass 2 of Two-Pass).

Persists messages via `apply_onboarding_turn` Supabase RPC. Runs quality assessment and may trigger stage advancement.

#### Request

```jsonc
{
  "sessionId": "founder-{userId}-{timestamp}",
  "messageId": "msg_unique_id",
  "userMessage": {
    "role": "user",
    "content": "We build AI tooling for founders",
    "timestamp": "2026-01-19T10:00:00Z"
  },
  "assistantMessage": {
    "role": "assistant",
    "content": "That's interesting! Who are your target customers?",
    "timestamp": "2026-01-19T10:00:01Z"
  },
  "expectedVersion": 5  // Optional: for conflict detection (ADR-005)
}
```

#### Behaviour

1. Validates session ownership + status
2. Checks for duplicate `messageId` (idempotency)
3. Runs quality assessment (`founder-quality-assessment.ts`)
4. Commits state atomically via `apply_onboarding_turn` RPC
5. Returns updated progress and extracted topics

#### Response (success)

```jsonc
{
  "success": true,
  "status": "committed",
  "version": 6,
  "currentStage": 2,
  "overallProgress": 28,
  "stageProgress": 75,
  "stageAdvanced": false,
  "completed": false,
  "collectedTopics": ["business_concept", "target_customers"]
}
```

#### Response (duplicate)

```jsonc
{
  "success": true,
  "status": "duplicate"
}
```

#### Response (version conflict - ADR-005)

```jsonc
{
  "success": false,
  "status": "version_conflict",
  "currentVersion": 6,
  "expectedVersion": 5,
  "error": "Version mismatch"
}
```

#### Response (stage 7 completed)

```jsonc
{
  "success": true,
  "status": "committed",
  "completed": true,
  "queued": true,  // Queued for background processing
  "workflowId": "wf_...",
  "projectId": "uuid"
}
```

---

### `/api/chat` (Legacy)

**POST** - Legacy chat endpoint (tool-based stage progression).

Deprecated in favor of Two-Pass Architecture. Kept for backward compatibility.

Uses Vercel AI SDK with tool calling for `assessQuality`, `advanceStage`, `completeOnboarding`.

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

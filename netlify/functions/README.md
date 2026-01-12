# Netlify Functions for StartupAI Backend

## Overview

This directory contains Netlify serverless functions for the StartupAI platform.

> **Note**: The primary backend is implemented via **Next.js API routes** in `frontend/src/app/api/`, and the canonical AI backend runs on **Modal** (`startupai-crew`). These Netlify functions are legacy/supplementary; avoid adding new AI workflows here.

## Structure

```
netlify/functions/
├── crewai-analyze.py    # Legacy CrewAI analysis endpoint (deprecated)
├── gate-evaluate.py     # Gate evaluation endpoint (legacy)
└── README.md            # This file
```

## Functions

### 1. crewai-analyze.py

**Endpoint:** `POST /.netlify/functions/crewai-analyze`

**Purpose:** Legacy CrewAI strategic analysis workflows (deprecated in favor of Modal)

**Features:**
- JWT authentication with Supabase
- Request/response logging
- Error tracking

### 2. gate-evaluate.py

**Endpoint:** `POST /.netlify/functions/gate-evaluate` (legacy)

**Purpose:** Evaluates validation gates (desirability, feasibility, viability)

## Request Format

```json
{
  "entrepreneur_input": "Description of startup idea and business context",
  "project_id": "uuid-string"
}
```

## Response Format

```json
{
  "success": true,
  "result": "Analysis results...",
  "metadata": {
    "project_id": "uuid",
    "timestamp": "..."
  }
}
```

## Configuration

### netlify.toml

```toml
[functions]
  directory = "netlify/functions"
```

### Environment Variables

Required environment variables (set in Netlify UI):
- `OPENAI_API_KEY` - OpenAI API key for LLM
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key (for JWT validation)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key (for admin operations)

Optional:
- `ANTHROPIC_API_KEY` - For Claude models

## Backend Configuration

Additional AI backend configuration lives in `startupai-crew` (Modal).

## Deployment

Functions are automatically deployed when pushing to GitHub:

1. Commit changes to the `netlify/functions/` directory
2. Push to `main` branch
3. Netlify automatically builds and deploys

## Performance Considerations

### Cold Starts
- First invocation may take 5-10 seconds to load dependencies
- Subsequent calls within ~15 minutes are faster (warm container)

### Timeouts
- Default Netlify function timeout: 10 seconds (free tier) / 26 seconds (pro)
- For longer operations, consider background functions

## Monitoring

Check function logs in Netlify dashboard:
- Navigate to: Functions → [function-name] → Function log

## Security

1. **Authentication**: Requires Bearer token in Authorization header
2. **JWT Validation**: Supabase JWT verification
3. **Error Handling**: Errors logged but sensitive data not exposed

## Next Steps

- [ ] Implement Redis-based distributed rate limiting
- [ ] Add result notification system (webhooks/realtime)
- [ ] Implement retry logic for transient failures
- [ ] Add integration tests
- [ ] Set up error alerting

## API Architecture (Canonical)

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Requests                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐
│   Next.js API       │    │   Netlify Functions │
│   (Primary)         │    │   (Supplementary)   │
│                     │    │                     │
│ /api/analyze        │    │ /.netlify/functions/│
│ /api/crewai/*       │    │   crewai-analyze    │
│ /api/onboarding/*   │    │   gate-evaluate     │
│ /api/projects/*     │    │                     │
└─────────────────────┘    └─────────────────────┘
         │                           │
         └───────────┬───────────────┘
                     ▼
         ┌───────────────────────┐
         │   Modal Serverless    │
         │  (14-crew/45-agent)   │
         └───────────────────────┘
```

**When to use which:**
- **Next.js API routes** - TypeScript handlers, Supabase integration, streaming responses
- **Netlify Functions** - Legacy endpoints only (avoid for new AI workflows)

## Resources

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Python Functions Guide](https://docs.netlify.com/functions/python/)
- [CrewAI Documentation](https://docs.crewai.com/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Last Updated**: 2025-11-26

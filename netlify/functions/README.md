# Netlify Functions for StartupAI Backend

## Overview

This directory contains Netlify serverless functions for the StartupAI CrewAI backend deployment.

## Structure

```
netlify/functions/
├── crew-analyze.py      # Main CrewAI analysis endpoint
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Functions

### 1. crew-analyze.py (Standard Function)

**Endpoint:** `POST /api/analyze` (or `/.netlify/functions/crew-analyze`)

**Purpose:** Runs CrewAI strategic analysis workflows serverlessly

**Timeout:** 26 seconds (Pro) / 10 seconds (Free)

**Features:**
- ✅ JWT authentication with Supabase
- ✅ Rate limiting (10 requests per 15 minutes per user)
- ✅ Request/response logging
- ✅ Error tracking with timestamps
- ✅ Execution time monitoring

### 2. crew-analyze-background.py (Background Function)

**Endpoint:** `POST /api/analyze-background` (or `/.netlify/functions/crew-analyze-background`)

**Purpose:** Long-running analyses with 15-minute timeout

**Timeout:** 15 minutes (wall clock time)

**Features:**
- Returns 202 immediately
- Runs analysis in background
- Results stored in database/blob storage
- Suitable for complex, multi-agent workflows

### Request Format

```json
{
  "strategic_question": "What are the key trends in AI strategic planning?",
  "project_id": "uuid-string",
  "project_context": "Optional context about the project",
  "target_sources": "Optional comma-separated sources",
  "report_format": "markdown",
  "project_deadline": "2025-12-31",
  "priority_level": "medium"
}
```

### Response Format

```json
{
  "success": true,
  "result": "Analysis results...",
  "metadata": {
    "project_id": "uuid",
    "question": "..."
  }
}
```

### Error Responses

- `400` - Bad request (missing fields, invalid JSON)
- `401` - Unauthorized (missing or invalid auth token)
- `405` - Method not allowed (non-POST request)
- `429` - Rate limit exceeded (max 10 requests per 15 minutes)
- `500` - Internal server error

### Response Headers

- `X-RateLimit-Limit` - Maximum requests allowed in window
- `X-RateLimit-Remaining` - Requests remaining in current window
- `X-RateLimit-Reset` - Seconds until rate limit resets
- `X-Execution-Time` - Function execution time in seconds
- `Retry-After` - Seconds to wait before retrying (on 429)

## Configuration

### Netlify.toml

```toml
[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/api/analyze"
  to = "/.netlify/functions/crew-analyze"
  status = 200
```

### Environment Variables

Required environment variables (set in Netlify UI):
- `OPENAI_API_KEY` - OpenAI API key for LLM
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key (for JWT validation)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key (for admin operations)
- `DATABASE_URL` - Database connection string

Optional:
- `ANTHROPIC_API_KEY` - For Claude models
- `GOOGLE_AI_API_KEY` - For Gemini models

## Dependencies

Python dependencies are specified in `requirements.txt` and automatically installed by Netlify:

- `crewai[tools]>=0.80.0` - Multi-agent framework
- `openai>=1.0.0` - OpenAI API client
- `ddgs>=0.1.0` - DuckDuckGo search
- `supabase>=2.0.0` - Database client
- Other supporting libraries

## Local Testing

```bash
# From repository root
cd /home/chris/app.startupai.site

# Test the function locally
python netlify/functions/crew-analyze.py
```

## Deployment

Functions are automatically deployed when pushing to GitHub:

1. Commit changes to the `netlify/functions/` directory
2. Push to `main` branch
3. Netlify automatically builds and deploys
4. Function available at: `https://app-startupai-site.netlify.app/api/analyze`

## Performance Considerations

### Cold Starts
- First invocation may take 5-10 seconds to load CrewAI
- Subsequent calls within ~15 minutes are faster (warm container)

### Timeouts
- Default Netlify function timeout: 10 seconds (free tier) / 26 seconds (pro)
- Background functions available for longer operations (15 min timeout)

### Memory
- CrewAI requires ~2GB RAM during execution
- May need Pro plan for complex analyses

## Monitoring

Check function logs in Netlify dashboard:
- Navigate to: Functions → crew-analyze → Function log

## Security

1. **Authentication**: Requires Bearer token in Authorization header
2. **JWT Validation**: TODO - Implement Supabase JWT verification
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Error Handling**: Errors logged but sensitive data not exposed

## Completed Features

- [x] JWT token validation with Supabase
- [x] Rate limiting (10 req/15min per user)
- [x] Background function for long analyses (15 min timeout)
- [x] Request/response logging with timestamps
- [x] Error tracking and monitoring
- [x] Execution time tracking

## Next Steps

- [ ] Implement Redis-based distributed rate limiting
- [ ] Store background function results in Supabase/Blobs
- [ ] Add result notification system (webhooks/realtime)
- [ ] Implement retry logic for transient failures
- [ ] Add integration tests
- [ ] Set up error alerting (Sentry/similar)

## Resources

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Python Functions Guide](https://docs.netlify.com/functions/python/)
- [CrewAI Documentation](https://docs.crewai.com/)

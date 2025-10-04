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

## Function: crew-analyze.py

**Endpoint:** `POST /api/analyze` (or `/.netlify/functions/crew-analyze`)

**Purpose:** Runs CrewAI strategic analysis workflows serverlessly

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
- `500` - Internal server error

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
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key
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

## Next Steps

- [ ] Implement JWT token validation
- [ ] Add rate limiting
- [ ] Create background function for long-running analyses
- [ ] Add request/response logging
- [ ] Implement retry logic
- [ ] Add integration tests

## Resources

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Python Functions Guide](https://docs.netlify.com/functions/python/)
- [CrewAI Documentation](https://docs.crewai.com/)

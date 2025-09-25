# CWC Agentic Platform API Specifications
<!-- markdownlint-disable MD013 -->

## Product Platform API Endpoints

**Reference:** [Implementation Plan - API Architecture](../../../startupai.site/docs/technical/two-site-implementation-plan.md#52-cwc-agentic-platform-apis)

### Authentication & Handoff
- `POST /api/auth/handoff` - Validate JWT token from startupai.site
- `GET /api/auth/session` - Get current user session
- `POST /api/auth/refresh` - Refresh user session

### Project Management
- `POST /api/projects/create` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `GET /api/projects` - List user projects

### Hypothesis Management
- `POST /api/hypotheses` - Create hypothesis
- `GET /api/hypotheses/{project_id}` - List project hypotheses
- `PUT /api/hypotheses/{id}` - Update hypothesis

### Evidence Collection
- `POST /api/evidence/collect` - Add evidence to hypothesis
- `GET /api/evidence/{hypothesis_id}` - Get hypothesis evidence
- `POST /api/evidence/analyze` - AI analysis of evidence

### CrewAI Integration
- `POST /api/crew/run` - Start CrewAI workflow
- `GET /api/crew/status/{run_id}` - Check workflow status
- `GET /api/crew/result/{run_id}` - Get workflow results

### Report Generation
- `POST /api/reports/generate` - Generate AI report
- `GET /api/reports/{id}` - Get report content
- `POST /api/reports/{id}/share` - Create shareable link

## Cross-Site Integration

**Authentication Flow:**
1. User completes signup/payment on startupai.site
2. startupai.site generates JWT token
3. User redirected to cwc-agentic-platform with token
4. `/api/auth/handoff` validates token and creates session

**Shared Services:**
- All APIs use shared Supabase authentication
- Cross-site analytics tracking via shared events
- User profile synchronization between sites

## Related Documentation

- **System Architecture:** [High-Level Architecture - API Architecture](../../../startupai.site/docs/technical/high_level_architectural_spec.md#5-api-architecture)
- **User Stories:** [Authentication Handoff Stories](../../../startupai.site/docs/product/user-stories.md#epic-0-cross-site-authentication--handoff)

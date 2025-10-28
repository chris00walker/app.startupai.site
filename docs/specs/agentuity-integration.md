---
purpose: "Technical specification for Agentuity agent integration"
status: "implemented"
created: "2025-10-28"
last_reviewed: "2025-10-28"
updated: "2025-10-28"
---

# CrewAI on Agentuity Integration Specification

## Overview

This document specifies the deployment of CrewAI agents on the Agentuity cloud platform for StartupAI's AI agent backend. Agentuity provides a cloud-native platform that supports CrewAI framework deployment with built-in scaling, storage, and monitoring capabilities.

**Key Decision:** CrewAI cannot run on Netlify Functions due to Python limitations. Agentuity provides a serverless cloud platform that natively supports CrewAI agents, allowing us to keep our existing CrewAI implementation while gaining cloud deployment capabilities.

## Architecture

### Deployment Model

```
┌─────────────────┐     HTTPS      ┌──────────────────┐
│   Next.js App   │ ───────────────▶│  Agentuity Cloud │
│  (Netlify CDN)  │                 │    (Serverless)   │
└─────────────────┘                 └──────────────────┘
        │                                    │
        │                                    │
        ▼                                    ▼
┌─────────────────┐                 ┌──────────────────┐
│    Supabase     │◀────────────────│  CrewAI Runtime  │
│   (Database)    │   Service Role  │  on Agentuity    │
└─────────────────┘                 └──────────────────┘
```

### Integration Points

1. **Netlify → Agentuity (HTTPS API)**
   - Frontend calls Next.js API routes on Netlify
   - API routes forward requests to Agentuity agent endpoints
   - Authentication via Bearer token (AGENTUITY_SDK_KEY)
   - Async/await pattern for agent responses

2. **Agentuity → Supabase (Direct Connection)**
   - CrewAI agents use Supabase service role key
   - Direct database writes for reports and evidence
   - Vector storage for semantic search
   - Session management via KV storage

3. **Netlify ← Supabase (Client SDK)**
   - Frontend uses Supabase client for auth
   - Real-time subscriptions for updates
   - Row-level security for data access

### Agent Configuration

**Location:** `agentuity-agent/agentuity.yaml`

```yaml
version: '>=0.0.179'
project_id: proj_cc4a88c94cad106489567765ca25a4f4
name: startupAI
description: AI founders to assist in startup development

agents:
  - id: agent_8dafe1bc5964fff0a81bb29b5b672f8b
    name: Onboarding
    description: Entrepreneur onboarding and strategic analysis

deployment:
  resources:
    memory: 250Mi
    cpu: 500M
    disk: 300Mi
  mode:
    type: on-demand  # Scales to zero when not in use
```

## Supabase Integration

### Database Operations from CrewAI

**Location:** `agentuity-agent/backend/src/startupai/tools.py`

```python
from supabase import create_client, Client
import os

class EvidenceStoreTool:
    """Tool for storing evidence in Supabase"""
    
    def __init__(self):
        self.supabase: Client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        )
    
    def store_evidence(self, project_id: str, evidence: dict):
        """Store evidence with vector embeddings"""
        # Generate embedding using OpenAI
        embedding = self._generate_embedding(evidence["content"])
        
        # Store in Supabase
        result = self.supabase.table("evidence").insert({
            "project_id": project_id,
            "content": evidence["content"],
            "embedding": embedding,
            "source_type": evidence.get("source_type", "research"),
            "tags": evidence.get("tags", [])
        }).execute()
        
        return result.data
    
    def search_evidence(self, project_id: str, query: str, limit: int = 10):
        """Semantic search using pgvector"""
        query_embedding = self._generate_embedding(query)
        
        # Use Supabase RPC for vector similarity search
        result = self.supabase.rpc(
            "match_evidence",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.7,
                "match_count": limit,
                "project_id": project_id
            }
        ).execute()
        
        return result.data
```

### Report Storage

```python
class ReportGeneratorTool:
    """Tool for generating and storing reports"""
    
    def save_report(self, project_id: str, report: dict):
        """Save generated report to Supabase"""
        result = self.supabase.table("reports").insert({
            "project_id": project_id,
            "report_type": report["type"],
            "content": report["content"],
            "insights": report.get("insights", {}),
            "recommendations": report.get("recommendations", []),
            "status": "completed"
        }).execute()
        
        # Update project with analysis results
        self.supabase.table("projects").update({
            "initial_analysis_workflow_id": report.get("workflow_id"),
            "updated_at": "now()"
        }).eq("id", project_id).execute()
        
        return result.data
```

## Onboarding Flow Integration

### Complete User Journey

1. **User selects plan** on pricing page (startupai.site)
2. **Authenticates** via GitHub or Email (Supabase Auth)
3. **Redirects to /onboarding** page (app.startupai.site)
4. **Frontend UI** displays beautiful onboarding wizard
5. **API routes** call Agentuity agent for conversation
6. **Agentuity agent** manages conversation state and personality
7. **CrewAI analysis** triggered upon completion
8. **Results displayed** in user dashboard

### Frontend-to-Backend Connection

#### Environment Configuration

```bash
# frontend/.env.local
AGENTUITY_AGENT_URL=https://your-agent.agentuity.com/onboarding
# For local development:
# AGENTUITY_AGENT_URL=http://localhost:8000/onboarding
```

#### API Routes (Next.js → Agentuity)

**`/api/onboarding/start/route.ts`:**
- Calls Agentuity agent with action: "start"
- Passes user_id, plan_type, and optional resume_session_id
- Returns session_id, first question, and stage info

**`/api/onboarding/message/route.ts`:**
- Calls Agentuity agent with action: "message"
- Sends user message and session_id
- Returns AI response, follow-up questions, and progress

**`/api/onboarding/complete/route.ts`:**
- Triggers completion and CrewAI analysis
- Stores entrepreneur brief in database
- Returns workflow_id and next steps

### Onboarding Agent Implementation

**Location:** `agentuity-agent/agentuity_agents/Onboarding/agent.py`

#### Key Features

1. **5-Stage Conversation Flow:**
   - Business Idea (Understanding the concept)
   - Target Market (Identifying customers)
   - Value Proposition (Defining uniqueness)
   - Business Model (Revenue strategy)
   - Validation Plan (Testing approach)

2. **Conversation Personality System:**
   - Empathetic, encouraging, professional traits
   - Sentiment analysis for adaptive responses
   - Stage-specific prompts and questions
   - Intelligent follow-up generation

3. **Session Management:**
   - KV storage with 24-hour TTL
   - Session resumption capability
   - Progress tracking across stages
   - Conversation history preservation

4. **Plan Limits (Disabled for Testing):**
   ```python
   ENFORCE_LIMITS = False  # Toggle for production
   ```
   When enabled:
   - Trial: 3 sessions/month, 100 messages/session
   - Founder: 10 sessions/month, 200 messages/session
   - Consultant: 50 sessions/month, 500 messages/session

5. **Accessibility Compliance:**
   - WCAG 2.2 AA standards
   - Screen reader metadata
   - Plain language error messages
   - Progress indicators with ARIA labels

#### Core Agent Structure

```python
from agentuity import AgentRequest, AgentResponse, AgentContext
from backend.src.startupai.crew import StartupAICrew
from .conversation_handler import OnboardingPersonality, ConversationEnhancer

async def run(
    request: AgentRequest,
    response: AgentResponse,
    context: AgentContext
) -> AgentResponse:
    """
    Main onboarding agent handler with full conversation flow
    """
    # Extract request data
    data = await request.data.json()
    action = data.get("action", "start")
    
    # Route to appropriate handler
    if action == "start":
        result = await handle_onboarding_start(data, context)
    elif action == "message":
        result = await handle_onboarding_message(data, context)
    elif action == "complete":
        result = await handle_onboarding_complete(data, context)
    elif action == "analyze":
        # Trigger CrewAI analysis
        result = await trigger_crewai_analysis(data, context)
    
    # Add accessibility metadata
    result = AccessibilityHelper.format_for_screen_readers(result)
    
    return response.json(result)
```

### Seamless User Experience

#### Frontend UI Components

**`OnboardingWizard.tsx`:**
- Beautiful, responsive conversation interface
- Real-time progress tracking sidebar
- Smooth animations and transitions
- Voice input support (future)
- Auto-save and resume capability

**`ConversationInterface.tsx`:**
- Chat-like message display
- Typing indicators for AI responses
- Quality signals visualization
- Stage progress indicators
- Accessibility-first design

#### Data Flow

1. **User Input** → Frontend validates and formats
2. **API Route** → Adds auth token and forwards to Agentuity
3. **Agentuity Agent** → Processes with personality and context
4. **Response** → Enhanced with metadata and accessibility
5. **Frontend** → Updates UI with smooth transitions
6. **Database** → Session state persisted for resumption

#### Session Persistence

```python
# Agentuity KV Storage
await context.kv.set(
    "onboarding_sessions",
    session_id,
    session_data,
    {"ttl": 86400}  # 24 hours
)
```

#### CrewAI Integration

When onboarding completes, the agent:
1. Builds comprehensive entrepreneur brief
2. Triggers CrewAI analysis with brief data
3. Returns workflow ID for tracking
4. Stores results in Supabase

### CrewAI Configuration

**Location:** `agentuity-agent/backend/src/startupai/crew.py`

```python
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from .tools import EvidenceStoreTool, WebSearchTool, ReportGeneratorTool

@CrewBase
class StartupAICrew:
    """StartupAI strategic analysis crew"""
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"
    
    def __init__(self):
        self.evidence_tool = EvidenceStoreTool()
        self.search_tool = WebSearchTool()
        self.report_tool = ReportGeneratorTool()
    
    @agent
    def research_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["customer_researcher"],
            tools=[self.search_tool, self.evidence_tool],
            verbose=True
        )
    
    @agent
    def analysis_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["competitive_analyst"],
            tools=[self.search_tool, self.evidence_tool],
            verbose=True
        )
    
    @agent
    def synthesis_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["synthesis_strategist"],
            tools=[self.evidence_tool, self.report_tool],
            verbose=True
        )
    
    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=[
                self.research_agent(),
                self.analysis_agent(),
                self.synthesis_agent()
            ],
            tasks=[
                self.customer_research_task(),
                self.competitive_analysis_task(),
                self.synthesis_task()
            ],
            process=Process.sequential,
            verbose=True
        )
```

## API Integration

### Frontend to Agentuity

**Next.js API Route:** `frontend/src/app/api/analyze/route.ts`

```typescript
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { projectData, userId } = await request.json();
  
  // Get Agentuity agent URL (will be set after deployment)
  const AGENTUITY_AGENT_URL = process.env.AGENTUITY_AGENT_URL || 
    'https://api.agentuity.com/agent/agent_8dafe1bc5964fff0a81bb29b5b672f8b';
  
  // Call Agentuity agent endpoint
  const response = await fetch(AGENTUITY_AGENT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AGENTUITY_SDK_KEY}`
    },
    body: JSON.stringify({
      action: 'analyze',
      user_id: userId,
      project_id: projectData.id,
      entrepreneur_brief: projectData.brief,
      session_id: projectData.session_id
    })
  });
  
  if (!response.ok) {
    console.error('Agentuity error:', await response.text());
    return NextResponse.json(
      { error: 'AI analysis failed' },
      { status: 500 }
    );
  }
  
  const result = await response.json();
  
  // Results are stored by CrewAI directly in Supabase
  // Just return the analysis to the frontend
  return NextResponse.json(result);
}
```

### Onboarding Integration

**API Endpoints:**
- `POST /api/onboarding/start` → Agentuity `onboarding_start` action
- `POST /api/onboarding/message` → Agentuity `onboarding_message` action  
- `POST /api/onboarding/complete` → Agentuity `analyze` action

## Deployment Plan

### Phase 1: CrewAI Integration (4-6 hours)
1. ✅ Create Agentuity project structure
2. ✅ Implement Agentuity agent wrapper for CrewAI
3. 🔄 Copy existing CrewAI implementation:
   - Move `backend/config/agents.yaml` and `tasks.yaml`
   - Copy `backend/src/startupai/crew.py` and tools
   - Maintain existing 6-agent workflow
4. 🔄 Configure environment variables in Agentuity
5. 🔄 Test CrewAI execution on Agentuity platform

### Phase 2: Deployment (2-3 hours)
1. 🔄 Configure environment variables in Agentuity
2. 🔄 Deploy agent with `agentuity deploy`
3. 🔄 Test agent endpoints
4. 🔄 Set up monitoring and logging

### Phase 3: Frontend Integration (3-4 hours)
1. 🔄 Update API routes to call Agentuity
2. 🔄 Remove mock AI responses
3. 🔄 Add proper error handling
4. 🔄 Implement retry logic
5. 🔄 Test end-to-end flow

### Phase 4: Testing & Polish (2-3 hours)
1. 🔄 Load testing with multiple concurrent users
2. 🔄 Error scenario testing
3. 🔄 Performance optimization
4. 🔄 Documentation updates

## Environment Configuration

### Development
```bash
# .env.development
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Production (Agentuity Cloud)
```bash
# Set via Agentuity CLI (run from agentuity-agent directory)
cd /home/chris/app.startupai.site/agentuity-agent

# Set OpenAI key for CrewAI
agentuity env set OPENAI_API_KEY "sk-proj-..." --secret

# Set Supabase credentials
agentuity env set SUPABASE_URL "https://eqxropalhxjeyvfcoyxg.supabase.co"
agentuity env set SUPABASE_SERVICE_ROLE_KEY "eyJhbG..." --secret

# Set Agentuity keys
agentuity env set AGENTUITY_SDK_KEY "sk_live_4b27d62bd5e534ebc5e59c5520f80242" --secret
agentuity env set AGENTUITY_PROJECT_KEY "sk_live_1b884b63e2ff03e0c8174aa769a89482" --secret
```

## Advantages of CrewAI on Agentuity

1. **Keep Existing CrewAI Implementation**
   - No need to rewrite agent logic
   - Maintain 6-agent orchestration
   - Preserve all tools and workflows
   - Minimal code changes required

2. **Cloud-Native Deployment**
   - CrewAI runs on serverless infrastructure
   - Automatic scaling (including scale-to-zero)
   - Built-in monitoring and logging
   - No infrastructure management

3. **Netlify Compatibility**
   - Solves Python function limitations
   - Deploys independently of Netlify
   - Accessed via HTTPS API calls
   - Maintains existing architecture

4. **Enhanced Capabilities**
   - Agentuity's built-in storage for caching
   - Better error handling and retry logic
   - Production-ready logging and monitoring
   - Simple deployment: `agentuity deploy`

5. **Cost Efficiency**
   - Pay only for actual CrewAI usage
   - No idle server costs
   - Automatic failover and redundancy
   - Scale-to-zero when not in use

## Security Considerations

1. **API Authentication**
   - Bearer token authentication for agent endpoints
   - Rotate API keys regularly
   - Use environment variables for secrets

2. **Data Protection**
   - All data encrypted in transit (HTTPS)
   - Agentuity handles encryption at rest
   - Service role keys never exposed to frontend

3. **Rate Limiting**
   - Implement rate limiting in Next.js API routes
   - Use Agentuity's built-in quotas
   - Monitor usage patterns

## Monitoring & Observability

1. **Agentuity Console**
   - Real-time agent metrics
   - Request/response logs
   - Error tracking

2. **Custom Logging**
   ```python
   context.logger.info("Processing analysis for project: %s", project_id)
   context.logger.error("OpenAI API error: %s", error)
   ```

3. **Performance Metrics**
   - Response time tracking
   - Token usage monitoring
   - Storage utilization

## Testing Strategy

1. **Local Testing**
   ```bash
   # Run agent locally
   cd /home/chris/app.startupai.site/agentuity-agent
   agentuity dev
   
   # Test with curl (use the agent ID from agentuity.yaml)
   curl -X POST http://localhost:3500/agent_8dafe1bc5964fff0a81bb29b5b672f8b \
     -H "Content-Type: application/json" \
     -d '{"action": "analyze", "user_id": "test-user", "project_id": "test-project", "entrepreneur_brief": "Test business idea"}'
   ```

2. **Integration Testing**
   - Test all API endpoints
   - Verify Supabase integration
   - Check error handling

3. **Load Testing**
   - Simulate concurrent users
   - Monitor scaling behavior
   - Verify performance under load

## Success Criteria

1. ✅ Agent deploys successfully to Agentuity cloud
2. ✅ All API endpoints return real AI-generated content
3. ✅ Onboarding conversation works end-to-end
4. ✅ Strategic analysis generates meaningful reports
5. ✅ Performance meets requirements (<3s response time)
6. ✅ Error handling gracefully manages failures
7. ✅ Monitoring shows healthy metrics

## References

- [Agentuity Documentation](https://agentuity.dev)
- [Agentuity Python SDK](https://agentuity.dev/SDKs/python)
- [Previous CrewAI Implementation](crewai-integration.md)
- [Two-Site Implementation Plan](../overview/two-site-implementation-plan.md)

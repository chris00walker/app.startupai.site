# Prompt for Implementing CrewAI on Agentuity Integration

## Context
You are implementing the deployment of existing CrewAI agents on the Agentuity cloud platform for the StartupAI project. The CrewAI code already exists and needs to be wrapped in Agentuity handlers for cloud deployment. This solves the Netlify Python function limitations.

## Key Information
- **Agentuity Project ID:** `proj_cc4a88c94cad106489567765ca25a4f4`
- **Agentuity Agent ID:** `agent_8dafe1bc5964fff0a81bb29b5b672f8b`
- **Supabase Project ID:** `eqxropalhxjeyvfcoyxg`
- **Working Directory:** `/home/chris/app.startupai.site/agentuity-agent`

## Implementation Tasks

### Phase 1: Setup and Configuration (1-2 hours)

1. **Verify Agentuity CLI access:**
```bash
agentuity --version  # Should be 0.0.179 or higher
agentuity auth whoami  # Verify authentication as Chris Walker
agentuity project list  # Confirm startupAI project exists
```

2. **Set environment variables using Agentuity CLI:**
```bash
cd /home/chris/app.startupai.site/agentuity-agent

# Set all required environment variables
agentuity env set OPENAI_API_KEY "$(grep OPENAI_API_KEY ~/.secrets/startupai | cut -d'=' -f2)" --secret
agentuity env set SUPABASE_URL "https://eqxropalhxjeyvfcoyxg.supabase.co"
agentuity env set SUPABASE_SERVICE_ROLE_KEY "$(grep SUPABASE_SERVICE_ROLE_KEY ~/.secrets/startupai | cut -d'=' -f2)" --secret
agentuity env set AGENTUITY_SDK_KEY "sk_live_4b27d62bd5e534ebc5e59c5520f80242" --secret
agentuity env set AGENTUITY_PROJECT_KEY "sk_live_1b884b63e2ff03e0c8174aa769a89482" --secret

# Verify environment variables are set
agentuity env list
```

### Phase 2: Migrate CrewAI Code (2-3 hours)

1. **Copy CrewAI implementation to Agentuity structure:**
```bash
# Create backend directory structure in Agentuity agent
cd /home/chris/app.startupai.site/agentuity-agent
mkdir -p backend/src/startupai backend/config

# Copy CrewAI files
cp /home/chris/app.startupai.site/backend/config/agents.yaml backend/config/
cp /home/chris/app.startupai.site/backend/config/tasks.yaml backend/config/
cp /home/chris/app.startupai.site/backend/src/startupai/*.py backend/src/startupai/

# Install CrewAI dependencies
echo "crewai==0.201.1" >> requirements.txt
echo "langchain==0.1.0" >> requirements.txt
echo "supabase==2.0.0" >> requirements.txt
echo "openai==1.6.0" >> requirements.txt
```

2. **Create the Agentuity agent wrapper:**

Edit `/home/chris/app.startupai.site/agentuity-agent/agentuity_agents/Onboarding/agent.py`:

```python
from agentuity import AgentRequest, AgentResponse, AgentContext
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.src.startupai.crew import StartupAICrew
from backend.src.startupai.tools import EvidenceStoreTool, WebSearchTool, ReportGeneratorTool
import json

async def run(
    request: AgentRequest,
    response: AgentResponse,
    context: AgentContext
) -> AgentResponse:
    """
    Main agent handler wrapping CrewAI for onboarding and strategic analysis
    """
    # Set environment variables from Agentuity context
    os.environ["OPENAI_API_KEY"] = context.env.get("OPENAI_API_KEY")
    os.environ["SUPABASE_URL"] = context.env.get("SUPABASE_URL")
    os.environ["SUPABASE_SERVICE_ROLE_KEY"] = context.env.get("SUPABASE_SERVICE_ROLE_KEY")
    
    # Log the request
    context.logger.info("Received request: %s", request.get("action", "unknown"))
    
    # Extract request data
    action = request.get("action", "analyze")
    user_id = request.get("user_id")
    project_id = request.get("project_id")
    entrepreneur_brief = request.get("entrepreneur_brief", "")
    session_id = request.get("session_id")
    
    try:
        # Initialize CrewAI
        crew = StartupAICrew()
        
        # Route to appropriate CrewAI workflow
        if action == "analyze":
            context.logger.info("Running CrewAI analysis for project: %s", project_id)
            
            # Run the full CrewAI pipeline
            result = crew.kickoff(inputs={
                "entrepreneur_brief": entrepreneur_brief,
                "project_id": project_id,
                "user_id": user_id,
                "session_id": session_id
            })
            
            context.logger.info("CrewAI analysis completed successfully")
            
            return response.json({
                "success": True,
                "analysis": result.raw if hasattr(result, 'raw') else str(result),
                "summary": result.summary if hasattr(result, 'summary') else None,
                "project_id": project_id
            })
        else:
            context.logger.warn("Unknown action requested: %s", action)
            return response.json({"error": f"Unknown action: {action}"}, metadata={"status": 400})
            
    except Exception as e:
        context.logger.error("Error in CrewAI execution: %s", str(e))
        return response.json({
            "success": False,
            "error": str(e)
        }, metadata={"status": 500})
```

### Phase 3: Supabase Integration (1-2 hours)

1. **Use Supabase MCP server to verify database:**
```bash
# In your Cascade session, use these MCP commands:
mcp3_get_project(id="eqxropalhxjeyvfcoyxg")  # Verify project is active
mcp3_list_tables(project_id="eqxropalhxjeyvfcoyxg", schemas=["public"])  # Verify tables exist
```

2. **Create vector search function using Supabase MCP:**
```sql
-- Use mcp3_apply_migration to create the function
mcp3_apply_migration(
  project_id="eqxropalhxjeyvfcoyxg",
  name="add_vector_search_function",
  query="""
    CREATE OR REPLACE FUNCTION match_evidence (
      query_embedding vector(1536),
      match_threshold float,
      match_count int,
      project_id uuid
    )
    RETURNS TABLE (
      id uuid,
      content text,
      similarity float
    )
    LANGUAGE sql STABLE
    AS $$
      SELECT
        evidence.id,
        evidence.content,
        1 - (evidence.embedding <=> query_embedding) as similarity
      FROM evidence
      WHERE evidence.project_id = project_id
        AND 1 - (evidence.embedding <=> query_embedding) > match_threshold
      ORDER BY (evidence.embedding <=> query_embedding) ASC
      LIMIT match_count;
    $$;
  """
)
```

### Phase 4: Local Testing (1-2 hours)

1. **Start Agentuity development server:**
```bash
cd /home/chris/app.startupai.site/agentuity-agent
agentuity dev

# This will output something like:
# Agent running at http://localhost:3500
# Agent ID: agent_8dafe1bc5964fff0a81bb29b5b672f8b
```

2. **Test with curl:**
```bash
# Test the agent locally
curl -X POST http://localhost:3500/agent_8dafe1bc5964fff0a81bb29b5b672f8b \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "user_id": "test-user-123",
    "project_id": "test-project-456",
    "entrepreneur_brief": "I want to build an AI-powered task management app for remote teams",
    "session_id": "test-session-789"
  }'

# Check the logs
agentuity logs --tail 50
```

3. **Test Supabase integration:**
```bash
# Use Supabase MCP to verify data was written
mcp3_execute_sql(
  project_id="eqxropalhxjeyvfcoyxg",
  query="SELECT * FROM reports WHERE project_id = 'test-project-456' ORDER BY created_at DESC LIMIT 1"
)
```

### Phase 5: Deploy to Agentuity Cloud (1 hour)

1. **Deploy the agent:**
```bash
cd /home/chris/app.startupai.site/agentuity-agent
agentuity deploy

# This will output:
# Deploying agent...
# Agent deployed successfully!
# Agent URL: https://api.agentuity.com/agent/agent_8dafe1bc5964fff0a81bb29b5b672f8b
```

2. **Get deployment status:**
```bash
agentuity agent list
agentuity logs --production --tail 100
```

3. **Test production endpoint:**
```bash
# Test the deployed agent
curl -X POST https://api.agentuity.com/agent/agent_8dafe1bc5964fff0a81bb29b5b672f8b \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_live_4b27d62bd5e534ebc5e59c5520f80242" \
  -d '{
    "action": "analyze",
    "user_id": "prod-test-user",
    "project_id": "prod-test-project",
    "entrepreneur_brief": "Testing production deployment"
  }'
```

### Phase 6: Frontend Integration (2-3 hours)

1. **Update Next.js API routes:**

Edit `/home/chris/app.startupai.site/frontend/src/app/api/analyze/route.ts`:

```typescript
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const AGENTUITY_AGENT_URL = 'https://api.agentuity.com/agent/agent_8dafe1bc5964fff0a81bb29b5b672f8b';

export async function POST(request: Request) {
  const { projectData, userId } = await request.json();
  
  try {
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
      throw new Error(`Agentuity error: ${response.status}`);
    }
    
    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('AI analysis failed:', error);
    return NextResponse.json(
      { error: 'AI analysis failed' },
      { status: 500 }
    );
  }
}
```

2. **Add environment variable to Netlify:**
```bash
# Use Netlify CLI or dashboard to add:
AGENTUITY_SDK_KEY=sk_live_4b27d62bd5e534ebc5e59c5520f80242
```

### Phase 7: End-to-End Testing (1-2 hours)

1. **Test complete flow:**
```bash
# Start frontend locally
cd /home/chris/app.startupai.site/frontend
pnpm dev

# In another terminal, monitor Agentuity logs
agentuity logs --production --follow

# In browser, go through onboarding flow and trigger AI analysis
# Watch logs to ensure CrewAI is executing properly
```

2. **Verify database updates:**
```bash
# Use Supabase MCP to check results
mcp3_execute_sql(
  project_id="eqxropalhxjeyvfcoyxg",
  query="SELECT id, project_id, report_type, created_at FROM reports ORDER BY created_at DESC LIMIT 5"
)
```

3. **Performance testing:**
```bash
# Run multiple concurrent requests
for i in {1..5}; do
  curl -X POST https://api.agentuity.com/agent/agent_8dafe1bc5964fff0a81bb29b5b672f8b \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer sk_live_4b27d62bd5e534ebc5e59c5520f80242" \
    -d "{\"action\": \"analyze\", \"user_id\": \"perf-test-$i\", \"project_id\": \"perf-project-$i\", \"entrepreneur_brief\": \"Performance test $i\"}" &
done

# Check scaling behavior
agentuity logs --production --tail 100
```

## Success Criteria

✅ **Local Testing:**
- [ ] Agentuity dev server runs without errors
- [ ] CrewAI executes successfully when called
- [ ] Data is written to Supabase tables
- [ ] Vector search function works

✅ **Production Deployment:**
- [ ] Agent deploys successfully to Agentuity cloud
- [ ] Production endpoint responds to requests
- [ ] CrewAI analysis completes within 30 seconds
- [ ] Results are stored in Supabase

✅ **Integration:**
- [ ] Frontend API routes call Agentuity successfully
- [ ] Authentication works with Bearer token
- [ ] Error handling works properly
- [ ] Real AI analysis replaces mock data

## Troubleshooting Commands

```bash
# Check agent status
agentuity agent list
agentuity agent describe agent_8dafe1bc5964fff0a81bb29b5b672f8b

# View logs
agentuity logs --tail 100
agentuity logs --production --follow

# Check environment variables
agentuity env list

# Rollback if needed
agentuity rollback

# Debug locally
agentuity dev --verbose

# Test Supabase connection
mcp3_execute_sql(
  project_id="eqxropalhxjeyvfcoyxg",
  query="SELECT COUNT(*) FROM reports"
)
```

## Important Notes

1. **DO NOT** modify the existing CrewAI code - just wrap it in Agentuity handlers
2. **USE** the Agentuity CLI extensively for deployment and monitoring
3. **USE** Supabase MCP server to verify database operations
4. **TEST** locally with `agentuity dev` before deploying
5. **MONITOR** logs during testing to catch any issues early
6. **ENSURE** all environment variables are set as secrets

## Expected Timeline

- Total time: 8-12 hours
- Can be completed in 1-2 days
- Most time spent on testing and debugging

Good luck with the implementation!

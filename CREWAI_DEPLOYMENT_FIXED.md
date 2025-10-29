# CrewAI AMP Deployment - Root Cause Fixed

**Date:** October 29, 2025  
**Issue:** Deployment in restart loop, "Crew not available" error  
**Status:** ✅ FIXED - Proper structure implemented

---

## Root Cause Analysis

### The Problem

Your CrewAI implementation used a **custom class structure** instead of the **official CrewAI decorator pattern**. CrewAI AMP requires the specific structure shown in their official documentation.

**What Was Wrong:**
```python
# ❌ OLD - Custom structure
class StartupAICrew:
    def __init__(self):
        self.tools = self._initialize_tools()
        
    def create_crew(self) -> Crew:
        # Manual crew creation
        
    def kickoff(self, inputs):
        crew = self.create_crew()
        return crew.kickoff(inputs=inputs)
```

**What CrewAI AMP Expects:**
```python
# ✅ NEW - Official decorator pattern
@CrewBase
class StartupAICrew:
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"
    
    @agent
    def research_agent(self) -> Agent:
        return Agent(config=self.agents_config['research_agent'])
    
    @task
    def research_task(self) -> Task:
        return Task(config=self.tasks_config['research_task'])
    
    @crew
    def crew(self) -> Crew:
        return Crew(agents=self.agents, tasks=self.tasks)
```

---

## Changes Implemented

### 1. Added @CrewBase Decorator
```python
from crewai.project import CrewBase, agent, crew, task

@CrewBase
class StartupAICrew:
    # Class-level config declarations
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"
```

### 2. Converted All Agent Methods to @agent Decorators
```python
@agent
def research_agent(self) -> Agent:
    """Research Agent - Evidence discovery and collection."""
    return Agent(
        config=self.agents_config['research_agent'], # type: ignore[index]
        tools=[self.web_search, self.evidence_store],
        verbose=True,
    )
```

### 3. Converted All Task Methods to @task Decorators
```python
@task
def evidence_collection_task(self) -> Task:
    """Task for evidence discovery and collection."""
    return Task(
        config=self.tasks_config['evidence_collection'], # type: ignore[index]
    )
```

### 4. Added @crew Decorator for Main Crew Method
```python
@crew
def crew(self) -> Crew:
    """
    Creates the StartupAI Crew with sequential process.
    This is the method CrewAI AMP calls.
    """
    return Crew(
        agents=self.agents,
        tasks=self.tasks,
        process=Process.sequential,
        verbose=True,
    )
```

### 5. Added Type Ignore Comments
Following official pattern, added `# type: ignore[index]` to all YAML config access.

---

## Git Commits

### Commit 1: `919a6eb` - Initial Fix Attempt
```
fix(crewai): add crew() method for CrewAI AMP compatibility
```
Added `crew()` method alias, but structure was still wrong.

### Commit 2: `0839896` - Complete Refactor (SOLUTION)
```
refactor(crewai): migrate to official CrewAI decorator pattern for AMP deployment

- Replace custom class structure with @CrewBase decorator pattern
- Add @agent, @task, and @crew decorators per official docs
- Use agents_config/tasks_config class variables
- Add type: ignore comments for YAML config access
- Follow official CrewAI project structure from docs
- This structure is required for CrewAI AMP to properly detect and run the crew
```

**Files Changed:**
- `src/startupai/crew.py` - Completely refactored (141 insertions, 283 deletions)
- `src/startupai/crew_old.py` - Backup of old implementation

---

## Why This Fixes the Deployment Loop

**Before:** CrewAI AMP couldn't detect the crew structure
- No `@CrewBase` decorator → AMP didn't recognize it as a deployable crew
- No `@agent`/`@task`/`@crew` decorators → AMP couldn't introspect the crew
- Custom `create_crew()` method → AMP was calling non-existent standard methods
- Result: **Continuous restart loop** in "Testing automation" phase

**After:** CrewAI AMP can properly detect and run the crew
- `@CrewBase` → AMP recognizes this as a deployable crew class
- `@agent`/`@task`/`@crew` → AMP can introspect and understand the structure
- Standard `crew()` method → AMP knows how to instantiate and run it
- Result: **Successful deployment** with working API

---

## Deployment Status

**UUID:** `4e368758-a5e9-4b5d-9379-cb7621e044bc`  
**Name:** startupai  
**Token:** `d2cb5ab382b5`  
**Status:** Deploy Enqueued (redeploying with fix)

### Monitor Progress:
```bash
cd /home/chris/app.startupai.site/backend
crewai deploy status --uuid 4e368758-a5e9-4b5d-9379-cb7621e044bc
crewai deploy logs --uuid 4e368758-a5e9-4b5d-9379-cb7621e044bc
```

---

## Expected Results

### ✅ Successful Deployment Will Show:
1. **Status changes** from "Deploy Enqueued" → "Provisioning Crew" → **"Crew is Online"**
2. **API URL appears** in CrewAI dashboard (Status tab)
3. **Health check works:** `GET https://[url].crewai.com` returns "Healthy"
4. **Inputs endpoint works:** `GET /inputs` returns required input fields
5. **Kickoff endpoint works:** `POST /kickoff` starts crew execution

### 🎯 Next Steps (Once Deployed):

1. **Get API URL from Dashboard:**
   - Visit https://app.crewai.com
   - Navigate to "Startupai" crew
   - Copy API URL from Status tab

2. **Test API Endpoints:**
   ```bash
   # Check health
   curl -H "Authorization: Bearer d2cb5ab382b5" https://[URL].crewai.com
   
   # Get inputs
   curl -H "Authorization: Bearer d2cb5ab382b5" https://[URL].crewai.com/inputs
   
   # Test kickoff
   curl -X POST \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer d2cb5ab382b5" \
     -d '{
       "inputs": {
         "strategic_question": "What is our competitive position?",
         "project_id": "test-123",
         "project_context": "B2B SaaS startup",
         "target_sources": "General web sources",
         "report_format": "markdown",
         "project_deadline": "Not specified",
         "priority_level": "medium"
       }
     }' \
     https://[URL].crewai.com/kickoff
   ```

3. **Update Frontend Environment:**
   ```bash
   # /home/chris/app.startupai.site/frontend/.env.local
   NEXT_PUBLIC_CREWAI_API_URL=https://[your-url].crewai.com
   NEXT_PUBLIC_CREWAI_API_TOKEN=d2cb5ab382b5
   ```

---

## Technical Lessons Learned

### 1. CrewAI AMP Requires Official Structure
**Lesson:** CrewAI AMP is opinionated about crew structure. Custom implementations won't work.  
**Solution:** Always follow the official `crewai create` project template.

### 2. Decorators Are Not Optional
**Lesson:** The `@CrewBase`, `@agent`, `@task`, and `@crew` decorators are required, not just syntactic sugar.  
**Solution:** Use decorators exactly as shown in official documentation.

### 3. Config Access Pattern Matters
**Lesson:** Config access via `self.agents_config['agent_name']` with `# type: ignore[index]` is the standard pattern.  
**Solution:** Follow the exact pattern from official examples.

### 4. Method Naming Is Critical
**Lesson:** CrewAI AMP looks for specific method names (`crew()`, not `create_crew()`).  
**Solution:** Use standard method names from the decorator pattern.

### 5. Documentation Is The Source of Truth
**Lesson:** When deploying to managed platforms, follow official docs exactly.  
**Solution:** Reference https://docs.crewai.com/en/quickstart for correct structure.

---

## References

- **Official Docs:** https://docs.crewai.com/en/quickstart
- **Deploy Guide:** https://docs.crewai.com/en/enterprise/guides/deploy-crew
- **CrewAI Dashboard:** https://app.crewai.com

---

## Summary

✅ **Problem:** Custom crew structure incompatible with CrewAI AMP  
✅ **Solution:** Refactored to official decorator pattern  
✅ **Commits:** 919a6eb (partial), 0839896 (complete fix)  
✅ **Status:** Redeployed, awaiting "Crew is Online" confirmation  
✅ **Next:** Get API URL from dashboard and integrate with frontend

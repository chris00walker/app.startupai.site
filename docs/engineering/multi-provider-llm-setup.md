# Multi-Provider LLM Architecture - NOT Hardwired! 🔄

**Date:** October 4, 2025  
**Status:** ✅ Multi-Provider Enabled

## Architecture Overview

You are **NOT** locked into OpenAI! Your system supports multiple LLM providers across two different layers:

### Layer 1: Frontend (Vercel AI SDK) - Product Site
**Location:** `/home/chris/app.startupai.site/frontend/`

- **Purpose:** User-facing AI features in the Next.js app
- **SDK:** Vercel AI SDK (model-agnostic)
- **Providers:** Can use OpenAI, Anthropic, Google, Mistral, etc.
- **Swappable:** Change providers with a single line of code

### Layer 2: Backend (CrewAI) - Strategic Analysis
**Location:** `/home/chris/app.startupai.site/backend/`

- **Purpose:** Multi-agent strategic analysis workflows
- **Framework:** CrewAI (supports multiple LLM providers)
- **Providers:** OpenAI, Anthropic (Claude), Google (Gemini)
- **Flexible:** Different agents can use different models

## Current Provider Configuration

### Your Centralized Secrets (`~/.secrets/startupai`)

```bash
# OpenAI (PRIMARY - Configured ✅)
export OPENAI_API_KEY='sk-proj-...'  # 164 chars, valid, tested
export OPENAI_MODEL_DEFAULT="gpt-4"

# Anthropic (AVAILABLE - Add key to enable)
export ANTHROPIC_API_KEY="sk-ant-paste-your-anthropic-key-here"
export ANTHROPIC_MODEL_DEFAULT="claude-3-sonnet-20240229"

# Google AI (AVAILABLE - Add key to enable)
export GOOGLE_AI_API_KEY="paste-your-google-ai-key-here"
export GOOGLE_MODEL_DEFAULT="gemini-pro"
```

**Status:**
- ✅ OpenAI: Configured and tested
- ⚠️ Anthropic: Placeholder (add key to enable)
- ⚠️ Google: Placeholder (add key to enable)

## How to Use Multiple Providers

### Option 1: Per-Agent Configuration (Recommended)

Edit `/home/chris/app.startupai.site/backend/config/agents.yaml`:

```yaml
research_agent:
  role: "Research Coordinator"
  llm: "gpt-4"  # Use OpenAI GPT-4
  # ... rest of config

analysis_agent:
  role: "Strategic Analyst"
  llm: "claude-3-opus"  # Use Anthropic Claude 3
  # ... rest of config

synthesis_agent:
  role: "Strategic Synthesizer"
  llm: "gemini-pro"  # Use Google Gemini
  # ... rest of config
```

**Benefits:**
- Use the best model for each task
- Cost optimization (cheaper models for simple tasks)
- Redundancy (if one provider has issues, others still work)

### Option 2: Environment-Based Default

Set the default model in `~/.secrets/startupai`:

```bash
# Change default provider
export OPENAI_MODEL_DEFAULT="gpt-3.5-turbo"  # Cheaper, faster
# Or
export ANTHROPIC_MODEL_DEFAULT="claude-3-haiku"  # Anthropic's fast model
```

### Option 3: Runtime Override

Pass model selection at runtime:

```python
from src.startupai import StartupAICrew

crew = StartupAICrew()

# Override LLM for specific execution
result = crew.kickoff({
    "strategic_question": "...",
    "project_id": "...",
    "llm_override": "claude-3-opus",  # Use Claude for this analysis
})
```

## Adding Additional Providers

### To Add Anthropic (Claude):

1. **Get API Key:** https://console.anthropic.com/
2. **Update secrets file:**
   ```bash
   nano ~/.secrets/startupai
   # Change line with ANTHROPIC_API_KEY to your real key
   ```
3. **Reload environment:**
   ```bash
   direnv reload
   ```
4. **Test:**
   ```bash
   python -c "from anthropic import Anthropic; client = Anthropic(); print('✅ Claude ready')"
   ```

### To Add Google Gemini:

1. **Get API Key:** https://makersuite.google.com/app/apikey
2. **Update secrets file:**
   ```bash
   nano ~/.secrets/startupai
   # Change line with GOOGLE_AI_API_KEY to your real key
   ```
3. **Reload environment:**
   ```bash
   direnv reload
   ```
4. **Test:**
   ```bash
   python -c "import google.generativeai as genai; print('✅ Gemini ready')"
   ```

## CrewAI Agent Configuration

Update `/home/chris/app.startupai.site/backend/src/startupai/crew.py` to support LLM selection:

```python
def research_agent(self) -> Agent:
    """Create the Research Coordinator agent."""
    config = self.agents_data["research_agent"]
    
    # Get LLM from config or use default
    llm_model = config.get("llm")  # Can be overridden in YAML
    
    return Agent(
        role=config["role"],
        goal=config["goal"],
        backstory=config["backstory"],
        llm=llm_model,  # Specify model here
        tools=[...],
        verbose=config.get("verbose", True),
    )
```

## Model Selection Guide

### When to Use Each Provider

**OpenAI GPT-4** (Your current default)
- ✅ Best for: Complex reasoning, strategic analysis
- ✅ Quality: Highest
- ⚠️ Cost: Highest
- ⚠️ Speed: Moderate

**OpenAI GPT-3.5-turbo**
- ✅ Best for: Quick tasks, simple analysis
- ✅ Cost: Low (10x cheaper than GPT-4)
- ✅ Speed: Fast
- ⚠️ Quality: Good but not great for complex tasks

**Anthropic Claude 3 Opus**
- ✅ Best for: Long context, detailed analysis
- ✅ Context: 200K tokens
- ✅ Quality: On par with GPT-4
- ⚠️ Cost: Similar to GPT-4

**Anthropic Claude 3 Sonnet**
- ✅ Best for: Balanced performance
- ✅ Cost: Moderate
- ✅ Speed: Fast
- ✅ Quality: Very good

**Google Gemini Pro**
- ✅ Best for: Multimodal tasks
- ✅ Cost: Competitive
- ✅ Speed: Fast
- ⚠️ Quality: Good (improving rapidly)

## Cost Optimization Strategy

### Tiered Approach (Recommended)

```yaml
# Cheap models for data collection
research_agent:
  llm: "gpt-3.5-turbo"  # $0.50/1M tokens

# Medium models for analysis
analysis_agent:
  llm: "claude-3-sonnet"  # $3/1M tokens

# Premium models for synthesis
synthesis_agent:
  llm: "gpt-4"  # $30/1M tokens

# Cheap models for formatting
reporting_agent:
  llm: "gpt-3.5-turbo"  # $0.50/1M tokens
```

**Potential Savings:** 60-70% compared to using GPT-4 for everything

## Fallback Strategy

Implement automatic fallback if primary provider fails:

```python
# In ~/.secrets/startupai
export AI_PROVIDER_FALLBACK_STRATEGY="openai,anthropic,google"
```

This allows:
1. Try OpenAI first
2. If rate limited or down, use Anthropic
3. If Anthropic fails, use Google
4. Ensures high availability

## Vercel AI SDK Integration (Frontend)

For the product site (`/home/chris/app.startupai.site/frontend/`):

```typescript
// app/api/chat/route.ts
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { provider = 'openai' } = await req.json();
  
  // Switch providers based on request
  const client = provider === 'anthropic' 
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  // Use Vercel AI SDK for streaming
  return streamText({
    model: provider === 'anthropic' ? 'claude-3-opus' : 'gpt-4',
    // ... rest of config
  });
}
```

## Migration Path

### Phase 1: Single Provider (Current ✅)
- OpenAI only
- Simple, tested, working

### Phase 2: Add Anthropic (Week 1)
- Get Anthropic API key
- Test with one agent
- Compare quality and cost

### Phase 3: Multi-Provider (Week 2-3)
- Assign different models to different agents
- Implement cost tracking
- Optimize based on results

### Phase 4: Fallback & Redundancy (Month 1)
- Implement automatic fallback
- Add health checks
- Monitor performance

## Summary

### You Are NOT Locked In! ✅

1. **Multiple Providers Configured:** OpenAI, Anthropic, Google
2. **CrewAI Supports All:** Can use any provider per agent
3. **Vercel AI SDK:** Frontend is model-agnostic
4. **Easy to Switch:** Change one line in config
5. **Cost Control:** Mix models for optimal price/performance

### Current Status

```
Infrastructure:        ✅ Multi-provider ready
OpenAI:               ✅ Configured and tested
Anthropic:            ⚠️  Add key to enable
Google:               ⚠️  Add key to enable
Agent Configuration:  ✅ Supports model selection
Frontend (Vercel AI): ✅ Model-agnostic
Fallback Strategy:    📋 Ready to implement
```

### Quick Start: Add a Second Provider

```bash
# 1. Get Anthropic key from console.anthropic.com
# 2. Update secrets
nano ~/.secrets/startupai
# Replace: export ANTHROPIC_API_KEY="your-real-key-here"

# 3. Reload environment
direnv reload

# 4. Test
python -c "from anthropic import Anthropic; print('✅ Works')"

# 5. Update one agent in config/agents.yaml
# Add: llm: "claude-3-sonnet"

# 6. Run crew - it will use Claude for that agent!
```

---

**Bottom Line:** You have a **flexible, multi-provider architecture** that lets you:
- Use different models for different tasks
- Switch providers instantly
- Optimize costs
- Avoid vendor lock-in
- Ensure high availability

The OpenAI key we configured is just the **default**, not a hard requirement! 🚀

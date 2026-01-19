---
purpose: "Multi-environment setup guide (local, staging, production)"
status: "active"
last_reviewed: "2026-01-18"
---

# Multi-Environment Setup Guide

**StartupAI Product Platform** - Complete environment management across Local, Staging, and Production

---

## 🎯 Overview

This repository supports **three distinct environments** with automated configuration:

| Environment | Purpose | Port | URLs | Config File |
|------------|---------|------|------|-------------|
| **Local** | Fast development iteration | 3000 | localhost:3000 | `frontend/.env.local` |
| **Staging** | Pre-production testing | 8889 | localhost:8889 | `frontend/.env.staging` |
| **Production** | Live deployment | — | app-startupai-site.netlify.app | Netlify Dashboard |

---

## 🚀 Quick Start Commands

### Local Development (Fastest)
```bash
# Navigate to frontend workspace
cd frontend

# Standard Next.js development
pnpm dev

# Or explicitly specify local mode
pnpm dev:local

# Access at: http://localhost:3000
```

**Use for:** Fast iteration, component development, debugging, database integration testing

---

### Staging (Production-Like Testing)
```bash
# From frontend/ directory
cd frontend
pnpm dev:staging

# Or from root directory
cd app.startupai.site
netlify dev

# Access at: http://localhost:8889
```

**Use for:** Testing production builds, Modal integration, environment variable validation

---

### Production (Automatic)
```bash
# Commit and push to GitHub
git add .
git commit -m "feat: your changes"
git push origin main

# Auto-deploys to: https://app-startupai-site.netlify.app
```

**Use for:** Live deployment, end-user access

---

## 📁 Environment File Structure

```
app.startupai.site/
├── .env.README                      # Important: explains workspace structure
├── .env.deprecated-mongodb-backup   # Old MongoDB config (historical)
├── netlify.toml                     # Context-specific Netlify configuration
└── frontend/
    ├── .env.example                 # Template with all required variables
    ├── .env.local                   # Local development (gitignored)
    ├── .env.staging                 # Staging environment (gitignored)
    ├── .env.test.local              # Test environment (gitignored)
    └── .envrc                       # direnv integration
```

**⚠️ IMPORTANT:** All environment files must be in `frontend/` directory, not root!

---

## 🔧 Environment Configuration Details

### Local Development (frontend/.env.local)

**Purpose:** Fast development with hot reload and database integration

**Key Settings:**
```bash
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_MARKETING_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Supabase (shared across all environments)
NEXT_PUBLIC_SUPABASE_URL=https://eqxropalhxjeyvfcoyxg.supabase.co
DATABASE_URL=postgresql://postgres.eqxropalhxjeyvfcoyxg:...

# AI Configuration (loaded from direnv)
OPENAI_API_KEY=...
OPENAI_MODEL_DEFAULT=gpt-4.1-nano

# Feature Flags
ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_CLICK_TO_COMPONENT=true
```

**Runs:** `next dev --turbopack` (port 3000)

---

### Staging (frontend/.env.staging)

**Purpose:** Production-like testing with all integrations enabled

**Key Settings:**
```bash
NODE_ENV=staging
NEXT_PUBLIC_SITE_URL=http://localhost:8889
NEXT_PUBLIC_MARKETING_URL=http://localhost:8888
NEXT_PUBLIC_APP_URL=http://localhost:8889

# Feature Flags (All Enabled for Testing)
ENABLE_EXPERIMENTAL_FEATURES=true
DEBUG_MODE=true
DETAILED_ERRORS=true
NEXT_PUBLIC_ONBOARDING_BYPASS=true

# Relaxed Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=120
FREEMIUM_MONTHLY_LIMIT=10
```

**Runs:** `netlify dev` (port 8889, proxies to 3000)

**Features:**
- Tests Modal integration via `/api/crewai/*` routes
- Validates cross-site authentication with marketing site
- Tests database migrations and seeding
- Enables all experimental features
- Relaxed rate limits for QA

---

### Production (Netlify Dashboard)

**Purpose:** Live deployment with strict security and rate limiting

**Key Settings:**
```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://app-startupai-site.netlify.app
NEXT_PUBLIC_MARKETING_URL=https://startupai-site.netlify.app
NEXT_PUBLIC_APP_URL=https://app-startupai-site.netlify.app

# Production Rate Limits
RATE_LIMIT_REQUESTS_PER_MINUTE=60
FREEMIUM_MONTHLY_LIMIT=3

# Security (Strict)
ENABLE_EXPERIMENTAL_FEATURES=false
DEBUG_MODE=false
DETAILED_ERRORS=false
NEXT_PUBLIC_ONBOARDING_BYPASS=false
```

**Configured in:** Netlify Dashboard → Site settings → Environment variables

**Build:** Automatic on `git push` to `main` branch

---

## 🔐 Secret Management

### Using direnv (Recommended)

The `frontend/.envrc` file loads secrets from a centralized location:

```bash
# frontend/.envrc content
source_env ~/.secrets/startupai
```

**Centralized Secrets File:** `~/.secrets/startupai`
```bash
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export NEXT_PUBLIC_POSTHOG_KEY=phc_...
export NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Setup:**
1. Install direnv: `brew install direnv` (macOS) or `apt install direnv` (Linux)
2. Add to shell: `eval "$(direnv hook bash)"` or `eval "$(direnv hook zsh)"`
3. Create secrets: `~/.secrets/startupai`
4. Navigate to frontend: `cd frontend`
5. Allow direnv: `direnv allow .`

**Benefits:**
- Secrets never committed to git
- Shared across all three StartupAI repos
- Automatic loading when entering directory
- Environment-specific overrides in .env.local/.env.staging

---

## 🧪 Testing Environment Configuration

### Check Current Environment
```bash
cd frontend
pnpm env:check
```

**Output:**
```
Environment: development
Marketing URL: http://localhost:3000
App URL: http://localhost:3001
Site URL: http://localhost:3000
```

### Test Staging Environment with Cross-Site Integration
```bash
# Terminal 1: Start staging marketing site
cd ~/startupai.site
pnpm dev:staging
# Runs on: http://localhost:8888

# Terminal 2: Start staging app platform
cd ~/app.startupai.site/frontend
pnpm dev:staging
# Runs on: http://localhost:8889

# Terminal 3: Monitor logs
cd ~/app.startupai.site
netlify dev --live
```

### Test Database Integration
```bash
cd frontend

# Generate migration
pnpm db:generate

# Apply migration
pnpm db:migrate

# Seed test data
pnpm db:seed
```

### Test Modal Integration
```bash
cd app.startupai.site

# Start Netlify Dev
netlify dev

# In another terminal, trigger Modal kickoff via API route
curl -X POST http://localhost:8889/api/crewai/analyze \
  -H "Content-Type: application/json" \
  -d '{"project_id":"test","entrepreneur_input":"TestCo"}'
```

---

## 🌐 Netlify Dev Features

When running `pnpm dev:staging` or `netlify dev`, you get:

### ✅ Production Simulation
- Exact same environment as production
- Tests Netlify-specific features (Functions, Redirects, Headers)
- Validates API routes and Modal connectivity
- Simulates serverless cold starts for Netlify runtime

### ✅ API Route Testing
- **CrewAI Routes:** `/api/crewai/analyze`, `/api/crewai/webhook`
- **Onboarding Routes:** `/api/onboarding/*`
- **Live Reload:** Auto-restarts on route changes

### ✅ Environment Injection
Netlify automatically provides:
- `CONTEXT` = "dev" | "branch-deploy" | "production"
- `NETLIFY` = "true"
- `NETLIFY_DEV` = "true" (local only)

---

## 🔄 Switching Between Environments

### From IDE (VS Code, Cursor, etc.)

**Terminal Commands:**
```bash
# Navigate to frontend workspace
cd frontend

# Local development
pnpm dev

# Staging testing
pnpm dev:staging

# Check environment
pnpm env:check
```

### From CLI

**Root Directory:**
```bash
cd ~/app.startupai.site
netlify dev
# Serves on port 8889
```

**Frontend Directory:**
```bash
cd ~/app.startupai.site/frontend
pnpm dev
# Serves on port 3000
```

### From Cloud (GitHub Actions)

**Automatic based on branch:**
- `main` branch → Production build
- Other branches → Preview builds (staging context)

---

## 🎯 Environment Selection Guide

### Use **Local** when:
- ✅ Developing React components
- ✅ Quick UI iterations
- ✅ Testing Supabase queries
- ✅ Debugging with hot reload
- ✅ Database schema changes

### Use **Staging** when:
- ✅ Testing CrewAI workflows (Modal via API routes)
- ✅ Validating cross-site authentication
- ✅ Testing environment variable loading
- ✅ Checking Netlify redirects and headers
- ✅ QA before production deployment
- ✅ Testing with experimental features enabled

### Use **Production** when:
- ✅ Deploying to real users
- ✅ Final validation with production data
- ✅ Performance testing at scale
- ✅ Security-hardened configuration

---

## 📦 Required Environment Variables

### Public Variables (Frontend - NEXT_PUBLIC_*)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_MARKETING_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Server-Side Variables (Never exposed to client)
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

### AI Provider Configuration
```bash
OPENAI_MODEL_DEFAULT=gpt-4.1-nano
ANTHROPIC_MODEL_DEFAULT=claude-3-sonnet-20240229
AGENTUITY_AGENT_URL=https://agentuity.ai/api/agent_...
```

**See `frontend/.env.example` for complete list**

---

## 🔍 Troubleshooting

### Environment not loading in frontend?
```bash
cd frontend

# Check direnv status
direnv status

# Reload environment
direnv allow .

# Verify variables loaded
pnpm env:check
```

### Netlify Dev not finding functions?
```bash
# Verify netlify.toml [functions] section exists
cat netlify.toml | grep -A 2 "\[functions\]"

# Should show:
# [functions]
#   directory = "netlify/functions"

# Check functions directory
ls -la netlify/functions/
```

### Database connection failing?
```bash
cd frontend

# Test connection
pnpm db:migrate

# If fails, check DATABASE_URL format:
# postgresql://postgres.PROJECT:PASSWORD@...pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Cross-site auth not working?
```bash
# Ensure both sites running on correct ports:
# Marketing: localhost:8888 (pnpm dev:staging from startupai.site)
# App: localhost:8889 (pnpm dev:staging from app.startupai.site/frontend)

# Check JWT secrets match:
grep JWT_SECRET ~/startupai.site/.env.staging
grep JWT_SECRET ~/app.startupai.site/frontend/.env.staging
# Must be identical!
```

### Onboarding features not accessible?
```bash
# For testing, enable bypass flag in staging:
echo "NEXT_PUBLIC_ONBOARDING_BYPASS=true" >> frontend/.env.staging

# ⚠️ NEVER enable in production!
```

---

## 🏗️ Workspace Architecture

This repo uses a **workspace structure** with frontend as a sub-directory:

```
app.startupai.site/
├── frontend/              # Next.js application (main workspace)
│   ├── src/              # React components, pages, API routes
│   ├── public/           # Static assets
│   ├── package.json      # Frontend dependencies
│   └── .env.local        # ⭐ Environment variables HERE
├── netlify/
│   └── functions/        # Legacy Python functions (deprecated)
├── docs/                 # Documentation
├── netlify.toml          # Deployment configuration
└── package.json          # Root workspace config
```

**Commands run from:**
- **Development:** `frontend/` directory
- **Staging:** Root directory (netlify dev)
- **Production:** Automatic from GitHub

---

## 📚 Integration with Other Repos

### Marketing Site (startupai.site)
- **Local:** localhost:3000
- **Staging:** localhost:8888
- **Production:** startupai-site.netlify.app
- **Redirects to:** App platform after authentication

### CrewAI Backend (startupai-crew)
- **Deployment:** Modal Serverless (cloud-hosted)
- **API Endpoint:** Modal `/kickoff` (override via `CREW_ANALYZE_URL`)
- **Local Testing:** `modal serve src/modal_app/app.py`

### Environment Variables Must Match
JWT secrets and Supabase keys must be **identical** across:
- `startupai.site/.env.local`
- `app.startupai.site/frontend/.env.local`

---

## ✅ Checklist: Environment Setup Complete

- [ ] `frontend/.env.local` created with local development URLs
- [ ] `frontend/.env.staging` created with staging URLs (8889)
- [ ] `~/.secrets/startupai` contains all API keys
- [ ] `direnv allow .` executed in frontend/ directory
- [ ] `cd frontend && pnpm dev` works on port 3000
- [ ] `cd frontend && pnpm dev:staging` works on port 8889
- [ ] `cd frontend && pnpm env:check` shows correct URLs
- [ ] Production environment variables set in Netlify Dashboard
- [ ] Database migrations applied: `pnpm db:migrate`
- [ ] Test data seeded: `pnpm db:seed`
- [ ] Cross-site auth tested with marketing site
- [ ] Modal integration tested: `curl http://localhost:8889/api/crewai/analyze`

---

**Last Updated:** October 30, 2025  
**Repository:** app.startupai.site  
**Environment Version:** 1.0.0  
**Workspace Structure:** frontend/ (Next.js) + netlify/functions/ (Python)

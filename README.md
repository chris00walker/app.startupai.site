# app.startupai.site

**Product Platform in StartupAI's Two-Site Architecture**

## 🏗️ Architecture Overview

This repository implements the **Product Platform** (`app.startupai.site`) in StartupAI's two-site architecture:

- **🎯 startupai.site** (The Promise) - Convert prospects to customers - ✅ 95% Complete
- **⚡ app.startupai.site** (The Product) - Deliver value and create advocates ← **THIS REPO** - ⚠️ 65-70% Complete

**Latest Updates:** October 6, 2025 - CrewAI backend 15% implemented, trial guardrails deployed, deployment fixed

## 🚀 What This Platform Does

**Evidence-Led Strategy Platform** that helps entrepreneurs validate business ideas through systematic experimentation:

- **Secure Authentication Handoff** - ✅ Working with token-based session (Oct 4, 2025)
- **Project Management** - ✅ UI complete, DB integration working via useProjects hook (Oct 3, 2025)
- **Hypothesis Testing** - ✅ Complete UI with database integration
- **AI-Powered Insights** - ⚠️ CrewAI backend 15% implemented (Oct 4, 2025)
- **Professional Reports** - ⚠️ Display UI ready, generation backend in progress
- **Progress Tracking** - ✅ Gate scoring integrated (Oct 4, 2025)
- **Trial Usage Guardrails** - ✅ Implemented with /api/trial/allow endpoint (Oct 4, 2025)

## 🛠️ Technology Stack

- **Frontend:** Next.js 15.5.3 with TypeScript 5.8.3 (`/frontend/`)
- **Backend:** Netlify Functions (Python) for CrewAI workflows - ⚠️ 15% Implemented (Oct 4, 2025)
- **Database:** Supabase PostgreSQL with pgvector - ✅ 100% Complete (8 migrations deployed)
- **ORM:** Drizzle ORM for type-safe operations - ✅ Complete
- **Storage:** Supabase Storage with RLS policies - ✅ Buckets created (Oct 3, 2025)
- **Vector Search:** pgvector with match_evidence() function - ✅ Complete (Oct 4, 2025)
- **AI:** CrewAI 0.201.1 + Netlify Functions - ⚠️ 15% Implemented
- **Authentication:** JWT token validation - ✅ Working with role-based routing (Oct 4, 2025)
- **Package Manager:** pnpm 9.12.1 (✅ migrated Sept 26, 2025)
- **Deployment:** Netlify (✅ live at https://app-startupai-site.netlify.app)

**Current Status:**
- ✅ Infrastructure: 95% (Supabase, Auth, Deployment, Environment Variables)
- ✅ UI Components: 70% (50+ components, 160KB canvas code, DB integrated)
- ✅ Backend Integration: 70% (Dashboard, projects, evidence all connected to Supabase)
- ⚠️ AI Backend: 15% (CrewAI installed, Netlify functions created, needs completion)


### Development Setup
```bash
nvm use
pnpm install
pnpm dev
```

**Local Access:**
- **Development:** http://localhost:3000
- **Authentication Test:** Redirected from startupai.site (localhost:3001)

**Runtime Requirements:**
- Node.js 22.18.0 (`nvm use` will load the version specified in `.nvmrc`)
- pnpm (install via `corepack enable pnpm`) - ✅ Migrated from npm
- Supabase CLI (available via `pnpm exec supabase`) - ✅ Installed

**Production Access:**
- **Live Production:** https://app-startupai-site.netlify.app
- **Future Custom Domain:** https://app.startupai.site
### Environment Setup
```bash
# 1. Configure environment variables
cp frontend/.env.example frontend/.env.local
# Update Supabase URLs, JWT secrets, OpenAI keys, and database connection

# Required environment variables:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:6543/postgres?workaround=supabase-pooler.vercel
# JWT_SECRET=your-jwt-secret
# OPENAI_API_KEY=your-openai-key

# 2. Start development server
pnpm dev
```

### Testing Cross-Site Integration
```bash
# 1. Start app.startupai.site (product platform)
pnpm dev  # http://localhost:3000

# 2. In another terminal, start startupai.site (marketing site)
pnpm --dir ../startupai.site dev  # http://localhost:3001

# 3. Test authentication handoff
# - Visit http://localhost:3001
# - Complete signup/login
# - Verify redirect to http://localhost:3000 with token
```

## 📁 Repository Structure

```
app.startupai.site/
├── frontend/              # Next.js 14 Product Platform
├── docs/                  # Platform-specific documentation
├── .windsurf/             # Project-specific Windsurf configuration
├── package.json           # Root scripts and metadata
├── pnpm-lock.yaml         # Locked dependencies
└── README.md              # This documentation
```

**Key Directories:**
- **`frontend/`** - This IS the product platform (Next.js 14)
- **`docs/`** - Platform-specific implementation docs with links to shared specs
- **`tests/`** - Cross-site integration and platform testing

## 📊 Current Status

**Overall Progress:** 65-70% Complete  
**Last Updated:** October 6, 2025

**✅ What's Working (Oct 3-6, 2025):**
- ✅ 20 pages deployed (16 Pages Router + 4 App Router)
- ✅ 50+ UI components including 9 canvas tools (160KB code)
- ✅ Complete validation UI with database integration
- ✅ GitHub OAuth working in production with role-based routing
- ✅ Dashboard connected to Supabase via useProjects hook
- ✅ 8 database migrations deployed (including trial guardrails)
- ✅ Type-safe query layer complete with read/write operations
- ✅ 162 tests passing (Jest) + 45 E2E tests (Playwright)
- ✅ Mock data removed from production code paths
- ✅ Storage buckets created with RLS policies
- ✅ Vector search function deployed (match_evidence)
- ✅ Trial usage guardrails with /api/trial/allow endpoint
- ✅ Netlify deployment environment variables configured
- ✅ CrewAI backend 15% implemented (agents, tasks, Netlify functions)

**⚠️ In Progress:**
- ⚠️ CrewAI backend completion (85% remaining - 10-13 hours)
- ⚠️ Frontend integration with CrewAI endpoints
- ⚠️ Real-time progress tracking for AI workflows

**✅ Architecture Decisions:**
- ✅ Router consolidation: KEEP HYBRID (Vercel recommended, documented Oct 4)
- ✅ Database integration: COMPLETE (all components use real data)

**Next Steps (Prioritized):**
1. 🚨 Complete CrewAI backend (Steps 3-10) - 10-13 hours - CRITICAL
2. ⚡ Frontend integration (ProjectCreationWizard) - 4 hours - HIGH
3. ⚡ Real-time progress tracking - 3 hours - HIGH
4. 📋 End-to-end workflow testing - 2 hours - MEDIUM

## 📚 Documentation

### 📖 Master Reference

**→ [Two-Site Implementation Plan](../startupai.site/docs/technical/two-site-implementation-plan.md)**  
The **SINGLE SOURCE OF TRUTH** for all StartupAI development (located in marketing repo).

### 🔧 Engineering Documentation

#### Authentication (10-series)
- [Authentication Setup](docs/engineering/10-authentication/authentication-setup.md)
- [OAuth Configuration Guide](docs/engineering/10-authentication/oauth-setup-guide.md)
- [Role-Based Routing](docs/engineering/10-authentication/ROLE_BASED_ROUTING_SETUP.md) (Oct 5, 2025)

#### Data Layer (30-series)
- [Supabase Setup](docs/engineering/30-data/supabase-setup.md)
- [Drizzle Schema](docs/engineering/30-data/drizzle-schema.md)
- [Database Migrations](docs/engineering/30-data/migrations/README.md)
- [Data Retention & PII](docs/engineering/30-data/retention-and-pii.md)

#### Testing (50-series)
- [Testing Infrastructure](docs/engineering/50-testing/README.md)
- [E2E Testing Guide](frontend/E2E_TESTING_GUIDE.md)
- [TDD Implementation Report](frontend/TDD_IMPLEMENTATION_COMPLETE.md)

#### Deployment
- [Docker Configuration](docs/engineering/deployment/docker.md)
- [Netlify Environment Variables](docs/engineering/deployment/NETLIFY_ENV_VARS.md) (Oct 5, 2025)

### 🎯 Features & Integrations

#### CrewAI Backend
- [CrewAI Implementation Spec](backend/CREW_AI.md) - Complete 6-agent workflow specification
- [CrewAI Status Report](docs/integrations/crewai/CREWAI_STATUS_REPORT.md) (Oct 5, 2025)
- [Netlify Functions Guide](netlify/functions/README.md)

#### Feature Documentation
- [Gate Scoring Integration](docs/features/gate-scoring-integration.md) (Oct 4, 2025)
- [Gate Integration Complete](docs/features/GATE_INTEGRATION_COMPLETE.md)
- [Consultant Gate Enhancements](docs/features/CONSULTANT_GATE_ENHANCEMENTS_COMPLETE.md) (Oct 5, 2025)

### 🔄 Operations

- [Implementation Status](docs/operations/implementation-status.md) - **Weekly progress tracking**
- [Dashboard Integration Priorities](docs/operations/DASHBOARD_INTEGRATION_PRIORITIES.md)
- [Database Seeding Guide](docs/operations/database-seeding.md)
- [Router Consolidation Plan](docs/operations/routing-consolidation-plan.md)

### 🔗 Marketing Site Documentation

For business, product, and design documentation, see:
- **[startupai.site README](../startupai.site/README.md)** - Marketing site overview with full doc index
- **[Product Requirements](../startupai.site/docs/product/PRD.md)** - PRD and specifications
- **[Design System](../startupai.site/docs/design/design-system.md)** - Shared design tokens and components

---

## 🔗 Related Repositories

- **[startupai.site](../startupai.site/)** - Marketing site (95% complete)
- **[Master Implementation Plan](../startupai.site/docs/technical/two-site-implementation-plan.md)** - Single source of truth

---

**Status:** ⚠️ 50-55% Complete | Infrastructure Strong, Backend Missing  
**Focus:** CrewAI implementation and UI/DB integration  
**Timeline to Beta:** 4-10 weeks (depending on CrewAI complexity)

# app.startupai.site

**Product Platform in StartupAI's Two-Site Architecture**

## 🏗️ Architecture Overview

This repository implements the **Product Platform** (`app.startupai.site`) in StartupAI's two-site architecture:

- **🎯 startupai.site** (The Promise) - Convert prospects to customers - ✅ 95% Complete
- **⚡ app.startupai.site** (The Product) - Deliver value and create advocates ← **THIS REPO** - ⚠️ 50-55% Complete

**Latest Audit:** [Codebase Audit (Oct 4, 2025)](../startupai.site/docs/CODEBASE_AUDIT_2025-10-04.md)

## 🚀 What This Platform Does

**Evidence-Led Strategy Platform** that helps entrepreneurs validate business ideas through systematic experimentation:

- **Secure Authentication Handoff** - ✅ Seamlessly receive authenticated users from startupai.site
- **Project Management** - ⚠️ UI complete, DB integration partial
- **Hypothesis Testing** - ⚠️ Complete UI (HypothesisManager 20KB), needs DB integration
- **AI-Powered Insights** - ❌ CrewAI backend not implemented (CRITICAL BLOCKER)
- **Professional Reports** - ⚠️ Display UI ready, generation backend missing
- **Progress Tracking** - ⚠️ Gate UI complete, logic needs implementation

## 🛠️ Technology Stack

- **Frontend:** Next.js 15.5.3 with TypeScript 5.8.3 (`/frontend/`)
- **Backend:** Netlify Functions (Python) for CrewAI workflows - ❌ NOT IMPLEMENTED
- **Database:** Supabase PostgreSQL with pgvector - ✅ Configured
- **ORM:** Drizzle ORM for type-safe operations - ✅ Complete
- **Storage:** Supabase Storage with RLS policies - ❌ Buckets not created
- **Vector Search:** pgvector with OpenAI embeddings (1536 dimensions) - ✅ Ready
- **AI:** CrewAI multi-agent system + Vercel AI SDK - ❌ NOT IMPLEMENTED
- **Authentication:** JWT token validation - ✅ Working (GitHub OAuth)
- **Package Manager:** pnpm 9.12.1 (✅ migrated Sept 26, 2025)
- **Deployment:** Netlify (✅ live at https://app-startupai-site.netlify.app)

**Current Status:**
- ✅ Infrastructure: 80% (Supabase, Auth, Deployment)
- ✅ UI Components: 60-70% (50+ components, 160KB canvas code)
- ⚠️ Backend Integration: 45% (Dashboard connected, others pending)
- ❌ AI Backend: 0% (CRITICAL BLOCKER)


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

**Overall Progress:** 50-55% Complete  
**Last Audit:** October 4, 2025

**What's Working:**
- ✅ 20 pages deployed (16 Pages Router + 4 App Router)
- ✅ 50+ UI components including 9 canvas tools (160KB code)
- ✅ Complete validation UI (Hypothesis, Evidence, Experiments)
- ✅ GitHub OAuth working in production
- ✅ Dashboard connected to Supabase via useProjects hook
- ✅ 7 database migrations deployed
- ✅ Type-safe query layer complete
- ✅ 162 tests passing

**Critical Gaps:**
- 🚨 CrewAI backend not implemented (0% - BLOCKS CORE VALUE)
- ⚠️ Most components still use mock data (needs DB integration)
- ⚠️ Storage buckets not configured (blocks file uploads)
- ⚠️ Routing architecture needs consolidation (App + Pages Router)

**Next Steps (Prioritized):**
1. 🚨 Implement CrewAI backend (15-20 hours) - CRITICAL
2. ⚡ Connect UI to database (10-15 hours) - HIGH
3. ⚡ Configure storage buckets (4 hours) - HIGH
4. 📋 Router consolidation (6 hours) - MEDIUM

## 🔗 Related Repositories

- **[startupai.site](../startupai.site/)** - Marketing site (95% complete)
- **Shared Documentation** - [/home/chris/startupai.site/docs/](/home/chris/startupai.site/docs/)
- **Comprehensive Audit** - [Codebase Audit Oct 4, 2025](../startupai.site/docs/CODEBASE_AUDIT_2025-10-04.md)

---

**Status:** ⚠️ 50-55% Complete | Infrastructure Strong, Backend Missing  
**Focus:** CrewAI implementation and UI/DB integration  
**Timeline to Beta:** 4-10 weeks (depending on CrewAI complexity)

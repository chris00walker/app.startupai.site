# app.startupai.site

**Product Platform in StartupAI's Two-Site Architecture**

## 🏗️ Architecture Overview

This repository implements the **Product Platform** (`app.startupai.site`) in StartupAI's two-site architecture:

- **🎯 startupai.site** (The Promise) - Convert prospects to customers
- **⚡ app.startupai.site** (The Product) - Deliver value and create advocates ← **THIS REPO**

## 🚀 What This Platform Does

**Evidence-Led Strategy Platform** that helps entrepreneurs validate business ideas through systematic experimentation:

- **Secure Authentication Handoff** - Seamlessly receive authenticated users from startupai.site
- **Project Management** - Create and manage business validation projects
- **Hypothesis Testing** - Systematic assumption validation with evidence collection
- **AI-Powered Insights** - CrewAI multi-agent system for business model generation
- **Professional Reports** - Generate business model canvases and validation reports
- **Progress Tracking** - Gate-based progression through validation stages

## 🛠️ Technology Stack

- **Frontend:** Next.js 14 with TypeScript (`/frontend/`)
- **Backend:** Netlify Functions (Python) for CrewAI workflows
- **Database:** Supabase PostgreSQL with pgvector for semantic search
- **ORM:** Drizzle ORM for type-safe database operations
- **Storage:** Supabase Storage with RLS policies and CDN
- **Vector Search:** pgvector with OpenAI embeddings (1536 dimensions)
- **AI:** CrewAI multi-agent system + Vercel AI SDK
- **Authentication:** JWT token validation from startupai.site
- **Package Manager:** pnpm (✅ migrated)
- **Deployment:** Netlify (✅ live at https://app-startupai-site.netlify.app)


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

## 🔗 Related Repositories

- **[startupai.site](../startupai.site/)** - Marketing site with shared documentation
- **Shared Documentation** - [/home/chris/startupai.site/docs/](/home/chris/startupai.site/docs/)

---

**Status:** ✅ Repository cleaned and optimized for two-site architecture  
**Focus:** Product platform implementation with cross-site integration  
**Next Steps:** Implement JWT token validation and user onboarding flows
# GitHub Integration Test

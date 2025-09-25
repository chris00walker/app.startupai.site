# CWC Agentic Platform

**Product Platform in StartupAI's Two-Site Architecture**

## 🏗️ Architecture Overview

This repository implements the **Product Platform** (`cwc-agentic-platform`) in StartupAI's two-site architecture:

- **🎯 startupai.site** (The Promise) - Convert prospects to customers
- **⚡ cwc-agentic-platform** (The Product) - Deliver value and create advocates ← **THIS REPO**

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
- **Database:** Supabase PostgreSQL (shared with startupai.site)
- **AI:** CrewAI multi-agent system + Vercel AI SDK
- **Authentication:** JWT token validation from startupai.site
- **Deployment:** Vercel

## 🚀 Quick Start

### Development Setup
```bash
cd frontend/
npm install
npm run dev
```

**Local Access:**
- **Development:** http://localhost:3000
- **Authentication Test:** Redirected from startupai.site (localhost:3001)

## 📋 Documentation

**All shared documentation lives in the StartupAI repository:**
👉 **[/home/chris/startupai.site/docs/](/home/chris/startupai.site/docs/)**

**Quick Links for Development:**
- **System Architecture:** [High-Level Architecture Spec](../startupai.site/docs/technical/high_level_architectural_spec.md#32-product-platform-cwc-agentic-platform-the-product)
- **Implementation Plan:** [Phases 3-5](../startupai.site/docs/technical/two-site-implementation-plan.md#4-phase-3-product-platform-core-features-cwc-agentic-platform)
- **User Stories:** [Product Platform Stories](../startupai.site/docs/product/user-stories.md)
- **Local Documentation:** [docs/README.md](docs/README.md)

## 🔧 Key Features to Implement

- **JWT Token Validation** - `/api/auth/handoff` endpoint
- **User Onboarding** - Guided project creation flow
- **Evidence Collection** - URL parsing, file upload, manual entry
- **AI Report Generation** - CrewAI-powered business model canvases
- **Cross-Site Analytics** - User behavior tracking and conversion metrics
- **Professional UI**: ShadCN components with modern interface

## 🔗 Cross-Site Integration

This platform receives authenticated users from **startupai.site** via secure JWT token handoff:

1. User completes signup/payment on startupai.site
2. startupai.site generates JWT token with user data
3. User redirected to cwc-agentic-platform with token
4. Platform validates token and creates user session
5. User begins onboarding and project creation

## 🚀 Development Workflow

1. **Reference shared docs** for requirements and architecture
2. **Implement in `/frontend/`** - This is the product platform
3. **Test cross-site integration** with startupai.site
4. **Deploy to Vercel** when ready

---

**Repository Structure:** Clean and focused on product platform implementation  
**Documentation:** Comprehensive cross-references to shared specifications  
**Architecture:** Two-site system optimized for conversion and retention

## 💻 Development

### Prerequisites
- Node.js 18+
- Supabase account (shared with startupai.site)
- OpenAI API key (for CrewAI workflows)

### Environment Setup
```bash
# 1. Navigate to frontend (the product platform)
cd frontend/

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Add Supabase URLs, JWT secrets, OpenAI keys

# 4. Start development server
npm run dev
```

### Testing Cross-Site Integration
```bash
# 1. Start cwc-agentic-platform (this repo)
cd frontend/ && npm run dev  # http://localhost:3000

# 2. Start startupai.site (marketing site)
cd ../startupai.site && npm run dev  # http://localhost:3001

# 3. Test authentication handoff
# - Visit http://localhost:3001
# - Complete signup/login
# - Verify redirect to http://localhost:3000 with token
```

## 📁 Repository Structure

```
cwc-agentic-platform/
├── frontend/              # Next.js 14 Product Platform
├── docs/                  # Platform-specific documentation
├── tests/                 # Integration tests
├── scripts/               # Build and deployment scripts
├── features/              # BDD testing scenarios
└── REPOSITORY_CLEANUP_PLAN.md  # Cleanup documentation
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

# CWC Agentic Platform Engineering Overview
<!-- markdownlint-disable MD013 -->

> **Product Platform** in StartupAI Two-Site Architecture  
> Runtime: Next.js 14 · Database: Supabase PostgreSQL · AI: CrewAI + Vercel AI SDK · Deploy: Vercel

## 🏗️ Platform Context

This repository implements the **Product Platform** (`app.startupai.site`) in StartupAI's two-site architecture:

- **🎯 startupai.site** (Marketing) - Convert prospects to customers
- **⚡ app.startupai.site** (Product) - Deliver value and create advocates ← **THIS REPO**

## 📋 Shared Documentation

**All business requirements, architecture, and user stories are maintained in:**
👉 **[/home/chris/startupai.site/docs/](/home/chris/startupai.site/docs/)**

**Key References for Platform Development:**
- **System Architecture:** [High-Level Architecture Spec](../../startupai.site/docs/technical/high_level_architectural_spec.md#32-product-platform-cwc-agentic-platform-the-product)
- **Implementation Plan:** [Phases 3-5](../../startupai.site/docs/technical/two-site-implementation-plan.md#4-phase-3-product-platform-core-features-cwc-agentic-platform)
- **User Requirements:** [User Stories](../../startupai.site/docs/product/user-stories.md)

## 🛠️ Platform-Specific Implementation

**Core Technologies:**
- **Frontend:** Next.js 14 with TypeScript, Tailwind CSS
- **Backend:** Netlify Functions (Python) for CrewAI workflows
- **Database:** Supabase PostgreSQL with Row Level Security
- **AI:** CrewAI multi-agent system + Vercel AI SDK
- **Authentication:** JWT token validation from startupai.site
- **Deployment:** Vercel with serverless functions

**Key Features to Implement:**
- JWT token validation endpoint (`/api/auth/handoff`)
- User onboarding and project creation
- Evidence collection and hypothesis management
- AI-powered report generation via CrewAI
- Cross-site analytics and user tracking

**Performance Targets:**
- Token validation: <2 seconds
- AI report generation: <30 seconds
- Page load times: <3 seconds
- Cross-site handoff: <3 seconds total

See subfolders for data models, API specifications, testing, CI/CD, deployment, and operations.

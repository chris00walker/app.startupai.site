# app.startupai.site Documentation

**Status:** REFERENCES SHARED DOCS  
**Date:** September 25, 2025  

---

## Two-Site Architecture

This repository (`app.startupai.site`) is the **Product Platform** in StartupAI's two-site architecture:

- **startupai.site** (The Promise) - Convert Prospects to customers
- **app.startupai.site** (The Product) - Deliver value and create advocates ← **YOU ARE HERE**

---

## Documentation Location

All **shared documentation** lives in the StartupAI repository:

**[/home/chris/startupai.site/docs/](/home/chris/startupai.site/docs/)**

### Quick Navigation for Product Platform Development:

#### Core Requirements
- **MVP Specification:** [Two-Site Architecture](../startupai.site/docs/product/mvp-specification.md#02-product-platform-appstartupaisite-the-product)
- **User Stories:** [Product Platform Stories](../startupai.site/docs/product/user-stories.md)
- **UX Design:** [Product Platform UX](../startupai.site/docs/design/user-experience.md#phase-2-onboarding-first-value-appstartupaisite-10-20-minutes)

#### Technical Implementation
- **System Architecture:** [Product Platform Architecture](../startupai.site/docs/technical/high_level_architectural_spec.md#32-product-platform-appstartupaisite-the-product)
- **Implementation Plan:** [Phases 3-5](../startupai.site/docs/technical/two-site-implementation-plan.md#4-phase-3-product-platform-core-features-appstartupaisite)
- **Authentication:** [Token Validation](../startupai.site/docs/technical/two-site-implementation-plan.md#41-authentication-receiver--user-onboarding)

#### Cross-Site Integration
- **Handoff Process:** [Secure Token Validation](../startupai.site/docs/product/user-stories.md#story-02-token-validation-session-creation-appstartupaisite)
- **Shared Services:** [Supabase Integration](../startupai.site/docs/technical/high_level_architectural_spec.md#34-shared-infrastructure--services)

---

## Development Quick Start

### For Product Platform Development:
1. **Read:** [MVP Spec - Product Platform Section](../startupai.site/docs/product/mvp-specification.md#02-product-platform-appstartupaisite-the-product)
2. **Implement:** [Implementation Plan - Phase 3](../startupai.site/docs/technical/two-site-implementation-plan.md#4-phase-3-product-platform-core-features-appstartupaisite)
3. **Test:** [User Stories - Product Platform](../startupai.site/docs/product/user-stories.md)

### Key Features to Implement:
- [ ] JWT token validation endpoint (`/api/auth/handoff`)
- [ ] User onboarding flow
- [ ] Project creation wizard
- [ ] Evidence collection system
- [ ] AI-powered report generation
- [ ] CrewAI integration

---

## Local Documentation (Archived)

The following documents in this repository are **archived** and kept for historical reference only:

{{ ... }}

### Migration Summary:
- All requirements moved to shared StartupAI docs
- Two-site architecture documented
- Cross-site authentication specified
- Product platform requirements detailed
- Implementation roadmap created

---

## Development Workflow

**For app.startupai.site development:**
1. **Reference:** `/home/chris/startupai.site/docs/` for all specifications
2. **Implement:** Code in `/home/chris/app.startupai.site/`
3. **Focus:** Product platform features (authentication receiver, core platform, AI workflows)
4. **Integration:** Secure handoff from startupai.site

**For cross-site features:**
- Authentication handoff testing
- Shared Supabase integration
- Cross-site analytics implementation

---

**Last Updated:** September 25, 2025  
**Architecture:** Two-Site Marketing → Product Flow

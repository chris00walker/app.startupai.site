# StartupAI Project Plan

**Goal**: First Paying Customer | **Timeline**: 4 Weeks | **End Date**: 2026-03-02

**Owner**: project-manager | **Approved By**: Pending | **Created**: 2026-02-02

**Revision**: v2.3 - Marketplace analytics and security work completed (Feb 4)

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Goal** | First paying customer (cold acquisition, completes 1 HITL) |
| **Duration** | 4 weeks (2026-02-02 → 2026-03-02) |
| **Repos** | 3 (Product App, AI Backend, Marketing) |
| **Teams** | 4 (Leadership, Design, Engineering, Quality) |
| **Agents** | 18 specialists |
| **Milestones** | 4 (weekly gates) |
| **Total Hours** | 213.5h (was 195.5h + 18h marketplace) |
| **Budget** | $500 |

### Hours by Category

| Category | Hours | % | Notes |
|----------|-------|---|-------|
| Product App (Engineering) | 66.5h | 31% | +18h marketplace work completed |
| AI Backend | 68h | 32% | |
| Marketing | 30h | 14% | |
| Design | 20h | 9% | |
| Documentation | 11h | 5% | |
| Analytics | 7h | 3% | Event taxonomy done |
| External (Founder) | 11h | 5% | |
| **Total** | **213.5h** | 100% | Was 195.5h before marketplace |

---

## Blocking Decision: Pricing

**STATUS: RESOLVED (2026-02-03)**

| Parameter | Decision | Rationale |
|-----------|----------|-----------|
| **Founder Plan Price** | $49/month | Strategyzer-level positioning; accessible to bootstrapped founders |
| **Trial Duration** | 30 days | Allows completion of full Phase 1 VPC Discovery |
| **Ad Budget** | Separate (pass-through) | Founder-approved, not included in SaaS fee |

**Canonical Source**: `docs/specs/pricing.md`

**Decision Owner**: Founder + product-strategist | **Decision Date**: Feb 3, 2026

---

## The Three Repositories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STARTUPAI ECOSYSTEM (3 REPOS)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  app.startupai.site          startupai-crew           startupai.site        │
│  ──────────────────          ──────────────           ──────────────        │
│  Product App                 AI Backend               Marketing Site        │
│  Next.js + Supabase          CrewAI + Modal           Lead capture          │
│  ~90% complete               ~80% complete            ~95% complete         │
│                                                                              │
│  LEAD: frontend-dev          LEAD: ai-engineer        LEAD: content-strat   │
│  TEAM: backend-dev,          TEAM: platform-eng,      TEAM: graphic-designer│
│        data-engineer,              system-architect         ui-designer     │
│        security-eng                                                         │
│                                                                              │
│  KEY WORK:                   KEY WORK:                KEY WORK:             │
│  • Stripe integration        • MCP tool wiring        • Wire to real APIs   │
│  • Security hardening        • Phase 3-4 testing      • Landing page A/B    │
│  ✅ Marketplace analytics    • Production validation  • IH community launch │
│  ✅ RLS security fixes                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Critical Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CRITICAL PATH TO FIRST CUSTOMER                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  WEEK 1                WEEK 2                WEEK 3              WEEK 4      │
│  Foundation            Core Engineering      Integration         Launch      │
│  ─────────             ───────────────       ───────────         ──────      │
│                                                                              │
│  ┌─────────┐          ┌─────────┐           ┌─────────┐        ┌─────────┐  │
│  │ Pricing │ ───────► │ Payment │ ────────► │ E2E     │ ─────► │ First   │  │
│  │ Decision│          │ + Design│           │ Verified│        │ Customer│  │
│  └─────────┘          └─────────┘           └─────────┘        └─────────┘  │
│       │                    │                     │                  │        │
│       │ FOUNDER            │ ENG + DESIGN        │ QA               │ SALES  │
│       │ (external)         │ (internal)          │ (internal)       │        │
│                                                                              │
│  PARALLEL TRACKS:                                                            │
│  ├── Pricing decision (Day 1) ─────────────────────────────────────────►    │
│  ├── PostHog instrumentation (Week 1-2)                                     │
│  ├── MCP tool wiring (Week 1-4)                                             │
│  ├── Design reviews (Week 2-3)                                              │
│  ├── IH draft (Week 2) → launch (Week 4)                                    │
│  └── Documentation (Week 2-3)                                               │
│                                                                              │
│  GATE 1: Foundation  GATE 2: Payments    GATE 3: E2E      GATE 4: REVENUE   │
│  (Feb 9)             work (Feb 16)       passes (Feb 23)  (Mar 2)           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Milestones

### M1: Foundation Complete (Feb 9)

**Gate**: Pricing decided, Stripe account active, products configured, schema applied, analytics instrumented

| Deliverable | Owner | Repo | Hours | Status |
|-------------|-------|------|-------|--------|
| E0: Pricing decision | Founder | External | 1h | ✅ DONE |
| E1: Stripe account created | Founder | External | 2h | ⏳ Blocked (E0) |
| E2: Configure Stripe products/prices | Founder | External | 2h | ⏳ Blocked (E1) |
| P5: Stripe env vars in Netlify | platform-eng | Product | 1h | ⏳ Blocked (E1) |
| P5a: Webhook URL in Stripe dashboard | platform-eng | Product | 0.5h | ⏳ Blocked (P5) |
| P1: Apply pending migrations | data-engineer | Product | 2h | ✅ DONE (17 marketplace migrations) |
| P2: Trial split verification | data-engineer | Product | 2h | ⏳ Pending |
| A1: Event taxonomy design | data-analyst | Product | 2h | ✅ DONE (marketplace-analytics.md) |
| P3: PostHog Quick Start events | frontend-dev | Product | 3h | ⏳ Pending |
| P4: PostHog HITL approval events | frontend-dev | Product | 4h | ⏳ Pending |
| D1: Design system token sync | ui-designer | Product | 2h | ⏳ Pending |
| **MP1**: Marketplace analytics implementation | frontend-dev | Product | 6h | ✅ DONE |
| **MP2**: RLS security hardening (17 migrations) | security-eng | Product | 8h | ✅ DONE |
| **MP3**: E2E marketplace tests | qa-engineer | Product | 4h | ✅ DONE |

**M1 Total**: 39.5h (was 21.5h + 18h marketplace work completed)

---

### M2: Core Engineering Complete (Feb 16)

**Gate**: Payment flow works, design reviewed, MCP Phase A-B complete, Phase 0-1 verified

| Deliverable | Owner | Repo | Hours | Status |
|-------------|-------|------|-------|--------|
| P6: Stripe upgrade webhook | backend-dev | Product | 5h | ⏳ Blocked (P2, P5) |
| P6a: Webhook idempotency | backend-dev | Product | 2h | ⏳ Blocked (P6) |
| P6b: RLS policies for billing | security-eng | Product | 1h | ⏳ Blocked (P2) |
| P6c: Rate limiting checkout | security-eng | Product | 1h | ⏳ Blocked (P6) |
| P7: Post-upgrade orientation wiring | frontend-dev | Product | 4h | ⏳ Blocked (P6) |
| D2: Upgrade journey UX review | ux-designer | Product | 3h | ⏳ Blocked (P7) |
| D3: Payment flow design review | ui-designer | Product | 4h | ⏳ Blocked (P7) |
| C1: MCP Phase A: Core Server | ai-engineer | Crew | 15h | ⏳ Pending |
| C2: MCP Phase B: Advanced Tools | ai-engineer | Crew | 14h | ⏳ Blocked (C1) |
| M1: Wire Activity Feed to API | content-strat | Marketing | 6h | ⏳ Pending |
| M2: Wire Metrics to API | content-strat | Marketing | 6h | ⏳ Pending |
| M5: IH community post draft | content-strat | Marketing | 8h | ⏳ Pending |
| D5: IH launch visual assets | graphic-designer | Marketing | 6h | ⏳ Pending |
| P8: Phase 0 verification | qa-engineer | Product | 2h | ⏳ Blocked (P3, P4) |
| P9: Phase 1 verification | qa-engineer | Product | 5h | ⏳ Blocked (P8) |
| A2: Event validation | qa-engineer | Product | 2h | ⏳ Blocked (P3, P4) |
| Doc1: API reference (Stripe + MCP) | tech-writer | Product | 4h | ⏳ Pending |
| Doc2: Error message inventory | content-strat | Product | 2h | ⏳ Pending |

**M2 Total**: 90h

---

### M3: Integration Complete (Feb 23)

**Gate**: E2E journey <10min, accessibility passed, payment tested, A/B running

| Deliverable | Owner | Repo | Hours | Status |
|-------------|-------|------|-------|--------|
| C3: MCP Phase C: External + Analytics | ai-engineer | Crew | 13h | ⏳ Blocked (C2) |
| C4: MCP Phase D: CrewAI Integration | ai-engineer | Crew | 18h | ⏳ Blocked (C3) |
| D4: Accessibility audit upgrade flow | ui-designer | Product | 3h | ⏳ Blocked (D3) |
| D6: Brand consistency audit | visual-designer | All | 2h | ⏳ Pending |
| P10: Phase 2 verification | qa-engineer | Product | 4h | ⏳ Blocked (P9, C2) |
| P11: Phase 3-4 verification | qa-engineer | Product | 6h | ⏳ Blocked (P10, C4) |
| P12: E2E journey timing (<10min) | qa-engineer | All | 3h | ⏳ Blocked (P11) |
| P13: Test payment (Stripe test mode) | qa-engineer | Product | 3h | ⏳ Blocked (P7) |
| M3: A/B test measurement plan | data-analyst | Marketing | 2h | ⏳ Pending |
| M4: Landing page A/B test launch | content-strat | Marketing | 4h | ⏳ Blocked (M3, D6) |
| A3: Launch dashboard | data-analyst | Product | 3h | ⏳ Pending |
| Doc3: Quick-start guide | tech-writer | Product | 3h | ⏳ Pending |
| Doc4: Founder demo script | tech-writer | Product | 2h | ⏳ Pending |

**M3 Total**: 66h

---

### M4: Launch (Mar 2)

**Gate**: First paying customer acquired (cold, completes 1 HITL)

| Deliverable | Owner | Repo | Hours | Status |
|-------------|-------|------|-------|--------|
| C5: Phase 3-4 live testing | qa-engineer | Crew | 6h | ⏳ Blocked (P11, C4) |
| C6: First production validation | ai-engineer | Crew | 2h | ⏳ Blocked (C5, P12) |
| M6: IH community launch | content-strat | Marketing | 4h | ⏳ Blocked (M5, D5, P12) |
| E3: First customer outreach | Founder | External | 4h | ⏳ Blocked (P12) |
| E4: Close first sale | Founder | External | 2h | ⏳ Blocked (E3) |

**M4 Total**: 18h

---

## Work Breakdown Structure (WBS)

### 1. Product App (app.startupai.site) - 48.5h

| ID | Task | Hours | Owner | R | A | C | I | Depends On |
|----|------|-------|-------|---|---|---|---|------------|
| P1 | Apply pending migrations | 2h | data-engineer | data-engineer | system-architect | backend-dev | PM | - |
| P2 | Trial split verification | 2h | data-engineer | data-engineer | system-architect | security-eng | PM | P1 |
| P3 | PostHog Quick Start events | 3h | frontend-dev | frontend-dev | product-strategist | data-analyst | PM | A1 |
| P4 | PostHog HITL approval events | 4h | frontend-dev | frontend-dev | product-strategist | data-analyst | PM | A1 |
| P5 | Stripe env vars setup | 1h | platform-eng | platform-eng | system-architect | security-eng | PM | E1 |
| P5a | Webhook URL in Stripe | 0.5h | platform-eng | platform-eng | system-architect | backend-dev | PM | P5 |
| P6 | Stripe upgrade webhook | 5h | backend-dev | backend-dev | system-architect | security-eng | PM | P2, P5 |
| P6a | Webhook idempotency | 2h | backend-dev | backend-dev | system-architect | qa-engineer | PM | P6 |
| P6b | RLS policies for billing | 1h | security-eng | security-eng | system-architect | data-engineer | PM | P2 |
| P6c | Rate limiting checkout | 1h | security-eng | security-eng | system-architect | platform-eng | PM | P6 |
| P7 | Post-upgrade orientation wiring | 4h | frontend-dev | frontend-dev | product-strategist | ux-designer | PM | P6 |
| P8 | Phase 0 verification | 2h | qa-engineer | qa-engineer | product-strategist | frontend-dev | PM | P3, P4 |
| P9 | Phase 1 verification | 5h | qa-engineer | qa-engineer | product-strategist | ai-engineer | PM | P8 |
| P10 | Phase 2 verification | 4h | qa-engineer | qa-engineer | product-strategist | ai-engineer | PM | P9, C2 |
| P11 | Phase 3-4 verification | 6h | qa-engineer | qa-engineer | system-architect | ai-engineer | PM | P10, C4 |
| P12 | E2E journey timing | 3h | qa-engineer | qa-engineer | system-architect | platform-eng | PM | P11 |
| P13 | Test payment (Stripe test) | 3h | qa-engineer | qa-engineer | backend-dev | security-eng | PM | P7 |
| MP1 | Marketplace analytics implementation | 6h | frontend-dev | frontend-dev | data-analyst | qa-engineer | PM | A1 | ✅ DONE |
| MP2 | RLS security hardening (17 migrations) | 8h | security-eng | security-eng | system-architect | backend-dev | PM | - | ✅ DONE |
| MP3 | E2E marketplace flow tests | 4h | qa-engineer | qa-engineer | frontend-dev | security-eng | PM | MP1, MP2 | ✅ DONE |

**Subtotal**: 66.5h (was 48.5h + 18h marketplace work completed)

---

### 2. AI Backend (startupai-crew) - 68h

| ID | Task | Hours | Owner | R | A | C | I | Depends On |
|----|------|-------|-------|---|---|---|---|------------|
| C1 | MCP Phase A: Core Server | 15h | ai-engineer | ai-engineer | system-architect | platform-eng | PM | - |
| C2 | MCP Phase B: Advanced Tools | 14h | ai-engineer | ai-engineer | system-architect | platform-eng | PM | C1 |
| C3 | MCP Phase C: External + Analytics | 13h | ai-engineer | ai-engineer | system-architect | data-analyst | PM | C2 |
| C4 | MCP Phase D: CrewAI Integration | 18h | ai-engineer | ai-engineer | system-architect | platform-eng | PM | C3 |
| C5 | Phase 3-4 live testing | 6h | qa-engineer | qa-engineer | ai-engineer | system-architect | PM | P11, C4 |
| C6 | First production validation | 2h | ai-engineer | ai-engineer | product-strategist | qa-engineer | PM | C5, P12 |

**Subtotal**: 68h

---

### 3. Marketing Site (startupai.site) - 30h

| ID | Task | Hours | Owner | R | A | C | I | Depends On |
|----|------|-------|-------|---|---|---|---|------------|
| M1 | Wire Activity Feed to API | 6h | content-strat | frontend-dev | content-strat | ui-designer | PM | - |
| M2 | Wire Metrics to API | 6h | content-strat | frontend-dev | content-strat | data-analyst | PM | - |
| M3 | A/B test measurement plan | 2h | data-analyst | data-analyst | content-strat | product-strategist | PM | - |
| M4 | Landing page A/B test launch | 4h | content-strat | content-strat | product-strategist | visual-designer | PM | M3, D6 |
| M5 | IH community post draft | 8h | content-strat | content-strat | product-strategist | graphic-designer | PM | - |
| M6 | IH community launch | 4h | content-strat | content-strat | product-strategist | data-analyst | PM | M5, D5, P12 |

**Subtotal**: 30h

---

### 4. Design - 20h

| ID | Task | Hours | Owner | R | A | C | I | Depends On |
|----|------|-------|-------|---|---|---|---|------------|
| D1 | Design system token sync | 2h | ui-designer | ui-designer | visual-designer | frontend-dev | PM | - |
| D2 | Upgrade journey UX review | 3h | ux-designer | ux-designer | ui-designer | frontend-dev | PM | P7 |
| D3 | Payment flow design review | 4h | ui-designer | ui-designer | product-strategist | backend-dev | PM | P7 |
| D4 | Accessibility audit | 3h | ui-designer | ui-designer | qa-engineer | frontend-dev | PM | D3 |
| D5 | IH launch visual assets | 6h | graphic-designer | graphic-designer | visual-designer | content-strat | PM | - |
| D6 | Brand consistency audit | 2h | visual-designer | visual-designer | ui-designer | content-strat | PM | - |

**Subtotal**: 20h

---

### 5. Documentation - 11h

| ID | Task | Hours | Owner | R | A | C | I | Depends On |
|----|------|-------|-------|---|---|---|---|------------|
| Doc1 | API reference (Stripe + MCP) | 4h | tech-writer | tech-writer | system-architect | backend-dev | PM | P6, C2 |
| Doc2 | Error message inventory | 2h | content-strat | content-strat | ux-designer | frontend-dev | PM | - |
| Doc3 | Quick-start guide | 3h | tech-writer | tech-writer | product-strategist | ux-designer | PM | P9 |
| Doc4 | Founder demo script | 2h | tech-writer | tech-writer | product-strategist | Founder | PM | P12 |

**Subtotal**: 11h

---

### 6. Analytics - 7h

| ID | Task | Hours | Owner | R | A | C | I | Depends On |
|----|------|-------|-------|---|---|---|---|------------|
| A1 | Event taxonomy design | 2h | data-analyst | data-analyst | product-strategist | frontend-dev | PM | - |
| A2 | Event validation | 2h | qa-engineer | qa-engineer | data-analyst | frontend-dev | PM | P3, P4 |
| A3 | Launch dashboard | 3h | data-analyst | data-analyst | product-strategist | qa-engineer | PM | A1 |

**Subtotal**: 7h

---

### 7. External (Founder) - 11h

| ID | Task | Hours | Owner | R | A | C | I | Depends On |
|----|------|-------|-------|---|---|---|---|------------|
| E0 | Pricing decision | 1h | Founder | Founder | Founder | product-strategist | PM | ✅ DONE |
| E1 | Create Stripe account | 2h | Founder | Founder | Founder | system-architect | PM | E0 |
| E2 | Configure Stripe products/prices | 2h | Founder | Founder | product-strategist | backend-dev | PM | E1 |
| E3 | First customer outreach | 4h | Founder | Founder | Founder | content-strat | PM | P12 |
| E4 | Close first sale | 2h | Founder | Founder | Founder | product-strategist | PM | E3 |

**Subtotal**: 11h

---

### Total Work

| Category | Hours | Percentage | Status |
|----------|-------|------------|--------|
| Product App | 66.5h | 31% | 18h marketplace done |
| AI Backend | 68h | 32% | Pending |
| Marketing | 30h | 14% | Pending |
| Design | 20h | 9% | Pending |
| Documentation | 11h | 5% | Pending |
| Analytics | 7h | 3% | A1 done |
| External (Founder) | 11h | 5% | E0 done |
| **TOTAL** | **213.5h** | 100% | ~22h complete |

---

## Resource Allocation

### Week 1: Foundation (Feb 2-9)

| Agent | Tasks | Hours |
|-------|-------|-------|
| **Founder** | E0, E1, E2 (Pricing + Stripe) | 5h |
| **data-engineer** | P1, P2 (migrations) | 4h |
| **frontend-dev** | P3, P4 (PostHog events) | 7h |
| **platform-eng** | P5, P5a (Stripe env) | 1.5h |
| **ai-engineer** | C1 (MCP Phase A) | 15h |
| **content-strat** | M1, M2 (API wiring) | 12h |
| **ui-designer** | D1 (token sync) | 2h |
| **data-analyst** | A1 (event taxonomy) | 2h |

**Week 1 Total**: 48.5h

---

### Week 2: Core Engineering (Feb 9-16)

| Agent | Tasks | Hours |
|-------|-------|-------|
| **backend-dev** | P6, P6a (Stripe webhook) | 7h |
| **security-eng** | P6b, P6c (RLS, rate limit) | 2h |
| **frontend-dev** | P7 (post-upgrade UX) | 4h |
| **ai-engineer** | C2 (MCP Phase B) | 14h |
| **qa-engineer** | P8, P9, A2 (Phase 0-1, events) | 9h |
| **content-strat** | M5, Doc2 (IH draft, errors) | 10h |
| **graphic-designer** | D5 (IH visual assets) | 6h |
| **ux-designer** | D2 (upgrade UX review) | 3h |
| **ui-designer** | D3 (payment design review) | 4h |
| **tech-writer** | Doc1 (API reference) | 4h |

**Week 2 Total**: 63h

---

### Week 3: Integration (Feb 16-23)

| Agent | Tasks | Hours |
|-------|-------|-------|
| **ai-engineer** | C3, C4 (MCP Phase C+D) | 31h |
| **qa-engineer** | P10, P11, P12, P13 (verify + test) | 16h |
| **ui-designer** | D4 (accessibility audit) | 3h |
| **visual-designer** | D6 (brand audit) | 2h |
| **content-strat** | M4 (A/B launch) | 4h |
| **data-analyst** | M3, A3 (measurement, dashboard) | 5h |
| **tech-writer** | Doc3, Doc4 (guide, demo script) | 5h |

**Week 3 Total**: 66h

---

### Week 4: Launch (Feb 23-Mar 2)

| Agent | Tasks | Hours |
|-------|-------|-------|
| **qa-engineer** | C5 (Phase 3-4 live test) | 6h |
| **ai-engineer** | C6 (production validation) | 2h |
| **content-strat** | M6 (IH launch) | 4h |
| **Founder** | E3, E4 (outreach, close) | 6h |

**Week 4 Total**: 18h

---

## Budget

| Category | Amount | Notes |
|----------|--------|-------|
| **Stripe fees** | $25 | 2.9% + 30¢ per transaction (est. 1-5 customers) |
| **Modal compute** | $50 | ~$5-10/month × 4 weeks + buffer |
| **Ad spend (A/B test)** | $200 | Landing page test |
| **IH promoted post** | $0 | Organic launch |
| **Contingency** | $225 | Unexpected costs |
| **TOTAL** | **$500** | |

---

## Dependencies Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPENDENCY GRAPH                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  EXTERNAL (BLOCKERS)                                                         │
│  ───────────────────                                                         │
│  E0 (Pricing) ──► E1 (Stripe) ──► P5 (env) ──► P6 (webhook) ──► P7 (UX)    │
│                        │              │              │              │        │
│                        ▼              │              │              ▼        │
│                   E2 (products)       │              │         P13 (test)   │
│                                       │              │              │        │
│  PRODUCT APP                          │              │              │        │
│  ───────────                          │              ▼              │        │
│  P1 (migrations) ──► P2 (trial) ──────┴──► P6b (RLS)               │        │
│                                                                     │        │
│  A1 (taxonomy) ──► P3 (PostHog QS) ──► P8 (Phase 0)                │        │
│        │           P4 (PostHog HITL) ─┘       │                     │        │
│        │                                      ▼                     │        │
│        └──► A2 (event validation)       P9 (Phase 1)               │        │
│                                              │                      │        │
│  DESIGN                                      ▼                      │        │
│  ──────                              P10 (Phase 2) ◄────────────────┘        │
│  D1 (tokens) ──────────────────────┐      │                                 │
│  D5 (IH assets) ──────────────────┐│      ▼                                 │
│  D6 (brand) ──► M4 (A/B launch)   ││  P11 (Phase 3-4) ◄─────┐               │
│                                   ││      │                  │               │
│  P7 ──► D2 (UX review)           ││      ▼                  │               │
│     └──► D3 (design review) ──► D4 (a11y)                   │               │
│                                   ││  P12 (E2E timing) ◄────┼───────────┐   │
│                                   ││      │                  │           │   │
│  AI BACKEND                       ││      │                  │           │   │
│  ──────────                       ││      │                  │           │   │
│  C1 ──► C2 ──► C3 ──► C4 ────────┼┼──────┼──────────────────┘           │   │
│  (A)    (B)    (C)    (D)        ││      │                              │   │
│                   │               ││      │                              │   │
│                   │               ││      ▼                              │   │
│                   └───────────────┼┼► C5 (live test) ◄─── P11           │   │
│                                   ││      │                              │   │
│                                   ││      ▼                              │   │
│                                   ││  C6 (production) ◄───── P12        │   │
│                                   ││                                     │   │
│  MARKETING                        ││                                     │   │
│  ─────────                        ││                                     │   │
│  M1, M2 (API wiring)              ││                                     │   │
│  M5 (IH draft) ──► M6 (launch) ◄──┼┴─────────────────────────────────────┘   │
│                        │          │                                          │
│  DOCUMENTATION         │          │                                          │
│  ─────────────         │          │                                          │
│  Doc1 (API ref) ◄── P6, C2       │                                          │
│  Doc3 (guide) ◄── P9             │                                          │
│  Doc4 (demo) ◄── P12             │                                          │
│                                   │                                          │
│  LAUNCH                           │                                          │
│  ──────                           │                                          │
│                E3 (outreach) ──► E4 (close) ──► FIRST CUSTOMER              │
│                     ▲                                                        │
│                     └────────── P12                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| **Pricing decision delay** | Medium | Critical | Escalate Day 1 if no decision | Founder |
| **Stripe account delay** | Medium | Critical | Founder escalates immediately | Founder |
| **MCP implementation overrun** | Medium | High | Descope Phase D if needed | ai-engineer |
| **No customers from IH** | Medium | High | Parallel outreach to 10 warm contacts (E3) | Founder |
| **Modal reliability issues** | Low | High | Fallback to mocked responses | platform-eng |
| **PostHog events not firing** | Low | Medium | E2E tests verify events (A2) | qa-engineer |
| **Assumption A1-A4 failure** | Medium | Critical | Pivot meeting if conversion <1% | product-strategist |
| **43% E2E tests skipped** | Medium | Medium | Define skip policy before Gate 3 | qa-engineer |

---

## RACI Summary

### Leadership Team

| Role | Responsibilities |
|------|-----------------|
| **Founder** | Pricing (E0), Stripe setup (E1-E2), customer acquisition (E3-E4), final approval |
| **project-manager** | Coordination, status reporting, blocker escalation |
| **product-strategist** | Assumption accountability, pricing input, pivot decisions |
| **system-architect** | Architecture accountability, technical decisions |

### Engineering Team

| Role | Responsibilities |
|------|-----------------|
| **frontend-dev** | PostHog events (P3-P4), Stripe UX (P7), Engineering Team Lead |
| **backend-dev** | Stripe webhook (P6, P6a) |
| **data-engineer** | Migrations (P1-P2) |
| **ai-engineer** | MCP implementation (C1-C4), production validation (C6) |
| **platform-eng** | Stripe env vars (P5, P5a), infra support |
| **security-eng** | RLS policies (P6b), rate limiting (P6c) |

### Design Team

| Role | Responsibilities |
|------|-----------------|
| **ui-designer** | Token sync (D1), payment review (D3), accessibility (D4), Design Team Lead |
| **ux-designer** | Upgrade journey review (D2) |
| **visual-designer** | Brand consistency (D6) |
| **graphic-designer** | IH visual assets (D5) |

### Quality Team

| Role | Responsibilities |
|------|-----------------|
| **qa-engineer** | All verification (P8-P13, C5), event validation (A2), Quality Team Lead |
| **tech-writer** | API docs (Doc1), guide (Doc3), demo script (Doc4) |
| **content-strat** | Marketing (M1-M6), error messages (Doc2) |
| **data-analyst** | Event taxonomy (A1), measurement (M3), dashboard (A3) |

---

## Weekly Cadence

| Day | Activity | Participants | Output |
|-----|----------|--------------|--------|
| **Monday** | Sprint planning | Leadership Team | Week goals set |
| **Wednesday** | Leads sync | Team leads + PM | Blockers cleared |
| **Friday** | Sprint review | Leadership + Founder | Status report |

---

## Gate Criteria

### Gate 1: Foundation (Feb 9)

- [x] **E0**: Pricing decision made ($49/month, 30-day trial) - DONE 2026-02-03
- [ ] **E1**: Stripe account active and configured
- [ ] **E2**: Stripe products/prices configured per E0 decision
- [ ] **P5**: Stripe env vars in Netlify
- [ ] **P2**: Trial split verified (schema matches role enum)
- [x] **A1**: Event taxonomy documented (marketplace-analytics.md) - DONE 2026-02-03
- [ ] **P3, P4**: PostHog events instrumented
- [ ] `pnpm schema:fk:ci` passes (no FK type mismatches)
- [x] **MP1**: Marketplace analytics (server + client) - DONE 2026-02-04
- [x] **MP2**: 17 RLS security migrations applied - DONE 2026-02-04
- [x] **MP3**: E2E marketplace flow tests - DONE 2026-02-04

### Gate 2: Core Engineering (Feb 16)

- [ ] **P6**: Stripe payment flow works (test mode)
- [ ] **P6a**: Webhook handles duplicate delivery correctly
- [ ] **P6b, P6c**: Security hardening complete
- [ ] **C1, C2**: MCP Phase A+B complete (29h)
- [ ] **D2, D3**: Design review passed for upgrade flow
- [ ] **P8, P9**: Phase 0-1 verified working
- [ ] **M1, M2**: Marketing APIs wired
- [ ] **M5**: IH post draft complete
- [ ] **Doc1**: API reference available
- [ ] Unit tests maintain >70% coverage

### Gate 3: Integration Complete (Feb 23)

- [ ] **C3, C4**: MCP Phase C+D complete
- [ ] **P10**: Phase 2 verified working
- [ ] **P11**: Phase 3-4 verified working
- [ ] **P12**: E2E journey completes in <10 minutes
- [ ] **P13**: Test payment successful
- [ ] **D4**: Accessibility audit passed (WCAG 2.1 AA critical paths)
- [ ] **D6**: Brand consistency verified across repos
- [ ] **M4**: Landing page A/B test running with measurement plan
- [ ] **A3**: Launch dashboard operational
- [ ] **Doc3**: Quick-start guide available
- [ ] `pnpm test:e2e` passes (skipped test policy defined)

### Gate 4: Launch (Mar 2)

- [ ] **C5**: Phase 3-4 live testing passed
- [ ] **C6**: Production validation run successful
- [ ] **M6**: IH community launched
- [ ] **D5**: Marketing visual assets delivered
- [ ] **Doc4**: Founder demo script ready
- [ ] Production smoke test passed (error rate <1%)
- [ ] **E4**: **First paying customer acquired** (cold acquisition, 1 HITL completed)

---

## Success Criteria

### Definition of "First Paying Customer"

Per Leadership Team feedback, success requires:

| Criterion | Requirement |
|-----------|-------------|
| **Source** | Cold acquisition (not founder's network) |
| **Action** | Completed Stripe payment |
| **Engagement** | Completed at least 1 HITL approval |
| **Validation** | Counts toward A4 (WTP) evidence |

### Post-Launch Checkpoint (M5: Week 6)

Although outside this 4-week plan, define now:

- [ ] 30-day retention check (customer still active)
- [ ] n ≥ 5 customers for statistical confidence
- [ ] Conversion rate measured (signup → trial → paid)
- [ ] A1-A4 evidence thresholds reviewed

---

## Business Validation

Business model validation happens **IN the StartupAI product**, not in this document.

| Role | Entity | Action |
|------|--------|--------|
| Consultant | CW Consulting | First consultant account |
| Client | StartupAI | First client project |
| Validation | In-product | Hypotheses, evidence, phases tracked in UI |

**Reference data**: [validation-reference.md](../archive/business/validation-reference.md)

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [WORK.md](WORK.md) | Sprint details, current WIP |
| [project-governance.md](project-governance.md) | Team structure, RACI detail, decisions |
| [cross-repo-blockers.md](cross-repo-blockers.md) | Ecosystem dependencies |
| [09-status.md](../../startupai-crew/docs/master-architecture/09-status.md) | Technical ecosystem status |
| [validation-reference.md](../archive/business/validation-reference.md) | Archived business validation data |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| v1.0 | 2026-02-02 | project-manager | Initial plan (143h) |
| v2.0 | 2026-02-02 | project-manager | Incorporated feedback from 18 team members across 4 teams. Added: Design work (20h), Documentation (11h), Analytics (7h), Security tasks (4h). Adjusted verification times (+8h). Added pricing blocker (E0). Fixed C5 dependency. Updated RACI for design team. Added gate criteria. Total: 177h |
| v2.1 | 2026-02-02 | project-manager | Fixed 5 RACI violations: E0, E3, E4 (Founder as A for Founder decisions), P6c (system-architect as A for security), D3 (product-strategist as A to avoid hierarchy conflict) |
| v2.2 | 2026-02-02 | project-manager | Fixed effort totals (177h→195.5h), Product App hours (41h→48.5h), security note (7.5h→2h), Gate 3 criteria (P11 is Phase 3-4 not 2-4), Gate 1 added E2, Stripe fees budget ($0→$25), percentages sum to 100%, M1 gate mentions E2 |
| v2.3 | 2026-02-04 | project-manager | Marketplace work completed: 17 RLS migrations, server+client analytics, E2E tests. Added MP1-MP3 deliverables. Updated M1 total (21.5h→39.5h). Marked A1 complete. |

---

## Completed Work (Feb 3-4, 2026) - Marketplace Phase

### Summary

Major unplanned work completed to ship the Portfolio Holder marketplace features:

| Category | Work | Commits |
|----------|------|---------|
| **Schema/Security** | 17 migrations fixing RLS, INSERT constraints, analytics RPC | 20260203000001-000017 |
| **Server Analytics** | PostHog HTTP API tracking for all marketplace routes | `lib/analytics/server.ts` |
| **Client Analytics** | Directory browse, profile view, filter events | `lib/analytics/index.ts` |
| **E2E Tests** | Full marketplace flow coverage | `41-marketplace-flows.spec.ts` |
| **API Hardening** | Verification status, graceful error handling | All marketplace routes |

### Key Files Created/Modified

**New Files:**
- `frontend/src/lib/analytics/server.ts` - Server-side PostHog tracking
- `frontend/tests/e2e/41-marketplace-flows.spec.ts` - E2E marketplace tests
- `supabase/migrations/20260203000001-17_*.sql` - 17 security migrations

**Major Changes:**
- All marketplace API routes now emit server-side analytics
- RLS policies hardened with SECURITY DEFINER functions
- INSERT policy constraints enforce `connection_status` and `initiated_by`
- Trial consultants can now use legacy invite flow

### Defects Addressed

From `docs/work/marketplace-defects.md`:
- S-001: NOT NULL invite fields (FIXED - migration 000003)
- A-001: Missing cooldown check (FIXED - API routes)
- A-003: Missing verification check (FIXED - RPC functions)
- S-008: Founder directory exposed (FIXED - RLS migration 000004)
- Analytics RLS blocking (FIXED - SECURITY DEFINER in 000017)

### Impact on Plan

- M1 total increased from 21.5h to 39.5h (+18h for marketplace work)
- Product App completion increased from ~85% to ~90%
- Several critical security issues resolved before they reached production

---

**Last Updated**: 2026-02-04 | **Next Review**: Weekly Friday | **Status**: Awaiting Founder Approval

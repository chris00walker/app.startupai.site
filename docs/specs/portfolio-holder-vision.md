# Product Vision: Portfolio Holder Marketplace

**Status**: Approved v3.0 | **Updated**: 2026-02-03 | **Owner**: product-strategist
**Approved By**: Founder (2026-02-03) | **Leadership Review**: Complete

---

## Executive Summary

StartupAI is evolving from a validation tool into a **two-sided marketplace** connecting validated founders with capital providers. The "Consultant" persona has been expanded into a **Portfolio Holder** umbrella covering five relationship types.

**Key strategic insight**: The bait for Founders is now **access to capital**. Portfolio Holders (VCs, angels, accelerators) are the draw that attracts founders to the platform - creating a quality flywheel.

**Core value proposition**:
> "StartupAI: The marketplace for pre-validated deal flow"

---

## The Two-Sided Marketplace

### Supply Side: Founders

Founders use StartupAI to validate their business ideas using the VPD methodology. Their validation evidence becomes a **quality signal** that attracts capital providers.

| What Founders Get | What Founders Provide |
|-------------------|----------------------|
| Structured validation methodology | Pre-validated deal flow |
| AI-powered market research | Evidence packages |
| Customer interview frameworks | Behavioral data (DO evidence) |
| Access to verified capital providers | Marketplace liquidity |

### Demand Side: Portfolio Holders

Portfolio Holders pay for access to validated founders. They are not buying software - they are buying **de-risked deal flow**.

| What Portfolio Holders Get | What They Pay |
|---------------------------|---------------|
| VPD-validated startups | $199-$1,499/month |
| Evidence packages (interviews, DO data) | Subscription tiers |
| RFQ Board (founders seeking capital) | Marketplace access |
| Founder Directory | Contact request system |

### The Quality Flywheel

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKETPLACE FLYWHEEL                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    Validated Founders ──────────────► Capital Providers         │
│         (Supply)                           (Demand)             │
│            │                                   │                │
│            │    "X verified investors          │                │
│            │     on StartupAI"                 │                │
│            │                                   │                │
│            ▼                                   ▼                │
│    More founders ◄──────────────────── More deal flow           │
│    seeking capital                     attracts VCs             │
│                                                                 │
│    THE BAIT FOR FOUNDERS = ACCESS TO CAPITAL                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Marketplace Economics

### What Capital Providers Pay Today

| Platform | Annual Cost | What They Get |
|----------|-------------|---------------|
| PitchBook | $12,000-70,000 | Company data, funding history, contacts |
| Crunchbase Enterprise | $2,000-5,000 | Company profiles, funding rounds, alerts |
| AngelList Syndicates | $8,000 + 20% carry | Access to curated deals |
| Angel Group Membership | $750-1,000 | Access to group deal flow + events |
| Deal Sourcing Services | $60,000-120,000 | Introductions + curated matches |

### What StartupAI Provides That Others Cannot

| Differentiator | Why It Matters |
|----------------|----------------|
| **VPD Validation Evidence** | Not available anywhere else |
| **Customer Interview Data** | Primary research, not secondary |
| **Behavioral Evidence (DO data)** | Real traction signals, not vanity metrics |
| **Hypothesis Testing History** | Shows founder rigor |
| **HITL Checkpoint Record** | Shows coachability |
| **Fit Score Algorithm** | Quantified problem-solution fit |

### Competitive Positioning

StartupAI is not competing with:
- **Crunchbase** (data) - we provide evidence, not databases
- **AngelList** (transactions) - we provide validation, not SPVs
- **Gust** (application management) - we provide deal flow, not intake forms

StartupAI is creating a new category: **pre-validated deal flow marketplace**.

---

## Pricing Tiers

**See `docs/specs/pricing.md` for canonical pricing.**

### Summary

| Tier | Monthly | Annual | Target |
|------|---------|--------|--------|
| **Advisor** | $199 | $1,990 | Consultants, coaches, fractional executives |
| **Capital** | $499 | $4,990 | Angels, VCs, accelerators, family offices |

### Why These Prices

| Tier | Rationale |
|------|-----------|
| **Advisor ($199)** | 2-3x typical business SaaS, justified by AI assistance + portfolio visibility |
| **Capital ($499)** | Below angel group memberships ($750-1,000/yr), vastly more value (validated deal flow + API + multi-seat) |

### Why Two Tiers (Not Three)

| Factor | Decision |
|--------|----------|
| **Simplicity** | Easier to sell, easier to understand |
| **Price gap** | $199 → $499 is reasonable; $499 → $1,499 was too large |
| **Feature bundling** | API/multi-seat fit naturally with marketplace access |
| **Enterprise needs** | Capital tier at $499 covers VCs and accelerators |
| **Custom contracts** | True enterprise (100+ seats, SLA) handled separately |

### Marketplace Access by Tier

Both tiers get **full marketplace access**. The difference is enterprise features.

| Feature | Advisor ($199) | Capital ($499) |
|---------|---------------|----------------|
| Portfolio Dashboard | ✓ | ✓ |
| Validation Visibility | ✓ | ✓ |
| White-label Exports | ✓ | ✓ |
| Founder Directory | ✓ | ✓ |
| RFQ/RFP Board | ✓ | ✓ |
| Evidence Packages | ✓ | ✓ |
| Contact Requests | ✓ | ✓ |
| **Advanced Filtering** | ✗ | ✓ |
| **Thesis Matching** | ✗ | ✓ |
| **API Access** | ✗ | ✓ |
| **Multi-seat (5)** | ✗ | ✓ |
| **SSO/SAML** | ✗ | ✓ |
| **Priority Support** | ✗ | ✓ |

---

## The Five Cohorts

### Unified Persona: Portfolio Holder

**Definition**: Any entity that maintains relationships with multiple Founders and needs visibility into their validation progress.

**Core job-to-be-done**: Track, support, and evaluate Founders using evidence-based validation data.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FOUNDER                                    │
│                     (Validating a business idea)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────┬───────────┬───────┴───┬───────────┬───────────┐
    │           │           │           │           │           │
    ▼           ▼           ▼           ▼           ▼           │
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│Capital │ │Advisory│ │Program │ │Service │ │Ecosystem│         │
│Provider│ │Provider│ │Operator│ │Provider│ │Enabler │          │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘          │
    │           │           │           │           │           │
    └───────────┴───────────┴─────┬─────┴───────────┴───────────┘
                                  │
                                  ▼
                ┌─────────────────────────────────┐
                │        PORTFOLIO HOLDER          │
                │    "Show me the evidence"        │
                │                                  │
                │  Relationship Type:              │
                │  • Capital (money)               │
                │  • Advisory (guidance)           │
                │  • Program (cohort)              │
                │  • Service (professional)        │
                │  • Ecosystem (community)         │
                └─────────────────────────────────┘
```

### Cohort 1: Capital Providers

*"Will I get my money back (+ return)?"*

| Entity | Typical Check Size | Validation Need |
|--------|-------------------|-----------------|
| Friends & Family | $5K-$50K | "Is my loved one's dream viable?" |
| Angel Investors | $25K-$250K | "Will I see a return?" |
| Micro VCs | $100K-$500K | "Is this fundable at next stage?" |
| Family Offices | $100K-$2M | "Diversification + thesis fit?" |
| Revenue-Based Finance | $10K-$500K | "Are the unit economics real?" |
| Grants (Gov't, Foundation) | $10K-$500K | "Does this meet our mandate?" |

**Common denominator**: "Show me evidence this isn't going to zero."

**Pricing tier**: Capital ($499/month)

### Cohort 2: Advisory Providers

*"Is my guidance being applied?"*

| Entity | Relationship |
|--------|--------------|
| Business Coaches | Ongoing development |
| Mentors | Informal guidance |
| Fractional Executives | Part-time leadership |
| Advisory Board Members | Strategic input |
| Management Consultants | Project-based |

**Common denominator**: "Is the founder making progress based on my advice?"

**Pricing tier**: Advisor ($199/month)

### Cohort 3: Program Operators

*"Is our program delivering outcomes?"*

| Entity | Context |
|--------|---------|
| Accelerators (YC, Techstars) | Cohort-based, equity |
| Incubators | Longer-term, often non-profit |
| University Programs | Student founders |
| Government Programs | Economic development |
| Corporate Innovation Labs | Strategic ventures |

**Common denominator**: "How do we demonstrate program ROI?"

**Pricing tier**: Capital ($499/month)

### Cohort 4: Professional Service Providers

*"Is this client worth the credit risk?"*

| Entity | Service |
|--------|---------|
| Startup Lawyers | Legal, IP, incorporation |
| Accountants/Bookkeepers | Financial management |
| Marketing Agencies | Growth services |

**Common denominator**: "Should I extend credit terms to this client?"

**Pricing tier**: Advisor ($199/month)

### Cohort 5: Ecosystem Enablers

*"How do we prove value to our community?"*

| Entity | Role |
|--------|------|
| Coworking Spaces | Physical infrastructure |
| Startup Communities | Network/events |
| Chambers of Commerce | Business advocacy |

**Common denominator**: "Are we creating measurable value for our members?"

**Pricing tier**: Advisor ($199/month) or Capital ($499/month for larger organizations)

---

## Architecture Decisions

### Final Decisions (Reconciled 2026-02-03)

Per discussion with Codex, the following decisions are baked into the architecture:

| Decision | Resolution |
|----------|------------|
| **UI Label** | Keep "Consultant" as UI label; Portfolio Holder is the architectural umbrella |
| **Connection Flows** | Three flows: invite-new, link-existing, founder-RFQ |
| **Founder Acceptance** | Required for all relationship types |
| **Portfolio Holder Overlay** | Integral to architecture now (not speculative) |
| **Relationship Types** | All five supported: advisory, capital, program, service, ecosystem |
| **Verification** | Paid plan = verified; trial = unverified |
| **Marketplace Access** | Directory + RFQ Board visible only to verified (Capital+ tier) |
| **Grace Period** | 7 days after payment failure before losing verified status |

### Three Connection Flows

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       CONNECTION FLOWS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FLOW 1: INVITE-NEW                                                      │
│  ─────────────────────────────────                                       │
│  Portfolio Holder invites a founder who isn't on platform yet            │
│                                                                          │
│  PH sends invite → Founder receives email → Founder signs up →           │
│  Founder accepts connection → Relationship active                        │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FLOW 2: LINK-EXISTING                                                   │
│  ─────────────────────────────────                                       │
│  Portfolio Holder requests connection to existing founder                │
│                                                                          │
│  PH searches by email → Founder found → PH sends request →               │
│  Founder reviews → Founder accepts/declines → Relationship active/none   │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FLOW 3: FOUNDER RFQ (Marketplace)                                       │
│  ─────────────────────────────────                                       │
│  Founder posts request seeking capital/advice                            │
│                                                                          │
│  Founder creates RFQ → Posted to Request Board → Verified PH views →     │
│  PH responds with message → Founder reviews → Founder accepts/declines   │
│                                                                          │
│  NOTE: Only Capital+ tier can view/respond to RFQ Board                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Verification System

| Status | Meaning | Directory | RFQ Board | Grace Period |
|--------|---------|-----------|-----------|--------------|
| **Unverified** | Trial or no plan | Hidden | No access | N/A |
| **Verified** (Advisor) | Paid Advisor tier | Full access | Full access | 7 days |
| **Verified** (Capital) | Paid Capital tier | Full access | Full access | 7 days |
| **Grace** | Payment failed, within 7 days | Full access | Full access | Counting down |
| **Revoked** | Payment failed, past 7 days | Hidden | No access | N/A |

### Schema Additions

**consultant_clients table:**
- `relationship_type` (enum: advisory, capital, program, service, ecosystem)
- `connection_status` (enum: invited, requested, active, declined, archived)
- `initiated_by` (enum: consultant, founder)
- `request_message` (nullable text)
- `accepted_at`, `declined_at` (timestamps)

**user_profiles / consultant profile:**
- `consultant_verification_status` (enum: unverified, verified, grace, revoked)
- `directory_opt_in` (boolean)

**New tables (RFQ/RFP):**
- `consultant_requests` (founder posts seeking capital/advice)
- `consultant_request_responses` (PH responses to requests)

---

## Validation Requirements

### Assumption Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│  A4 (Founder WTP $49) ──► A6 (Advisor WTP $199) ──►             │
│       Week 4                   Week 8                           │
│                                                                 │
│  ──► A9 (Capital WTP $499) ──► A10 (Mandate potential)          │
│           Week 12                  Week 14                      │
└─────────────────────────────────────────────────────────────────┘
```

### Updated Test Cards

#### A6: Advisor Willingness to Pay (Updated)

| Field | Value |
|-------|-------|
| **We believe** | Advisors/consultants will pay $199/month for portfolio visibility |
| **To verify** | 8 discovery interviews + landing page test |
| **We are right if** | ≥5 of 8 express WTP at $199, ≥30 landing page signups |
| **We are wrong if** | <4 of 8 express WTP OR <15 signups |
| **Time bound** | 3 weeks (post-A4 validation) |

#### A9: Capital Provider Willingness to Pay (Updated)

| Field | Value |
|-------|-------|
| **We believe** | Capital providers will pay $499/month for validated deal flow |
| **To verify** | 8 interviews (angels, micro VCs) + LOI collection |
| **We are right if** | ≥5 of 8 express WTP at $499, ≥5 signed LOIs |
| **We are wrong if** | <4 of 8 express WTP OR <3 LOIs |
| **Time bound** | 3 weeks (post-A6 validation) |

#### A10: Distribution Channel / Mandate Potential

| Field | Value |
|-------|-------|
| **We believe** | Portfolio holders will require founders to use StartupAI |
| **To verify** | Direct questions in A9 interviews + pilot commitment |
| **We are right if** | ≥3 of 8 indicate mandate potential, ≥1 paid pilot |
| **We are wrong if** | 0 indicate mandate potential |
| **Time bound** | 2 weeks (concurrent with late A9) |

### Evidence Gate for Build

| Evidence Type | Requirement | Weight |
|---------------|-------------|--------|
| Discovery interviews | 8 completed per cohort | SAY (0.3) |
| Landing page signups | ≥50 emails | DO-indirect (0.8) |
| Letters of Intent | ≥5 signed | DO-indirect (0.8) |
| Paying pilot commitment | ≥1 customer | DO-direct (1.0) |

---

## Implementation Roadmap

### Phase 0: Documentation (Complete)
- [x] Document vision (this spec)
- [x] Leadership Team review
- [x] Founder approval of strategic direction
- [x] Pricing framework established
- [x] Marketplace economics analysis
- [x] Reconciliation with Codex decisions

### Phase 1: Founder Launch (Current)
- [ ] Launch Founder tier ($49/month)
- [ ] Validate A4 (Founder WTP)
- [ ] Collect founder supply for marketplace

### Phase 2: Advisor Tier (Post-A4)
- [ ] Validate A6 (Advisor WTP at $199)
- [ ] Launch Advisor tier
- [ ] Build portfolio dashboard
- [ ] Build connection flows (invite-new, link-existing)

### Phase 3: Capital Tier + Marketplace (Post-A6)
- [ ] Validate A9 (Capital WTP at $499)
- [ ] Build Founder Directory
- [ ] Build RFQ/RFP Board
- [ ] Build evidence packages
- [ ] Launch Capital tier

### Phase 4: Institutional Tier (Post-A9)
- [ ] Validate A10 (mandate potential)
- [ ] Build API access
- [ ] Build multi-seat licensing
- [ ] Launch Institutional tier
- [ ] Enterprise sales motion

---

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Is "Portfolio Holder" the right term? | Keep "Consultant" as UI label; Portfolio Holder is internal/architectural |
| Should founders reject PH requests? | Yes, founder acceptance required for all flows |
| Data access levels by type? | All types see same validation data; relationship context differs |
| Multi-relationship support? | Yes, founders can have multiple PHs of different types |
| Competitive moat? | VPD validation evidence is unique; data + methodology + evidence |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-03 | **Tiered pricing**: Advisor $199, Capital $499, Institutional $1,499 | Marketplace economics analysis; competitive benchmarking |
| 2026-02-03 | **Marketplace model**: Two-sided with founders as supply, PHs as demand | Bait for founders is capital access; flywheel dynamics |
| 2026-02-03 | **Three connection flows**: invite-new, link-existing, founder-RFQ | Codex reconciliation; comprehensive marketplace coverage |
| 2026-02-03 | **Founder acceptance required**: All relationships need consent | Privacy, trust, founder autonomy |
| 2026-02-03 | **7-day grace period**: Before losing verified status | Balance user experience with payment enforcement |
| 2026-01-31 | **Overlay approach**: Add relationship_type without renaming | Lower migration risk, faster |
| 2026-01-31 | **Evidence gates**: ≥5 LOIs + ≥1 paying pilot before build | VPD methodology compliance |

---

## References

- [Pricing Specification](pricing.md) - Canonical pricing source
- [Consultant Journey Map](../user-experience/journeys/consultant/consultant-journey-map.md)
- [Consultant Persona](../user-experience/personas/consultant.md)
- [VPD Methodology](../../startupai-crew/docs/master-architecture/03-methodology.md)
- [Consultant Client System](../features/consultant-client-system.md)

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-02-03 | 3.2 | Both tiers now get full marketplace access; Capital premium is enterprise features |
| 2026-02-03 | 3.1 | Simplified to 2 tiers ($199 Advisor, $499 Capital); removed Institutional tier |
| 2026-02-03 | 3.0 | Added marketplace economics, tiered pricing, quality flywheel, Codex reconciliation decisions |
| 2026-01-31 | 2.0 | Leadership Team review; strengthened Test Cards; overlay approach; evidence gates |
| 2026-01-31 | 1.1 | Added ASCII table diagrams for improved readability |
| 2026-01-31 | 1.0 | Initial draft from product-strategist / founder discussion |

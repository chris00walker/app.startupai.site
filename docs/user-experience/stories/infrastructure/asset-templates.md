---
purpose: "User stories for asset template pipeline - sourcing, staging, validation, deployment"
status: "active"
last_reviewed: "2026-01-26"
last_updated: "2026-01-26"
---

# Asset Template User Stories

Stories for implementing the full asset pipeline from sourcing through deployment.

## Design Philosophy

**Assembly, Not Generation**: LLMs generate copy/messaging; templates provide structure/design.

**Sourcing Strategy**: Option B - Purchase premium Tailwind templates (Tailwind UI, ThemeForest)
- Professional, conversion-tested designs
- Tailwind-based = easy slot customization
- One-time cost (~$200-500)
- Fast to market (1 week vs 4-6 weeks custom)

---

## Phase 1: Asset Sourcing (US-AT01 - US-AT02)

### US-AT01: Landing Page Template Procurement

**As a** StartupAI platform operator,
**I want to** procure a library of premium Tailwind landing page templates,
**So that** agents have professional, conversion-tested designs to work with.

**Acceptance Criteria:**

**Given** a budget of $300-500 for template procurement
**When** templates are selected
**Then** the following requirements are met:

**Template Requirements:**
| Requirement | Minimum | Target |
|-------------|---------|--------|
| Complete landing pages | 5 | 10 |
| Section components | 15 | 25 |
| Responsive breakpoints | 3 (mobile, tablet, desktop) | 4 (+large) |
| Dark mode support | Optional | Yes |
| Tailwind version | 3.x | 3.4+ |

**Recommended Sources (evaluated in order):**
1. **Tailwind UI** ($299) - Official, highest quality, React/Vue/HTML
2. **Cruip** ($149) - Landing-focused, conversion-optimized
3. **ThemeForest Tailwind** ($49-79 each) - À la carte selection

**Deliverable:** Licensed template files in `startupai-crew/assets/templates/source/`

**License Requirements:**
- Commercial use permitted
- Unlimited projects (for founder deployments)
- No per-seat restrictions
- Modification allowed

**File:** `startupai-crew/docs/templates/procurement-checklist.md`

---

### US-AT02: Ad Creative Template Procurement

**As a** StartupAI platform operator,
**I want to** procure ad creative templates for each target platform,
**So that** agents can generate platform-compliant ad creatives.

**Acceptance Criteria:**

**Given** target platforms (Meta, Google, LinkedIn, TikTok)
**When** ad templates are selected
**Then** each platform has minimum viable creative coverage:

**Platform Coverage:**
| Platform | Static Images | Carousel | Video Specs |
|----------|---------------|----------|-------------|
| Meta (FB/IG) | 5 templates | 3 templates | Spec only |
| Google Display | 5 templates | N/A | N/A |
| LinkedIn | 3 templates | 2 templates | Spec only |
| TikTok | 2 templates | N/A | Spec only |

**Template Requirements:**
- Figma or Canva source files (editable)
- Correct dimensions per platform
- Text-safe zones marked
- Brand color placeholders
- Image swap areas defined

**Recommended Sources:**
1. **Canva Pro Templates** ($12.99/mo) - Large library, easy editing
2. **Envato Elements** ($16.50/mo) - Professional, downloadable
3. **AdCreative.ai exports** - AI-optimized layouts

**Deliverable:** Template files in `startupai-crew/assets/templates/ads/`

**File:** `startupai-crew/docs/templates/ad-procurement-checklist.md`

---

## Phase 2: Asset Staging (US-AT03 - US-AT05)

### US-AT03: Template Slot Extraction

**As a** template engineer,
**I want to** convert purchased templates into slot-based components,
**So that** agents can fill templates without understanding HTML/CSS.

**Acceptance Criteria:**

**Given** a purchased landing page template
**When** slot extraction is performed
**Then** each template produces:

```yaml
# Example: hero-gradient.yaml
template_id: hero-gradient
source_file: tailwindui/hero-sections/gradient.html
category: hero

slots:
  - name: headline
    type: text
    max_chars: 60
    required: true
    vpc_source: "value_proposition.primary_gain"

  - name: subheadline
    type: text
    max_chars: 150
    required: true
    vpc_source: "customer_profile.primary_pain"

  - name: cta_text
    type: text
    max_chars: 20
    required: true
    default: "Get Started"

  - name: cta_url
    type: url
    required: true

  - name: background_image
    type: image
    dimensions: "1920x1080"
    required: false
    fallback: "gradient"

variants:
  - dark
  - light

responsive: true
conversion_tested: true
```

**Slot Types:**
| Type | Description | Agent Action |
|------|-------------|--------------|
| `text` | Plain text copy | Generate from VPC |
| `rich_text` | Markdown allowed | Generate from VPC |
| `image` | Image URL | Unsplash query or AI gen |
| `url` | Link destination | Generate or use default |
| `icon` | Lucide icon name | Select from allowed set |
| `color` | Hex or Tailwind class | Use brand or default |
| `list` | Array of items | Generate N items |

**Deliverable:** Slot definitions in `startupai-crew/assets/templates/registry/`

**File:** `startupai-crew/src/tools/templates/extractor.py`

---

### US-AT04: Template Registry Service

**As a** LandingPageGeneratorTool,
**I want to** query a template registry by category and requirements,
**So that** I can select the best template for a given VPC.

**Acceptance Criteria:**

**Given** VPC data and page requirements
**When** registry is queried
**Then** matching templates are returned ranked by fit:

**Registry API:**
```python
# Query interface
registry.find_templates(
    category="landing_page",      # landing_page | ad_creative
    sections=["hero", "features", "cta"],  # Required sections
    style="modern",               # modern | minimal | bold | playful
    industry=None,                # Optional: saas | ecommerce | agency
    has_social_proof=False,       # Founder has testimonials?
)

# Returns
[
    {
        "template_id": "startup-starter",
        "sections": ["hero", "features", "social-proof", "cta", "footer"],
        "slots_count": 23,
        "preview_url": "/previews/startup-starter.png",
        "fit_score": 0.92
    },
    ...
]
```

**Registry Contents (Minimum Viable):**
| Category | Template Count | Sections Covered |
|----------|---------------|------------------|
| Landing Page (Full) | 5 | All sections |
| Hero | 4 variants | - |
| Features | 3 variants | - |
| Social Proof | 3 variants | - |
| Pricing | 3 variants | - |
| CTA | 3 variants | - |
| FAQ | 2 variants | - |
| Footer | 2 variants | - |

**Deliverable:** Registry service at `startupai-crew/src/services/template_registry.py`

**File:** `startupai-crew/src/tools/templates/registry.py`
**Related:** US-MT20

---

### US-AT05: Template Preview Environment

**As a** founder reviewing a generated landing page,
**I want to** preview the page before deployment,
**So that** I can approve or request changes.

**Acceptance Criteria:**

**Given** a template with slots filled by agents
**When** preview is requested
**Then** a preview URL is generated within 10 seconds

**Preview Infrastructure:**
```
┌─────────────────────────────────────────────────────────────┐
│                    PREVIEW FLOW                             │
└─────────────────────────────────────────────────────────────┘

Agent fills slots → POST /api/preview/generate
                           │
                           ▼
                    ┌─────────────┐
                    │  Render     │  Inject slots into template
                    │  Engine     │  Generate static HTML
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Netlify    │  Deploy to preview subdomain
                    │  Deploy     │  preview-{id}.startupai.site
                    └─────────────┘
                           │
                           ▼
                    Return preview URL + screenshot
```

**Preview Features:**
- Unique URL per preview (expires 24h)
- Mobile/tablet/desktop toggle
- Screenshot generation for HITL UI
- Edit slots and re-preview

**Deliverable:** Preview API at `app.startupai.site/api/preview/`

**File:** `frontend/src/app/api/preview/generate/route.ts`

---

## Phase 3: Asset Validation (US-AT06 - US-AT07)

### US-AT06: Landing Page Quality Gate

**As a** StartupAI platform,
**I want to** validate landing pages before production deployment,
**So that** only high-quality pages reach real users.

**Acceptance Criteria:**

**Given** a rendered landing page preview
**When** quality gate runs
**Then** all checks must pass before deployment:

**Automated Checks:**
| Check | Tool | Threshold | Blocking |
|-------|------|-----------|----------|
| Mobile responsive | Playwright viewport tests | 100% elements visible | Yes |
| Load time | Lighthouse | < 3 seconds | Yes |
| Performance score | Lighthouse | > 70 | Yes |
| Accessibility | axe-core | No critical errors | Yes |
| Links valid | Link checker | 100% resolve | Yes |
| Images load | Image checker | 100% load | Yes |
| Form works | Form submit test | Captures email | Yes |
| Tracking pixel | Script check | Meta/Google present | No |

**Visual Checks (HITL):**
| Check | Reviewer | Criteria |
|-------|----------|----------|
| Brand alignment | Founder | Colors/tone match vision |
| Copy accuracy | Founder | VPC properly reflected |
| Trust signals | Founder | Looks professional |
| CTA clarity | Founder | Action is obvious |

**Quality Gate Flow:**
```
Preview Generated → Automated Checks (2 min)
                           │
              ┌────────────┴────────────┐
              │                         │
         PASS │                    FAIL │
              │                         │
              ▼                         ▼
    HITL Review (Founder)        Auto-fix or
              │                  Regenerate
              │
    ┌─────────┴─────────┐
    │                   │
 APPROVE            REQUEST EDIT
    │                   │
    ▼                   ▼
 Deploy to         Edit slots,
 Production        re-preview
```

**Deliverable:** Quality gate service at `frontend/src/lib/quality-gate/`

**File:** `frontend/src/lib/quality-gate/landing-page.ts`

---

### US-AT07: Ad Creative Compliance Validator

**As a** StartupAI platform,
**I want to** validate ad creatives against platform policies,
**So that** ads don't get rejected and waste founder's budget.

**Acceptance Criteria:**

**Given** generated ad creatives for a platform
**When** compliance check runs
**Then** policy violations are flagged before submission:

**Platform Policies Checked:**

**Meta (Facebook/Instagram):**
| Policy | Check | Auto-fixable |
|--------|-------|--------------|
| Text in image < 20% | OCR + area calc | No (flag only) |
| No prohibited content | Keyword filter | No |
| Correct dimensions | Size check | Yes (resize) |
| Landing page match | URL domain check | No |

**Google Ads:**
| Policy | Check | Auto-fixable |
|--------|-------|--------------|
| No excessive caps | Regex | Yes |
| No exclamation abuse | Regex | Yes |
| Character limits | Length check | Yes (truncate) |
| No click-bait | Keyword filter | No |

**LinkedIn:**
| Policy | Check | Auto-fixable |
|--------|-------|--------------|
| Professional tone | Sentiment check | No |
| Correct dimensions | Size check | Yes |
| No personal data requests | Keyword filter | No |

**Compliance Report:**
```yaml
ad_set_id: "as_123"
platform: "meta"
status: "passed"  # passed | warnings | failed
checks:
  - name: "image_text_ratio"
    status: "passed"
    value: 0.12
    threshold: 0.20
  - name: "prohibited_content"
    status: "passed"
  - name: "dimensions"
    status: "auto_fixed"
    original: "1200x800"
    fixed: "1080x1080"
warnings: []
blockers: []
```

**Deliverable:** Compliance validator at `startupai-crew/src/tools/validators/`

**File:** `startupai-crew/src/tools/validators/ad_compliance.py`
**Related:** US-MT21

---

## Phase 4: Asset Deployment (US-AT08 - US-AT10)

### US-AT08: Landing Page Deployment Automation

**As a** StartupAI platform,
**I want to** deploy approved landing pages to Netlify automatically,
**So that** founders get live URLs without manual intervention.

**Acceptance Criteria:**

**Given** a landing page that passed quality gate and HITL approval
**When** deployment is triggered
**Then** page is live within 60 seconds with:

**Deployment Checklist:**
| Item | Implementation | Automated |
|------|----------------|-----------|
| Unique subdomain | `{project-slug}.validate.startupai.site` | Yes |
| SSL certificate | Netlify auto-provision | Yes |
| Meta pixel installed | Injected at build | Yes |
| Google Analytics | Injected at build | Yes |
| Form backend connected | Netlify Forms or Supabase | Yes |
| Favicon | From brand or default | Yes |
| OG meta tags | Generated from VPC | Yes |
| robots.txt | noindex (validation only) | Yes |

**Deployment API:**
```python
# Deploy to production
deploy_result = netlify.deploy_site(
    site_name=f"{project_slug}-validate",
    html_content=rendered_html,
    assets=image_urls,
    functions={
        "form-handler": form_handler_code
    },
    env_vars={
        "META_PIXEL_ID": founder.meta_pixel_id,
        "GA_TRACKING_ID": founder.ga_tracking_id,
    }
)

# Returns
{
    "url": "https://acme-validate.startupai.site",
    "deploy_id": "d_abc123",
    "ssl_status": "provisioned",
    "form_endpoint": "/api/form-submit"
}
```

**Netlify Integration:**
- API: Netlify API with StartupAI account
- Sites: One Netlify site per project
- Builds: Direct HTML deploy (no build step)
- Forms: Netlify Forms for email capture
- Cost: Free tier (100 form submissions/mo per site)

**Deliverable:** Deployment service at `startupai-crew/src/services/netlify_deploy.py`

**File:** `startupai-crew/src/services/netlify_deploy.py`
**Related:** US-MT20

---

### US-AT09: Ad Platform Submission Automation

**As a** StartupAI platform,
**I want to** submit approved ad creatives to ad platforms via API,
**So that** founders' campaigns launch without manual uploads.

**Acceptance Criteria:**

**Given** ad creatives that passed compliance validation and HITL approval
**When** submission is triggered
**Then** ads are submitted to the target platform:

**Platform API Integration:**
| Platform | API | Automation Level | Manual Steps |
|----------|-----|------------------|--------------|
| Meta | Marketing API | Full | None (if Business verified) |
| Google | Google Ads API | Full | None |
| LinkedIn | Marketing API | Full | None |
| TikTok | Marketing API | Partial | Review queue (24-48h) |

**Submission Flow:**
```
Approved Creatives → Platform API
                          │
                          ▼
                   ┌─────────────┐
                   │  Campaign   │  Create campaign if not exists
                   │  Manager    │  Create ad set with targeting
                   └─────────────┘  Create ad with creatives
                          │
                          ▼
                   ┌─────────────┐
                   │  Budget     │  Set daily/lifetime budget
                   │  Manager    │  Set bid strategy
                   └─────────────┘  Set schedule
                          │
                          ▼
                   ┌─────────────┐
                   │  Submit     │  Submit for platform review
                   │  & Monitor  │  Poll for approval status
                   └─────────────┘
                          │
                          ▼
                   Return: campaign_id, ad_ids, review_status
```

**Budget Controls (Critical):**
```yaml
safety_limits:
  max_daily_spend: $50          # Hard cap per campaign
  max_lifetime_spend: $500      # Hard cap per project
  require_approval_above: $100  # HITL required
  auto_pause_on_cpa_above: 2x   # Pause if CPA > 2x target
```

**Deliverable:** Platform submission services at `startupai-crew/src/services/ad_platforms/`

**File:** `startupai-crew/src/services/ad_platforms/meta.py`, `google.py`, `linkedin.py`
**Related:** US-MT21

---

### US-AT10: Conversion Tracking & Evidence Collection

**As a** StartupAI platform,
**I want to** collect conversion data from deployed landing pages and ads,
**So that** desirability evidence is captured automatically.

**Acceptance Criteria:**

**Given** a live landing page and running ad campaigns
**When** users interact (click, signup, bounce)
**Then** events are captured and stored as evidence:

**Events Captured:**
| Event | Source | Evidence Type |
|-------|--------|---------------|
| Page view | Meta Pixel, GA | Awareness |
| Time on page | GA | Engagement |
| Scroll depth | GA | Engagement |
| CTA click | GA Events | Intent |
| Form submission | Netlify Forms | Conversion |
| Form abandonment | GA | Friction signal |
| Ad click | Platform API | Awareness |
| Ad impression | Platform API | Reach |
| Cost per click | Platform API | Economics |
| Cost per conversion | Platform API | Economics |

**Evidence Storage:**
```typescript
interface DesirabilityEvidence {
  project_id: string;
  campaign_id: string;
  landing_page_url: string;

  // Traffic metrics
  impressions: number;
  clicks: number;
  ctr: number;

  // Landing page metrics
  page_views: number;
  unique_visitors: number;
  avg_time_on_page: number;
  bounce_rate: number;

  // Conversion metrics
  form_submissions: number;
  conversion_rate: number;
  cost_per_acquisition: number;

  // Calculated scores
  desirability_score: number;  // 0-100
  confidence_level: string;    // low | medium | high

  // Time period
  collected_at: timestamp;
  period_start: timestamp;
  period_end: timestamp;
}
```

**Automated Insights:**
- Daily summary email to founder
- Anomaly detection (sudden drop/spike)
- Auto-pause recommendation if metrics poor
- Proceed recommendation if metrics strong

**Deliverable:** Evidence collector at `startupai-crew/src/services/evidence_collector.py`

**File:** `startupai-crew/src/services/evidence_collector.py`
**Related:** US-MT22 (EvidenceRecorderTool)

---

## Supporting Systems (US-AT11 - US-AT12)

### US-AT11: Unsplash Image Integration

**As a** template system,
**I want to** source images from Unsplash based on VPC context,
**So that** landing pages have professional stock photos at no cost.

**Acceptance Criteria:**

**Given** VPC data (customer profile, value proposition)
**When** image is needed for a template slot
**Then** relevant Unsplash images are suggested:

**Integration Details:**
| Aspect | Implementation |
|--------|----------------|
| API | Unsplash API (free tier: 50 req/hr) |
| Search | Keywords from VPC + template context |
| Selection | Top 3 by relevance, auto-select #1 |
| Caching | Store URLs in project state |
| Attribution | Required, auto-injected in footer |
| Fallback | Gradient backgrounds if no match |

**Search Query Construction:**
```python
def build_unsplash_query(vpc: VPC, slot: ImageSlot) -> str:
    # Combine VPC context with slot requirements
    industry = vpc.customer_profile.industry  # "fintech"
    mood = slot.mood  # "professional"
    subject = slot.subject_hint  # "person working"

    return f"{industry} {mood} {subject}"
    # → "fintech professional person working"
```

**File:** `startupai-crew/src/tools/images/unsplash.py`
**Cost:** FREE (with attribution)

---

### US-AT12: AI Image Generation On-Demand

**As a** template system,
**I want to** generate custom images via AI when stock photos are insufficient,
**So that** unique visuals can be created for specific needs.

**Acceptance Criteria:**

**Given** a slot requiring an image where Unsplash returns low-relevance results
**When** founder approves AI generation (HITL)
**Then** custom image is generated:

**Trigger Conditions:**
- Unsplash relevance score < 0.5
- Founder explicitly requests custom image
- Slot requires brand-specific imagery

**Generation Pipeline:**
```
VPC + Slot Context → Prompt Builder → DALL-E 3 API
                                           │
                                           ▼
                                    Image Generated
                                           │
                                           ▼
                                    Store in Supabase Storage
                                           │
                                           ▼
                                    Return public URL
```

**Prompt Template:**
```python
PROMPT_TEMPLATE = """
Create a {style} image for a {industry} landing page.
The image should convey: {value_proposition}
Target audience: {customer_segment}
Mood: {mood}
Composition: {composition}

Requirements:
- No text or logos
- Professional quality
- {aspect_ratio} aspect ratio
- Modern, clean aesthetic
"""
```

**Cost Control:**
- HITL approval required for each generation
- Max 3 generations per project
- Cost: ~$0.04/image (DALL-E 3)
- Running total shown to founder

**File:** `startupai-crew/src/tools/images/ai_generation.py`
**Cost:** ~$0.04/image (DALL-E 3)

---

## Implementation Dependencies

```
PHASE 1: SOURCING
─────────────────
US-AT01 (LP Template Procurement)
US-AT02 (Ad Template Procurement)
    │
    ▼

PHASE 2: STAGING
─────────────────
US-AT03 (Slot Extraction) ←── depends on AT01, AT02
US-AT04 (Template Registry) ←── depends on AT03
US-AT05 (Preview Environment) ←── depends on AT04
    │
    ▼

PHASE 3: VALIDATION
─────────────────
US-AT06 (LP Quality Gate) ←── depends on AT05
US-AT07 (Ad Compliance) ←── depends on AT02
    │
    ▼

PHASE 4: DEPLOYMENT
─────────────────
US-AT08 (LP Deployment) ←── depends on AT06
US-AT09 (Ad Submission) ←── depends on AT07
US-AT10 (Evidence Collection) ←── depends on AT08, AT09
    │
    ▼

SUPPORTING
─────────────────
US-AT11 (Unsplash) ←── used by AT03, AT05
US-AT12 (AI Images) ←── used by AT03, AT05 (fallback)
    │
    ▼

TOOLS (from mcp-tools.md)
─────────────────
US-MT20 (LandingPageGeneratorTool) ←── uses AT03, AT04, AT08
US-MT21 (AdCreativeGeneratorTool) ←── uses AT03, AT07, AT09
US-MT22 (EvidenceRecorderTool) ←── uses AT10
```

---

## Cost Summary

| Item | Type | Cost | Notes |
|------|------|------|-------|
| Tailwind UI templates | One-time | $299 | Or Cruip $149 |
| Canva Pro (ad templates) | Monthly | $12.99/mo | Cancel after setup |
| Netlify hosting | Per project | Free | 100 form submissions |
| Unsplash images | Per image | Free | With attribution |
| DALL-E 3 generation | Per image | $0.04 | Max 3 per project |
| Meta ads | Per campaign | Founder budget | $50/day cap default |
| Google ads | Per campaign | Founder budget | $50/day cap default |

**Total StartupAI infrastructure cost:** ~$350 one-time + $0.04 per AI image

---

## Cross-References

| Document | Relationship |
|----------|--------------|
| [tool-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/tool-specifications.md) | US-MT20, US-MT21, US-MT22 specs |
| [mcp-tools.md](./mcp-tools.md) | Tool stories that use templates |
| [phase-2-desirability.md](../agents/phase-2-desirability.md) | Agents that generate assets |
| [approval-workflows.md](../../../../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) | HITL checkpoints for asset approval |

---

**Last Updated**: 2026-01-26

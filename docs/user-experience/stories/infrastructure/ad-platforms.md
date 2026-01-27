---
purpose: "User stories for ad platform integration - Meta, Google, LinkedIn APIs"
status: "active"
last_reviewed: "2026-01-26"
last_updated: "2026-01-26"
---

# Ad Platform User Stories

Stories for implementing the ad platform integration pipeline with HITL approval workflow.

## Design Philosophy

**Copy Bank + Platform-Native Assembly**: Pre-compute all ad copy at VPC creation time (single LLM call), then let platforms assemble optimal creative combinations.

**Key Principles:**
1. **Zero inference for ad generation** - All copy pre-computed in Copy Bank
2. **Platform-native optimization** - Meta Flexible Ads / Google Responsive Ads create combinations
3. **HITL before spend** - Founder approves via preview before any money is spent
4. **Tiered image selection** - Exhaust free options before AI generation

**Platform Priority:**
| Platform | Priority | Rationale |
|----------|----------|-----------|
| Meta (Facebook/Instagram) | P0 | 3B+ users, best API, covers most validation needs |
| Google Ads | P1 | 2.5B users, good for search intent validation |
| LinkedIn | P2 | B2B focused, 900M professionals |
| TikTok | P3 | Future consideration |

---

## Phase 1: Asset Preparation (US-AP01 - US-AP02)

### US-AP01: Copy Bank Generator

**As a** StartupAI platform,
**I want to** pre-generate all ad copy variants at VPC creation time,
**So that** ad generation requires zero LLM inference.

**Acceptance Criteria:**

**Given** a VPC (Value Proposition Canvas) is created or updated
**When** the Copy Bank generator runs
**Then** the following copy elements are generated and stored:

**Copy Bank Schema:**
```typescript
interface CopyBank {
  project_id: string;
  generated_at: timestamp;
  vpc_version: number;           // Track which VPC version this was generated from

  // Headlines (platform-agnostic, truncate to platform limits later)
  headlines: {
    primary: string;             // "Stop Wasting Hours on Manual Data Entry"
    benefit: string;             // "Automate Your Workflow in Minutes"
    question: string;            // "Tired of Repetitive Tasks?"
    social: string;              // "Join 10,000+ Teams Who Automated"
    urgency: string;             // "Limited Beta Access Available"
  };

  // Primary text variants (longer form)
  primary_texts: {
    problem_solution: string;    // Pain → Solution narrative
    benefit_focused: string;     // Lead with gains
    social_proof: string;        // Credibility focused
    feature_list: string;        // Key capabilities
    urgency: string;             // Scarcity/time-limited
  };

  // Pain points extracted from VPC
  pains: string[];               // ["manual data entry", "error-prone processes", "wasted time"]

  // Gain creators extracted from VPC
  gains: string[];               // ["save 10 hours/week", "99.9% accuracy", "instant setup"]

  // Product descriptors
  product: {
    name: string;                // "DataFlow"
    category: string;            // "automation tool"
    differentiator: string;      // "AI-powered"
  };

  // Image search keywords (for Unsplash)
  image_keywords: string[];      // ["office productivity", "automation", "happy team"]

  // Pre-computed CTAs
  ctas: {
    primary: string;             // "Start Free Trial"
    secondary: string;           // "See How It Works"
    urgency: string;             // "Claim Your Spot"
    learn: string;               // "Learn More"
  };
}
```

**LLM Prompt Template:**
```
Given this Value Proposition Canvas:
- Customer Jobs: {vpc.customer_profile.jobs}
- Pains: {vpc.customer_profile.pains}
- Gains: {vpc.customer_profile.gains}
- Products/Services: {vpc.value_map.products_and_services}
- Pain Relievers: {vpc.value_map.pain_relievers}
- Gain Creators: {vpc.value_map.gain_creators}

Generate a Copy Bank with:
1. 5 headline variants (max 40 chars each)
2. 5 primary text variants (max 125 chars each)
3. Top 3 pain points as short phrases
4. Top 3 gains as short phrases
5. Product name, category, differentiator
6. 5 image search keywords
7. 4 CTA options

Output as JSON matching the CopyBank schema.
```

**Cost:** ~$0.02 per VPC (single LLM call)

**Storage:** `copy_banks` table in Supabase

**Trigger:**
- VPC created → Generate Copy Bank
- VPC updated → Regenerate Copy Bank (version incremented)

**File:** `startupai-crew/src/services/copy_bank_generator.py`
**Related:** US-MT20 (LandingPageGeneratorTool), US-MT21 (AdCreativeGeneratorTool)

---

### US-AP02: Tiered Image Selection Flow

**As a** Founder reviewing ad creatives,
**I want to** select and refine imagery through progressive tiers,
**So that** I can find the right visuals without unnecessary AI generation costs.

**Acceptance Criteria:**

**Tier 1: Selection Pool (Zero Cost)**

**Given** Copy Bank image keywords exist
**When** image selection begins
**Then** 12 Unsplash images are fetched and displayed

```typescript
interface Tier1Selection {
  images: UnsplashImage[];       // 12 options
  selected: string[];            // Founder's picks (3-5)
  action: 'select' | 'refine';   // Next step
}
```

**Tier 2: Structured Refinement (Zero Cost)**

**Given** Founder rejects all Tier 1 options
**When** "None of these work" is clicked
**Then** structured feedback form appears:

```yaml
# Feedback options that map to Unsplash query refinements
feedback_options:
  whats_wrong:
    - too_corporate:
        remove: ["business", "corporate", "suit"]
        add: ["casual", "startup", "creative"]
    - too_casual:
        remove: ["casual", "fun", "playful"]
        add: ["professional", "business", "polished"]
    - wrong_demographic:
        prompt: "What age group?" # Young/Middle/Senior
    - wrong_setting:
        prompt: "What setting?"   # Office/Outdoor/Home/Abstract
    - wrong_mood:
        prompt: "What mood?"      # Energetic/Calm/Serious/Friendly

  style_preferences:
    - modern | classic | bold | playful

  people_preference:
    - yes | no | abstract_only
```

**Tier 3: Reference-Based Search (~$0.01)**

**Given** Founder still unsatisfied after Tier 2
**When** Founder uploads a reference image
**Then** CLIP embedding finds similar Unsplash images

```python
async def find_similar_images(reference_image: bytes) -> list[UnsplashImage]:
    # Generate CLIP embedding for reference
    embedding = await clip.encode_image(reference_image)

    # Search Unsplash with derived keywords (or use embedding similarity)
    keywords = await describe_image(reference_image)  # Optional LLM call

    return await unsplash.search(keywords, count=12)
```

**Tier 4: AI Generation (~$0.12)**

**Given** Stock options exhausted
**When** Founder requests custom generation
**Then** cost approval is shown and images generated

```typescript
interface Tier4Request {
  description: string;           // Founder's description
  style: 'modern' | 'minimal' | 'bold' | 'playful';
  include_people: boolean;
  aspect_ratio: '1:1' | '16:9' | '9:16';
  cost_approved: boolean;        // Must be true to proceed
}

// Generate 3 images via DALL-E 3
// Cost: 3 × $0.04 = $0.12
```

**UI Flow:**
```
┌─────────────────────────────────────────────────────────────────┐
│  SELECT IMAGES FOR YOUR AD                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │  1  │ │  2  │ │  3  │ │  4  │ │  5  │ │  6  │              │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │  7  │ │  8  │ │  9  │ │ 10  │ │ 11  │ │ 12  │              │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │
│                                                                 │
│  Selected: 3/5                                                  │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ ✓ Use Selected   │  │ None of these    │                    │
│  │   (3 images)     │  │ work →           │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Expected Distribution:**
- 70% of Founders find images in Tier 1
- 20% need Tier 2 refinement
- 8% need Tier 3 reference search
- 2% need Tier 4 AI generation

**Average Cost:** ~$0.02 per Founder

**File:** `frontend/src/components/ads/ImageSelectionFlow.tsx`
**API:** `frontend/src/app/api/ads/images/route.ts`

---

## Phase 2: Platform Integration (US-AP03 - US-AP04)

### US-AP03: Meta Flexible Ads Integration

**As a** StartupAI platform,
**I want to** create Meta ad campaigns via the Marketing API,
**So that** Founders can validate desirability with real traffic.

**Acceptance Criteria:**

**Step 1: Create PAUSED Campaign**

**Given** Copy Bank and selected images exist
**When** ad submission is initiated
**Then** campaign is created with status PAUSED

```python
from facebook_business.adobjects.campaign import Campaign
from facebook_business.adobjects.adaccount import AdAccount

async def create_paused_campaign(
    ad_account_id: str,
    project_name: str,
    objective: str = "OUTCOME_TRAFFIC"
) -> Campaign:
    """Create a PAUSED campaign - no spend until activated"""

    account = AdAccount(f'act_{ad_account_id}')

    campaign = account.create_campaign(params={
        Campaign.Field.name: f"{project_name} - Validation",
        Campaign.Field.objective: objective,
        Campaign.Field.status: Campaign.Status.paused,  # KEY: PAUSED
        Campaign.Field.special_ad_categories: [],
    })

    return campaign
```

**Step 2: Create Ad Set with Targeting**

```python
async def create_ad_set(
    campaign_id: str,
    audience_template: AudienceTemplate,
    budget: Budget
) -> AdSet:
    """Create ad set with pre-built audience template"""

    ad_set = AdSet(parent_id=campaign_id)
    ad_set.update({
        AdSet.Field.name: "Validation Ad Set",
        AdSet.Field.campaign_id: campaign_id,
        AdSet.Field.billing_event: "IMPRESSIONS",
        AdSet.Field.optimization_goal: "LINK_CLICKS",
        AdSet.Field.daily_budget: budget.daily_cents,  # In cents
        AdSet.Field.targeting: audience_template.to_meta_targeting(),
        AdSet.Field.status: AdSet.Status.paused,
    })

    return ad_set.remote_create()
```

**Step 3: Create Flexible Ad Creative**

```python
async def create_flexible_ad_creative(
    ad_account_id: str,
    copy_bank: CopyBank,
    images: list[str],  # Image URLs
    landing_page_url: str
) -> AdCreative:
    """Create Flexible Ad with multiple assets - Meta tests combinations"""

    # Upload images and get hashes
    image_hashes = await upload_images(ad_account_id, images)

    creative = AdCreative(parent_id=f'act_{ad_account_id}')
    creative.update({
        AdCreative.Field.name: "Validation Creative",
        AdCreative.Field.asset_feed_spec: {
            # Up to 10 images - Meta creates carousel + single image variants
            "images": [{"hash": h} for h in image_hashes],

            # Up to 5 primary texts
            "bodies": [
                {"text": copy_bank.primary_texts.problem_solution},
                {"text": copy_bank.primary_texts.benefit_focused},
                {"text": copy_bank.primary_texts.social_proof},
            ],

            # Up to 5 headlines
            "titles": [
                {"text": copy_bank.headlines.primary[:40]},
                {"text": copy_bank.headlines.benefit[:40]},
                {"text": copy_bank.headlines.question[:40]},
            ],

            # Link destination
            "link_urls": [{"website_url": landing_page_url}],

            # CTAs
            "call_to_action_types": ["SIGN_UP", "LEARN_MORE"],
        },

        # Enable Advantage+ Creative enhancements
        AdCreative.Field.degrees_of_freedom_spec: {
            "creative_features_spec": {
                "standard_enhancements": {"enroll_status": "OPT_IN"}
            }
        },
    })

    return creative.remote_create()
```

**Step 4: Generate Previews**

```python
async def generate_previews(creative_id: str) -> list[AdPreview]:
    """Fetch preview images for HITL approval"""

    creative = AdCreative(creative_id)

    previews = []
    for ad_format in [
        "DESKTOP_FEED_STANDARD",
        "MOBILE_FEED_STANDARD",
        "INSTAGRAM_STANDARD",
        "INSTAGRAM_STORY",
    ]:
        preview = creative.get_previews(params={
            "ad_format": ad_format,
        })
        previews.append(AdPreview(
            format=ad_format,
            html=preview[0].get("body"),  # iFrame HTML
        ))

    return previews
```

**Budget Safety Limits:**
```yaml
budget_limits:
  max_daily_spend: 5000         # $50/day in cents
  max_lifetime_spend: 50000     # $500 lifetime in cents
  require_hitl_above: 10000     # Require approval for >$100
  auto_pause_cpa_multiplier: 2  # Pause if CPA > 2× target
```

**File:** `startupai-crew/src/services/meta_ads.py`
**Related:** US-AT09 (Ad Platform Submission)

---

### US-AP04: Ad Review Status Poller

**As a** StartupAI platform,
**I want to** poll Meta for ad review status,
**So that** I can update the HITL UI when ads are approved/rejected.

**Acceptance Criteria:**

**Given** an ad creative has been submitted
**When** review status is needed
**Then** effective_status field is polled

**Note:** Meta does NOT support webhooks for ad review status. Polling is required.

```python
from enum import Enum

class AdReviewStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ERROR = "error"

async def poll_ad_review_status(ad_id: str) -> AdReviewStatus:
    """Check ad review status via API polling"""

    ad = Ad(ad_id)
    ad.remote_read(fields=["effective_status", "issues_info"])

    status = ad.get("effective_status")

    match status:
        case "PENDING_REVIEW":
            return AdReviewStatus.PENDING
        case "ACTIVE" | "PAUSED":
            return AdReviewStatus.APPROVED
        case "DISAPPROVED":
            return AdReviewStatus.REJECTED
        case "WITH_ISSUES":
            return AdReviewStatus.ERROR
        case _:
            return AdReviewStatus.PENDING
```

**Polling Strategy:**

```python
async def monitor_ad_review(ad_id: str, project_id: str):
    """Background job to monitor ad review status"""

    poll_intervals = [
        (0, 60),      # First hour: every 1 minute
        (60, 300),    # Hours 1-5: every 5 minutes
        (300, 900),   # Hours 5-24: every 15 minutes
        (900, 3600),  # After 24h: every hour
    ]

    elapsed = 0
    while elapsed < 48 * 3600:  # Max 48 hours
        status = await poll_ad_review_status(ad_id)

        if status == AdReviewStatus.APPROVED:
            await update_hitl_checkpoint(project_id, "ad_review", "approved")
            await notify_founder(project_id, "Your ad has been approved!")
            return

        elif status == AdReviewStatus.REJECTED:
            issues = await get_rejection_reasons(ad_id)
            await update_hitl_checkpoint(project_id, "ad_review", "rejected", issues)
            await notify_founder(project_id, f"Ad rejected: {issues}")
            return

        # Calculate next poll interval
        interval = get_interval(elapsed, poll_intervals)
        await asyncio.sleep(interval)
        elapsed += interval

    # Timeout - escalate
    await escalate_stuck_review(project_id, ad_id)
```

**Rejection Handling:**

```python
async def get_rejection_reasons(ad_id: str) -> list[str]:
    """Fetch detailed rejection reasons"""

    ad = Ad(ad_id)
    ad.remote_read(fields=["issues_info"])

    issues = ad.get("issues_info", {})
    reasons = []

    for issue in issues.get("issues", []):
        reasons.append({
            "level": issue.get("level"),           # ERROR or WARNING
            "summary": issue.get("summary"),
            "details": issue.get("details"),
            "fix_suggestion": issue.get("fix_suggestion"),
        })

    return reasons
```

**File:** `startupai-crew/src/services/ad_review_poller.py`
**Cron:** `supabase/migrations/XXXX_ad_review_poll_cron.sql`

---

## Phase 3: HITL Approval (US-AP05)

### US-AP05: HITL Ad Preview UI

**As a** Founder,
**I want to** review and approve my ads before they go live,
**So that** I have control over what represents my brand.

**Acceptance Criteria:**

**HITL Checkpoint:** `ad_creative_review`

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AD APPROVAL - HITL CHECKPOINT                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Project: DataFlow Automation                                           │
│  Platform: Meta (Facebook + Instagram)                                  │
│  Landing Page: https://dataflow-validate.startupai.site                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        PREVIEWS                                  │   │
│  │                                                                  │   │
│  │  ┌─────────────────────┐    ┌─────────────────────┐            │   │
│  │  │   Facebook Feed     │    │  Instagram Stories   │            │   │
│  │  │                     │    │                      │            │   │
│  │  │   [Preview iFrame]  │    │  [Preview iFrame]    │            │   │
│  │  │                     │    │                      │            │   │
│  │  └─────────────────────┘    └─────────────────────┘            │   │
│  │                                                                  │   │
│  │  ◀ Mobile Feed    Desktop Feed    Instagram Feed    Reels ▶     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────┐   ┌────────────────────────────────┐     │
│  │         COPY             │   │           IMAGERY              │     │
│  │                          │   │                                │     │
│  │  Headlines (5):          │   │  Selected Images (5):          │     │
│  │  ✓ "Stop Wasting..."     │   │  ┌─────┐ ┌─────┐ ┌─────┐      │     │
│  │  ✓ "Automate Your..."    │   │  │ ✓   │ │ ✓   │ │ ✓   │      │     │
│  │  ✓ "Tired of..."         │   │  └─────┘ └─────┘ └─────┘      │     │
│  │                          │   │  ┌─────┐ ┌─────┐              │     │
│  │  Primary Texts (3):      │   │  │ ✓   │ │ ✓   │              │     │
│  │  ✓ "Manual data entry..."│   │  └─────┘ └─────┘              │     │
│  │  ✓ "Save 10 hours..."    │   │                                │     │
│  │  ✓ "Join 10,000+ teams"  │   │                                │     │
│  │                          │   │                                │     │
│  │  ┌──────────────────┐    │   │  ┌────────────────────────┐   │     │
│  │  │   ✏️ Edit Copy    │    │   │  │   🖼️ Change Images     │   │     │
│  │  └──────────────────┘    │   │  └────────────────────────┘   │     │
│  └──────────────────────────┘   └────────────────────────────────┘     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  BUDGET & TARGETING                                              │   │
│  │                                                                  │   │
│  │  Daily Budget: $50        Lifetime Cap: $350 (7 days)           │   │
│  │  Audience: Early Adopter SaaS Buyers (25-54, US)                │   │
│  │                                                                  │   │
│  │  ┌──────────────────┐   ┌────────────────────────┐              │   │
│  │  │  💰 Edit Budget   │   │  🎯 Edit Targeting     │              │   │
│  │  └──────────────────┘   └────────────────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  PLATFORM STATUS                                                 │   │
│  │                                                                  │   │
│  │  Meta Review: ⏳ Pending (estimated: 2-24 hours)                 │   │
│  │               Last checked: 2 minutes ago                        │   │
│  │                                                                  │   │
│  │  Note: You can approve now. Your ad will go live                 │   │
│  │        automatically when Meta completes their review.           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│      ┌───────────────────────────────┐    ┌────────────────────┐       │
│      │     ✅ Approve & Launch        │    │  💬 Request Changes │       │
│      │                               │    │                    │       │
│      │  When Meta approves, your     │    │  Edit copy, images,│       │
│      │  ads will start running.      │    │  or budget first.  │       │
│      └───────────────────────────────┘    └────────────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Edit Copy Flow:**

```typescript
interface EditCopyState {
  headlines: Array<{ text: string; enabled: boolean }>;
  primary_texts: Array<{ text: string; enabled: boolean }>;
  ctas: Array<{ type: string; enabled: boolean }>;
}

// Founder can:
// 1. Toggle individual copy variants on/off
// 2. Edit text directly (triggers Copy Bank update)
// 3. Request new variants (triggers LLM regeneration)
```

**Edit Images Flow:**

```
Click "Change Images" → Opens ImageSelectionFlow (US-AP02)
                      → Tier 1-4 selection process
                      → New images saved
                      → Previews regenerated
```

**Approval Logic:**

```typescript
async function handleApproval(projectId: string): Promise<void> {
  // 1. Check platform review status
  const reviewStatus = await getAdReviewStatus(projectId);

  if (reviewStatus === 'rejected') {
    // Show rejection reasons, cannot approve
    showRejectionDialog(reviewStatus.reasons);
    return;
  }

  // 2. Record Founder approval
  await recordHitlApproval(projectId, 'ad_creative_review', {
    approved_at: new Date(),
    approved_by: currentUser.id,
    copy_version: copyBank.version,
    images: selectedImages,
    budget: approvedBudget,
  });

  // 3. If platform already approved, activate immediately
  if (reviewStatus === 'approved') {
    await activateCampaign(projectId);
    showSuccess("Your ads are now live!");
  } else {
    // Platform review pending - queue for activation
    await queueForActivation(projectId);
    showSuccess("Approved! Ads will go live when Meta completes review.");
  }
}
```

**File:** `frontend/src/components/approvals/AdCreativeApproval.tsx`
**API:** `frontend/src/app/api/approvals/ad-creative/route.ts`
**Related:** US-AH (HITL Checkpoints)

---

## Phase 4: Evidence Collection (US-AP06)

### US-AP06: Ad Performance Evidence Collection

**As a** StartupAI platform,
**I want to** collect ad performance metrics automatically,
**So that** desirability evidence informs the validation decision.

**Acceptance Criteria:**

**Given** ads are running on Meta
**When** performance data is available
**Then** metrics are collected and stored as evidence

**Metrics Collected:**

```typescript
interface AdPerformanceMetrics {
  // Identifiers
  project_id: string;
  campaign_id: string;
  ad_set_id: string;

  // Period
  date: string;                  // YYYY-MM-DD
  collected_at: timestamp;

  // Reach metrics
  impressions: number;
  reach: number;                 // Unique users
  frequency: number;             // Avg impressions per user

  // Engagement metrics
  clicks: number;
  ctr: number;                   // Click-through rate
  unique_clicks: number;

  // Cost metrics
  spend: number;                 // In cents
  cpc: number;                   // Cost per click
  cpm: number;                   // Cost per 1000 impressions

  // Conversion metrics (from landing page)
  landing_page_views: number;
  form_submissions: number;
  conversion_rate: number;
  cost_per_conversion: number;

  // Calculated scores
  desirability_score: number;    // 0-100, based on conversion rate benchmarks
  confidence_level: 'low' | 'medium' | 'high';
}
```

**Collection Schedule:**

```python
# Poll insights API every 6 hours
COLLECTION_SCHEDULE = "0 */6 * * *"  # Cron: every 6 hours

async def collect_ad_metrics(project_id: str):
    """Fetch latest metrics from Meta Insights API"""

    campaign = await get_campaign(project_id)

    insights = campaign.get_insights(params={
        "fields": [
            "impressions",
            "reach",
            "frequency",
            "clicks",
            "unique_clicks",
            "ctr",
            "spend",
            "cpc",
            "cpm",
            "actions",  # Includes conversions
        ],
        "date_preset": "last_7d",
        "time_increment": 1,  # Daily breakdown
    })

    for day in insights:
        metrics = parse_insights(day)
        await store_metrics(project_id, metrics)

    # Calculate running totals and scores
    await update_desirability_evidence(project_id)
```

**Desirability Score Calculation:**

```python
def calculate_desirability_score(metrics: AdPerformanceMetrics) -> int:
    """
    Score based on conversion rate vs industry benchmarks.

    Benchmarks (B2B SaaS landing pages):
    - Poor: < 2% conversion
    - Average: 2-5% conversion
    - Good: 5-10% conversion
    - Excellent: > 10% conversion
    """

    if metrics.conversion_rate >= 0.10:
        base_score = 90
    elif metrics.conversion_rate >= 0.05:
        base_score = 70
    elif metrics.conversion_rate >= 0.02:
        base_score = 50
    else:
        base_score = 30

    # Adjust for statistical significance
    if metrics.clicks < 100:
        confidence = 'low'
        adjustment = -10
    elif metrics.clicks < 500:
        confidence = 'medium'
        adjustment = 0
    else:
        confidence = 'high'
        adjustment = 5

    return min(100, max(0, base_score + adjustment)), confidence
```

**Daily Summary Notification:**

```python
async def send_daily_summary(project_id: str):
    """Send daily performance summary to Founder"""

    metrics = await get_daily_metrics(project_id)

    summary = f"""
    📊 Daily Ad Performance - {metrics.date}

    Reach: {metrics.reach:,} people
    Clicks: {metrics.clicks:,} ({metrics.ctr:.2f}% CTR)
    Conversions: {metrics.form_submissions}

    Spend: ${metrics.spend/100:.2f}
    Cost per conversion: ${metrics.cost_per_conversion/100:.2f}

    Desirability Score: {metrics.desirability_score}/100 ({metrics.confidence_level} confidence)
    """

    await notify_founder(project_id, summary)
```

**Auto-Pause Rules:**

```python
async def check_auto_pause_rules(project_id: str, metrics: AdPerformanceMetrics):
    """Pause campaign if performance is poor to protect budget"""

    rules = await get_budget_rules(project_id)

    # Rule 1: CPA too high
    if metrics.cost_per_conversion > rules.max_cpa * 2:
        await pause_campaign(project_id, reason="CPA exceeds 2× target")
        await notify_founder(project_id, "Campaign paused: CPA too high")
        return

    # Rule 2: Lifetime budget exhausted
    total_spend = await get_total_spend(project_id)
    if total_spend >= rules.lifetime_budget:
        await pause_campaign(project_id, reason="Lifetime budget reached")
        await notify_founder(project_id, "Campaign completed: Budget spent")
        return

    # Rule 3: CTR critically low (ad fatigue or poor targeting)
    if metrics.ctr < 0.005 and metrics.impressions > 10000:  # < 0.5% CTR
        await notify_founder(project_id, "Warning: Low CTR, consider refreshing creative")
```

**File:** `startupai-crew/src/services/evidence_collector.py`
**Cron:** `supabase/migrations/XXXX_ad_metrics_collection_cron.sql`
**Table:** `ad_performance_metrics`
**Related:** US-MT22 (EvidenceRecorderTool)

---

## Phase 5: Future Platforms (US-AP07 - US-AP08)

### US-AP07: Google Responsive Display Ads (P1)

**As a** StartupAI platform,
**I want to** support Google Ads for search intent validation,
**So that** Founders can test demand from active searchers.

**Status:** Planned (P1 priority - after Meta integration stable)

**Key Differences from Meta:**

| Aspect | Meta | Google |
|--------|------|--------|
| Ad Type | Flexible Ads | Responsive Display Ads |
| Assets | 10 images, 5 texts | 15 headlines, 5 descriptions, 15 images |
| ML Optimization | Advantage+ Creative | Smart Bidding + Auto-generated combinations |
| Preview | generatePreviews API | Preview in Ads Manager |
| Review Time | 24-48 hours | Usually < 1 business day |

**API Reference:**
- Campaign creation: `POST /customers/{customer_id}/campaigns:mutate`
- Asset upload: `POST /customers/{customer_id}/assets:mutate`
- Responsive Display: `ResponsiveDisplayAdInfo` in AdGroupAd

**Acceptance Criteria:**
- Same HITL flow as Meta (PAUSED → Preview → Approve → Activate)
- Same Copy Bank used (different truncation for Google limits)
- Same evidence collection (Google Ads API insights)

**File:** `startupai-crew/src/services/google_ads.py` (Planned)

---

### US-AP08: LinkedIn Marketing Ads (P2)

**As a** StartupAI platform,
**I want to** support LinkedIn Ads for B2B validation,
**So that** Founders targeting professionals can validate desirability.

**Status:** Planned (P2 priority - for B2B use cases)

**Key Differences from Meta:**

| Aspect | Meta | LinkedIn |
|--------|------|----------|
| Audience | General consumer | Professional/B2B |
| Ad Preview | generatePreviews | Ad Preview API (iFrame) |
| Creative Types | Flexible | Single Image, Carousel, Document |
| Targeting | Interests/behaviors | Job titles, industries, skills |
| Min Budget | ~$1/day | ~$10/day |

**API Reference:**
- Campaign creation: `POST /adAccounts/{id}/adCampaignGroups`
- Creative: `POST /adAccounts/{id}/creatives`
- Preview: `GET /adPreviews?q=creative&creative={urn}`

**Acceptance Criteria:**
- LinkedIn Ad Preview API for HITL (returns iFrame, valid 3 hours)
- Same Copy Bank used (different constraints for LinkedIn)
- B2B-focused audience templates

**File:** `startupai-crew/src/services/linkedin_ads.py` (Planned)

---

## Implementation Dependencies

```
ASSET PREPARATION
─────────────────
US-AP01 (Copy Bank) ←── Generated at VPC creation
US-AP02 (Image Selection) ←── Used during ad creation
    │
    ▼

PLATFORM INTEGRATION
────────────────────
US-AP03 (Meta Flexible Ads) ←── Uses AP01 + AP02
US-AP04 (Review Poller) ←── Monitors AP03 submissions
    │
    ▼

HITL APPROVAL
─────────────
US-AP05 (Preview UI) ←── Shows AP03 previews, uses AP04 status
    │
    ▼

EVIDENCE COLLECTION
───────────────────
US-AP06 (Metrics Collection) ←── After AP05 approval
    │
    ▼

FUTURE PLATFORMS
────────────────
US-AP07 (Google) ←── Same pattern as AP03-AP06
US-AP08 (LinkedIn) ←── Same pattern as AP03-AP06
```

---

## Cost Summary

| Item | Cost | When |
|------|------|------|
| Copy Bank generation | ~$0.02 | Per VPC creation |
| Image selection (Tier 1-2) | $0 | Most Founders |
| Image selection (Tier 3) | ~$0.01 | ~8% of Founders |
| Image selection (Tier 4 AI) | ~$0.12 | ~2% of Founders |
| Meta API calls | $0 | Free (rate limited) |
| Ad spend | Founder budget | $50/day default cap |

**Platform Cost to StartupAI:** ~$0.03 per Founder ad campaign
**Founder Cost:** Their chosen ad budget (with safety caps)

---

## Cross-References

| Document | Relationship |
|----------|--------------|
| [asset-templates.md](./asset-templates.md) | US-AT08-AT10 (Landing page deployment feeds ad destination) |
| [mcp-tools.md](./mcp-tools.md) | US-MT20, US-MT21, US-MT22 (Tools that use this pipeline) |
| [phase-2-desirability.md](../agents/phase-2-desirability.md) | Agents that orchestrate ad creation |
| [approval-workflows.md](../../../../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) | ad_creative_review checkpoint |

---

**Last Updated**: 2026-01-26

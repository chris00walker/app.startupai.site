---
purpose: "User stories for asset template and blueprint pattern implementation"
status: "active"
last_reviewed: "2026-01-26"
last_updated: "2026-01-26"
---

# Asset Template User Stories

Stories for implementing the Blueprint Pattern and template systems for asset generation.

## Design Philosophy

**Assembly, Not Generation**: LLMs generate copy/messaging; templates provide structure/design.

Benefits:
- Consistent, professional designs
- Faster generation (no layout decisions)
- Platform-compliant outputs
- Predictable quality

---

## Landing Page Blueprint (US-AT01 - US-AT05)

### US-AT01: Component Registry System

**As a** LandingPageGeneratorTool,
**I want to** access a registry of pre-built page sections,
**So that** I can assemble landing pages by composition.

**Acceptance Criteria:**

**Given** the Component Registry is initialized
**When** a tool requests available components
**Then** list of 15 section types with schemas is returned:
- Hero (headline, subhead, CTA, background)
- Features (3-6 feature cards with icons)
- Benefits (problem → solution format)
- Social Proof (testimonials, logos, stats)
- Pricing (tier cards, comparison table)
- FAQ (accordion format)
- CTA (full-width call-to-action)
- Footer (links, legal, contact)
- Header (nav, logo, CTA button)
- Video (embed with poster)
- Stats (3-4 key metrics)
- Team (founders/team photos)
- Timeline (process/roadmap)
- Comparison (us vs them table)
- Form (lead capture)

**Schema per component:**
```typescript
interface ComponentSpec {
  type: string;
  slots: string[];        // Copy slots LLM fills
  requiredData: string[]; // VPC fields needed
  variants: string[];     // Design variants
  responsive: boolean;
}
```

**File:** `startupai-crew/src/tools/templates/registry.py`
**Related:** US-MT20

---

### US-AT02: Hero Section Template

**As a** LandingPageGeneratorTool,
**I want to** use hero section templates,
**So that** landing pages have compelling above-the-fold content.

**Acceptance Criteria:**

**Given** VPC value proposition data
**When** hero component is assembled
**Then** headline is derived from primary gain creator
**And** subheadline addresses primary pain point
**And** CTA text is action-oriented
**And** background supports visual hierarchy

**Variants:**
- `hero-centered`: Centered text, full-width background
- `hero-split`: Image right, text left
- `hero-video`: Background video with overlay
- `hero-gradient`: Gradient background, no image

**Slots:**
- `headline` (max 10 words)
- `subheadline` (max 25 words)
- `cta_text` (max 4 words)
- `cta_url`
- `background_image` (Unsplash query or URL)

**File:** `startupai-crew/src/tools/templates/components/hero.py`

---

### US-AT03: Features Section Template

**As a** LandingPageGeneratorTool,
**I want to** use features section templates,
**So that** landing pages highlight key capabilities.

**Acceptance Criteria:**

**Given** VPC products_and_services data
**When** features component is assembled
**Then** 3-6 feature cards are generated
**And** each card has icon, title, description
**And** layout adapts to feature count

**Variants:**
- `features-grid`: 2x3 or 3x2 card grid
- `features-list`: Vertical list with icons
- `features-alternating`: Icon alternates left/right

**Slots per feature:**
- `icon` (Lucide icon name)
- `title` (max 5 words)
- `description` (max 20 words)

**File:** `startupai-crew/src/tools/templates/components/features.py`

---

### US-AT04: Social Proof Section Template

**As a** LandingPageGeneratorTool,
**I want to** use social proof templates,
**So that** landing pages build credibility.

**Acceptance Criteria:**

**Given** testimonials or credibility data (if available)
**When** social proof component is assembled
**Then** appropriate variant is selected based on available data

**Variants:**
- `proof-testimonials`: Quote cards with photos
- `proof-logos`: Logo bar of trusted brands
- `proof-stats`: 3-4 impressive metrics
- `proof-combined`: Mix of above

**Slots:**
- `testimonials[].quote` (max 50 words)
- `testimonials[].author`
- `testimonials[].role`
- `testimonials[].photo_url`
- `logos[].name`
- `logos[].url`
- `stats[].value`
- `stats[].label`

**Placeholder Strategy:** If no real testimonials, use "Join X early adopters" format

**File:** `startupai-crew/src/tools/templates/components/social-proof.py`

---

### US-AT05: CTA and Pricing Section Templates

**As a** LandingPageGeneratorTool,
**I want to** use CTA and pricing templates,
**So that** landing pages drive conversions.

**Acceptance Criteria:**

**Given** desired action and pricing model (if applicable)
**When** CTA/pricing component is assembled
**Then** compelling call-to-action is generated
**And** pricing tiers are clearly displayed (if applicable)

**CTA Variants:**
- `cta-simple`: Headline + button
- `cta-form`: Inline email capture
- `cta-urgency`: With countdown or limited spots

**Pricing Variants:**
- `pricing-tiers`: 2-4 tier cards
- `pricing-comparison`: Feature comparison table
- `pricing-simple`: Single price point

**CTA Slots:**
- `headline` (max 8 words)
- `button_text` (max 4 words)
- `button_url`
- `urgency_text` (optional, max 10 words)

**Pricing Slots:**
- `tiers[].name`
- `tiers[].price`
- `tiers[].period` (monthly/yearly/once)
- `tiers[].features[]`
- `tiers[].cta_text`
- `tiers[].highlighted` (boolean)

**File:** `startupai-crew/src/tools/templates/components/cta.py`, `pricing.py`

---

## Ad Creative Templates (US-AT06 - US-AT08)

### US-AT06: Platform Constraint Library

**As an** AdCreativeGeneratorTool,
**I want to** load platform-specific constraints,
**So that** generated ads comply with platform requirements.

**Acceptance Criteria:**

**Given** a target platform (meta, google, linkedin, tiktok)
**When** constraint library is loaded
**Then** all format specifications are available:

**Meta (Facebook/Instagram):**
- Primary text: 125 chars (optimal), 500 max
- Headline: 27 chars (optimal), 40 max
- Description: 27 chars
- Image: 1080x1080 (feed), 1080x1920 (stories)
- Video: 15-60 sec, <4GB

**Google Ads:**
- Headlines: 30 chars each, 3-15 headlines
- Descriptions: 90 chars each, 2-4 descriptions
- Display: 300x250, 336x280, 728x90, 300x600
- Responsive: multiple assets combined

**LinkedIn:**
- Intro text: 150 chars (optimal), 600 max
- Headline: 70 chars max
- Image: 1200x627
- Carousel: 2-10 cards

**TikTok:**
- Text: 100 chars max
- Video: 9:16, 5-60 sec
- Hashtags: 3-5 recommended

**File:** `startupai-crew/src/tools/templates/ad-constraints.yaml`
**Related:** US-MT21

---

### US-AT07: Ad Copy Template System

**As an** AdCreativeGeneratorTool,
**I want to** use copy templates with character limits,
**So that** generated ads fit platform requirements.

**Acceptance Criteria:**

**Given** VPC data and target platform
**When** ad copy is generated
**Then** copy fits within character limits
**And** multiple variants are generated for A/B testing
**And** copy follows platform best practices

**Copy Formulas:**
- `problem-agitate-solve`: Pain → Amplify → Solution
- `benefit-proof-cta`: Benefit → Evidence → Action
- `question-answer`: Question hook → Answer with CTA
- `social-proof`: Testimonial/stat → CTA
- `urgency`: Limited time/spots → CTA

**Slots per variant:**
- `primary_text` (within platform limit)
- `headline` (within platform limit)
- `description` (within platform limit)
- `cta_type` (learn_more, sign_up, shop_now, etc.)

**Output:** 3-5 copy variants per ad set

**File:** `startupai-crew/src/tools/templates/ad-copy.py`

---

### US-AT08: Ad Image Specification System

**As an** AdCreativeGeneratorTool,
**I want to** specify image requirements per platform,
**So that** creative assets are properly sized.

**Acceptance Criteria:**

**Given** target platform and ad format
**When** image spec is generated
**Then** dimensions, aspect ratio, and format are specified
**And** text overlay limits are enforced (Meta 20% rule)
**And** safe zones are defined

**Image Spec Output:**
```typescript
interface ImageSpec {
  width: number;
  height: number;
  aspectRatio: string;
  format: 'jpg' | 'png' | 'gif';
  maxFileSize: string;
  textOverlayLimit: number;  // percentage
  safeZone: { top: number; bottom: number; left: number; right: number };
  unsplashQuery: string;     // suggested search
  aiPrompt?: string;         // for AI generation
}
```

**File:** `startupai-crew/src/tools/templates/ad-images.py`

---

## Image Resolution System (US-AT09 - US-AT10)

### US-AT09: Unsplash Integration

**As a** template system,
**I want to** source images from Unsplash,
**So that** landing pages and ads have professional stock photos for free.

**Acceptance Criteria:**

**Given** a search query derived from VPC data
**When** Unsplash API is called
**Then** relevant, high-quality images are returned
**And** proper attribution is included
**And** images are cached for reuse

**Integration:**
- API: Unsplash API (50 requests/hour free)
- Search: Keyword-based from VPC context
- Selection: Top 3 results by relevance
- Caching: Store URLs in project state

**File:** `startupai-crew/src/tools/images/unsplash.py`
**Cost:** FREE (with attribution)

---

### US-AT10: AI Image Generation On-Demand

**As a** template system,
**I want to** generate custom images via AI,
**So that** unique visuals can be created when stock photos are insufficient.

**Acceptance Criteria:**

**Given** an image generation request
**When** AI generation is triggered
**Then** prompt is constructed from VPC context
**And** image is generated via DALL-E or Midjourney API
**And** result is stored for reuse

**Trigger Conditions:**
- User explicitly requests custom image
- Stock photos score low relevance
- Brand-specific imagery needed

**Prompt Construction:**
- Style: Modern, professional, tech-forward
- Subject: Derived from VPC customer profile
- Composition: Based on component requirements
- Negative: No text, no logos, no faces (optional)

**File:** `startupai-crew/src/tools/images/ai-generation.py`
**Cost:** ~$0.04/image (DALL-E 3)

---

## Implementation Dependencies

```
US-AT01 (Registry)
    ├── US-AT02 (Hero)
    ├── US-AT03 (Features)
    ├── US-AT04 (Social Proof)
    └── US-AT05 (CTA/Pricing)
            │
            └── US-MT20 (LandingPageGeneratorTool)

US-AT06 (Constraints)
    ├── US-AT07 (Ad Copy)
    └── US-AT08 (Ad Images)
            │
            └── US-MT21 (AdCreativeGeneratorTool)

US-AT09 (Unsplash)
US-AT10 (AI Images)
    │
    └── US-MT20, US-MT21 (Image sourcing)
```

---

## Cross-References

| Document | Relationship |
|----------|--------------|
| [tool-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/tool-specifications.md) | US-MT20, US-MT21 specs |
| [mcp-tools.md](./mcp-tools.md) | Tool stories that use templates |
| [phase-2-desirability.md](../agents/phase-2-desirability.md) | Agents that generate assets |

---

**Last Updated**: 2026-01-26

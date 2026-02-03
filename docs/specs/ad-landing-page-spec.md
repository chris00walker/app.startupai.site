# Ad Landing Page Specification

**Purpose:** Lead capture page for social media ad campaigns
**Target:** Prospective founders clicking CTAs from Meta/LinkedIn/X ads
**Goal:** Capture name + email for waitlist/trial signup
**Design System:** Consistent with startupai.site marketing site

---

## Page Overview

| Attribute | Value |
|-----------|-------|
| **Page Type** | Single-page lead capture |
| **Primary Action** | Submit name + email form |
| **Secondary Action** | Learn more (scroll or link) |
| **Load Time Target** | < 2 seconds |
| **Mobile-First** | Yes |

---

## Design Tokens

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| **Primary** | `#3B82F6` (Blue-500) | CTAs, links, accents |
| **Primary Dark** | `#2563EB` (Blue-600) | Hover states |
| **Background** | `#FFFFFF` | Page background |
| **Background Gradient** | `slate-50 → blue-50 → indigo-50` | Hero section |
| **Text Primary** | `#0F172A` (Slate-900) | Headlines |
| **Text Secondary** | `#64748B` (Slate-500) | Body text, descriptions |
| **Text Muted** | `#94A3B8` (Slate-400) | Helper text |
| **Success** | `#16A34A` (Green-600) | Form success |
| **Error** | `#DC2626` (Red-600) | Form errors |

### Typography

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| **Headline (H1)** | Inter | 48px (desktop) / 32px (mobile) | Bold (700) | 1.1 |
| **Subheadline** | Inter | 20px (desktop) / 18px (mobile) | Regular (400) | 1.5 |
| **Body** | Inter | 16px | Regular (400) | 1.75 |
| **Button Text** | Inter | 16px | Semibold (600) | 1 |
| **Form Label** | Inter | 14px | Medium (500) | 1.5 |
| **Helper Text** | Inter | 12px | Regular (400) | 1.5 |

### Spacing

| Token | Value |
|-------|-------|
| **Section Padding** | 64px (desktop) / 48px (mobile) |
| **Card Padding** | 24px |
| **Form Gap** | 16px |
| **Button Padding** | 12px 32px |

### Border Radius

| Element | Radius |
|---------|--------|
| **Buttons** | 8px |
| **Inputs** | 8px |
| **Cards** | 12px |
| **Badges** | 6px |

---

## Page Structure

### 1. Hero Section (Above the Fold)

**Layout:** Full-width, centered content
**Background:** Gradient from slate-50 via blue-50 to indigo-50
**Overlay:** Subtle animated geometric shapes at 5-10% opacity

#### Components:

**A. Badge (Top)**
```
[Sparkles Icon] Limited Beta - Only 200 Spots Left
```
- Background: `#F1F5F9` (Slate-100)
- Text: `#475569` (Slate-600)
- Icon: Sparkles, 12px, primary color
- Padding: 6px 12px
- Border radius: 6px

**B. Headline**
```
Stop Guessing.
Start Validating.
```
- Two lines, centered
- "Validating" in gradient text (primary → primary/70%)
- Max-width: 600px

**C. Subheadline**
```
Our AI co-founder validates your startup idea in 2 weeks—
not 6 months. Get market research, competitor analysis,
and a go/no-go recommendation backed by real evidence.
```
- Text color: Slate-500
- Max-width: 540px
- Centered

**D. Lead Capture Form**
```
┌─────────────────────────────────────────────────────────┐
│  [First Name Input]  [Email Input]  [Get Early Access] │
└─────────────────────────────────────────────────────────┘
```

**Form Specifications:**

| Field | Type | Placeholder | Width |
|-------|------|-------------|-------|
| First Name | text | "First name" | 160px |
| Email | email | "you@company.com" | 240px |
| Submit | button | "Get Early Access →" | auto |

- Layout: Horizontal on desktop, stacked on mobile
- Input height: 48px
- Input border: 1px solid `#E2E8F0` (Slate-200)
- Input focus: 2px ring primary color
- Button: Primary filled, white text, arrow icon
- Button hover: Darken to Blue-600, slight lift (translateY -2px)

**E. Trust Indicators (Below Form)**
```
✓ No credit card required  ·  ✓ 30-day free trial  ·  ✓ Cancel anytime
```
- Text: Slate-400, 14px
- Checkmarks: Primary color
- Separator: Middle dot (·)

---

### 2. Social Proof Strip

**Layout:** Full-width, light background (`#F8FAFC`)
**Padding:** 24px vertical

```
"StartupAI saved us 3 months of market research"
— Sarah Chen, Founder @ TechFlow (YC W24)
```

- Quote: Italic, 18px, Slate-700
- Attribution: Regular, 14px, Slate-500
- Optional: Small avatar (32px circle) or company logo

---

### 3. Value Proposition Cards

**Layout:** 3-column grid (desktop), single column (mobile)
**Background:** White
**Card Style:** Elevated with subtle shadow, hover lift effect

#### Card 1: Speed
```
┌────────────────────────────┐
│     [Zap Icon - Blue]      │
│                            │
│   2 Weeks, Not 6 Months    │
│                            │
│  Get a complete validation │
│  report while competitors  │
│  are still writing surveys │
└────────────────────────────┘
```

#### Card 2: Evidence
```
┌────────────────────────────┐
│   [BarChart Icon - Blue]   │
│                            │
│    Real Data, Not Hunches  │
│                            │
│  AI analyzes 1000+ data    │
│  points from competitors,  │
│  reviews, and market trends│
└────────────────────────────┘
```

#### Card 3: Clarity
```
┌────────────────────────────┐
│  [Target Icon - Blue]      │
│                            │
│    Go/No-Go Confidence     │
│                            │
│  Clear recommendation with │
│  evidence score so you can │
│  decide with confidence    │
└────────────────────────────┘
```

**Card Specifications:**
- Padding: 32px
- Border: 1px solid `#E2E8F0`
- Shadow: `0 4px 6px -1px rgba(0,0,0,0.1)`
- Hover shadow: `0 10px 15px -3px rgba(0,0,0,0.1)`
- Hover transform: `translateY(-4px)`
- Icon container: 48px circle, `#EFF6FF` background, primary icon
- Title: 20px, Bold, Slate-900
- Description: 16px, Regular, Slate-500

---

### 4. How It Works

**Layout:** Horizontal timeline (desktop), vertical steps (mobile)
**Background:** Gradient (same as hero, subtle)

```
   [1]              [2]              [3]
    ●───────────────●───────────────●

 Describe        AI Validates      Get Your
 Your Idea       Your Market       Report

 30 seconds      2 weeks           Actionable
                 of AI research    insights
```

**Step Specifications:**
- Number circle: 40px, Primary background, white text
- Connector line: 2px, Slate-200, dashed
- Title: 18px, Semibold, Slate-900
- Subtitle: 14px, Regular, Slate-500

---

### 5. Final CTA Section

**Layout:** Centered card on gradient background
**Card:** White, elevated, max-width 560px

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│          Ready to validate your startup idea?           │
│                                                         │
│    Join 500+ founders who stopped guessing and          │
│    started building with confidence.                    │
│                                                         │
│    [First Name]  [Email]  [Start Free Trial →]          │
│                                                         │
│    ✓ No credit card  ·  ✓ 30-day trial  ·  ✓ Cancel    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- Same form as hero (duplicated for conversion)
- Card padding: 48px
- Card shadow: Large (`shadow-2xl`)
- Background behind card: Blue-50 to Indigo-50 gradient

---

### 6. Minimal Footer

**Layout:** Single line, centered
**Background:** White
**Padding:** 24px

```
© 2026 StartupAI  ·  Privacy Policy  ·  Terms
```

- Text: 14px, Slate-400
- Links: Underline on hover, Slate-500

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| **Mobile** | < 640px | Single column, stacked form, vertical timeline |
| **Tablet** | 640-1024px | 2-column cards, horizontal form |
| **Desktop** | > 1024px | 3-column cards, full layout |

---

## Form Behavior

### States

| State | Visual |
|-------|--------|
| **Default** | Gray border, white background |
| **Focus** | Primary ring (2px), white background |
| **Error** | Red border, light red background, error message below |
| **Success** | Form replaced with success message + checkmark animation |

### Validation

| Field | Rules | Error Message |
|-------|-------|---------------|
| First Name | Required, min 2 chars | "Please enter your name" |
| Email | Required, valid email format | "Please enter a valid email" |

### Success State

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              [Animated Checkmark - Green]               │
│                                                         │
│               You're on the list!                       │
│                                                         │
│         Check your inbox for next steps.                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Animations

| Element | Animation | Duration | Trigger |
|---------|-----------|----------|---------|
| **Hero badges** | Fade in + slide up | 400ms | Page load |
| **Headline** | Fade in + slide up | 500ms | Page load (100ms delay) |
| **Form** | Fade in + slide up | 600ms | Page load (200ms delay) |
| **Cards** | Fade in + slide up | 400ms | Scroll into view |
| **Card hover** | Lift + shadow | 200ms | Mouse enter |
| **Button hover** | Lift + darken | 150ms | Mouse enter |
| **Success checkmark** | Scale + draw | 500ms | Form submit |

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| **Color contrast** | All text meets WCAG AA (4.5:1 minimum) |
| **Focus states** | Visible ring on all interactive elements |
| **Form labels** | Explicit labels or aria-label on all inputs |
| **Button text** | Descriptive (not just "Submit") |
| **Keyboard nav** | Full tab navigation support |
| **Screen reader** | Proper heading hierarchy (H1 → H2 → H3) |

---

## UTM Tracking

The page should preserve UTM parameters for analytics:

```
?utm_source=meta
&utm_medium=paid
&utm_campaign=founder_validation
&utm_content=video_ad_v1
```

Include hidden fields in form to capture:
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `landing_page_variant`

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| **First Contentful Paint** | < 1.5s |
| **Largest Contentful Paint** | < 2.5s |
| **Cumulative Layout Shift** | < 0.1 |
| **Total Page Weight** | < 500KB |
| **Images** | WebP format, lazy load below fold |

---

## Copy Variants (A/B Testing)

### Headline Variants

| Variant | Copy |
|---------|------|
| A (Default) | "Stop Guessing. Start Validating." |
| B | "Validate Your Startup Idea in 2 Weeks" |
| C | "Your AI Co-Founder for Startup Validation" |

### CTA Variants

| Variant | Copy |
|---------|------|
| A (Default) | "Get Early Access →" |
| B | "Start Free Trial →" |
| C | "Validate My Idea →" |

---

## Figma Make Prompt Summary

**Create a modern SaaS landing page with:**

1. **Hero section** with gradient background (slate-50 to blue-50 to indigo-50), centered layout, bold headline with gradient text accent, subheadline, and inline form (name + email + button)

2. **Trust indicators** below form showing "No credit card required", "30-day free trial", "Cancel anytime" with checkmarks

3. **Social proof strip** with a customer quote and attribution

4. **3-column feature cards** with icons, titles, and descriptions - elevated style with hover lift effect

5. **3-step horizontal timeline** showing the process: Describe → AI Validates → Get Report

6. **Final CTA section** with centered white card on gradient background, repeating the lead capture form

7. **Minimal footer** with copyright and legal links

**Style:** Clean, professional, tech-forward. Blue primary color (#3B82F6). Inter font family. Generous whitespace. Subtle animations. Mobile-responsive.

**Goal:** Capture first name and email from founders who clicked a social media ad about startup validation.

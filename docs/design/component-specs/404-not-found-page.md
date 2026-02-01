# Component Specification: 404 Not Found Page

**Story**: US-UX01
**Status**: Implemented
**Last Updated**: 2026-01-30
**Designer**: UI Designer Agent

---

## Overview

Centered error page with branded illustration and clear navigation back home. Uses atmospheric design patterns consistent with the onboarding experience.

## Figma Reference

| Property | Value |
|----------|-------|
| File | [StartupAI Design System](https://www.figma.com/design/4yEXWnVK7tFJQzLKvIcsWo/StartupAI-Design-System) |
| Section | Page Illustrations |
| Illustration Node | `25:3` (Illustrations/404-Compass) |
| Asset ID | `fedb30aa-a517-42fa-96e2-b8337e02708b` |

---

## Component Hierarchy

```
Page Container (min-h-screen, flex, items-center, justify-center)
│
├── Atmospheric Background Layer (absolute, inset-0)
│   ├── Gradient Overlay
│   │   └── bg-gradient-to-br from-primary/[0.02] via-background to-accent/[0.02]
│   └── Grid Pattern
│       └── bg-grid-pattern opacity-[0.02]
│
└── Content Container (relative, z-10, max-w-lg, text-center)
    │
    ├── Illustration Container (mb-8, reveal-1)
    │   └── Next.js Image
    │       ├── src: Supabase storage URL
    │       ├── alt: "Compass illustration representing navigation..."
    │       └── Responsive sizing (see breakpoints)
    │
    ├── Heading (h1, reveal-2)
    │   └── "404 - Page Not Found"
    │
    ├── Body Text (p, reveal-3)
    │   └── Descriptive message
    │
    └── CTA Container (reveal-4)
        └── Button (primary, lg)
            ├── Icon: Home (lucide-react)
            └── Text: "Back to Home"
```

---

## Responsive Breakpoints

### Mobile (375px - default)

| Element | Size | Notes |
|---------|------|-------|
| Illustration | 256x256px | `w-64 h-64` |
| Container padding | 24px horizontal | `px-6` |
| Content max-width | 100% | Full width |
| Heading | 36px | `text-4xl` |
| Body text | 18px | `text-lg` |

### Tablet (768px - `sm:`)

| Element | Size | Notes |
|---------|------|-------|
| Illustration | 320x320px | `sm:w-80 sm:h-80` |
| Container padding | 24px horizontal | Same as mobile |
| Content max-width | 100% | Same as mobile |

### Desktop (1440px - `md:`)

| Element | Size | Notes |
|---------|------|-------|
| Illustration | 400x400px | `md:w-[400px] md:h-[400px]` |
| Container padding | 24px horizontal | Same as mobile |
| Content max-width | 512px | `max-w-lg` |

---

## Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `px-6` | 24px | Page horizontal padding |
| `py-12` | 48px | Page vertical padding |
| `mb-8` | 32px | Illustration bottom margin |
| `mb-4` | 16px | Heading bottom margin |
| `mb-8` | 32px | Body text bottom margin |
| `gap-2` | 8px | Button icon-text gap |

---

## Typography Specifications

### Heading (h1)

| Property | Value |
|----------|-------|
| Font Family | `font-display` (custom display font) |
| Font Size | `text-4xl` (36px) |
| Font Weight | `font-bold` (700) |
| Color | `text-foreground` |
| Line Height | Default |

### Body Text (p)

| Property | Value |
|----------|-------|
| Font Family | System font stack |
| Font Size | `text-lg` (18px) |
| Font Weight | Regular (400) |
| Color | `text-muted-foreground` |
| Line Height | `leading-relaxed` (1.625) |

### Button Text

| Property | Value |
|----------|-------|
| Font Family | System font stack |
| Font Size | Base (16px) - `size="lg"` |
| Font Weight | Medium (500) |
| Color | `text-primary-foreground` |

---

## Button Variant

### Configuration

| Property | Value |
|----------|-------|
| Variant | `default` (primary) |
| Size | `lg` (large) |
| Icon | `Home` from lucide-react |
| Icon Size | 16x16px (`h-4 w-4`) |
| Icon Position | Leading (before text) |
| Gap | 8px (`gap-2`) |

### States

| State | Style |
|-------|-------|
| Default | `bg-primary text-primary-foreground` |
| Hover | `bg-primary/90` |
| Focus | `ring-2 ring-ring ring-offset-2` |
| Active | `scale-[0.98]` (subtle press) |

### Behavior

- Uses `asChild` pattern for Link wrapper
- Target: `/` (home route)

---

## Animation Sequence

Staggered reveal animations create a guided visual flow:

| Order | Element | Class | Delay | Duration |
|-------|---------|-------|-------|----------|
| 1 | Illustration | `reveal-1` | 0.1s | 0.6s |
| 2 | Heading | `reveal-2` | 0.2s | 0.6s |
| 3 | Body text | `reveal-3` | 0.3s | 0.6s |
| 4 | Button | `reveal-4` | 0.4s | 0.6s |

**Animation Keyframes** (`fadeInUp`):
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reveal-1 { animation: fadeInUp 0.6s ease-out 0.1s both; }
.reveal-2 { animation: fadeInUp 0.6s ease-out 0.2s both; }
.reveal-3 { animation: fadeInUp 0.6s ease-out 0.3s both; }
.reveal-4 { animation: fadeInUp 0.6s ease-out 0.4s both; }
```

**Purpose**: Creates visual hierarchy and guides user to action

---

## Accessibility Requirements

### Image Alt Text

```
"Compass illustration representing navigation and finding your way"
```

### Semantic Structure

- Single `h1` for page title (404 - Page Not Found)
- Descriptive `p` paragraph for context
- `Button` component wrapping a `Link` with clear action label

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Focus moves to button |
| Enter/Space | Activates button (navigates home) |

### Color Contrast

| Element | Requirement | Status |
|---------|-------------|--------|
| Heading text | WCAG 2.1 AA (4.5:1) | Pass |
| Body text | WCAG 2.1 AA (4.5:1) | Pass |
| Button text | WCAG 2.1 AA (3:1 large text) | Pass |

### Screen Reader

- **Page Title** (metadata): "404 - Page Not Found | StartupAI"
- **Meta Description**: "The page you are looking for does not exist or has been moved."
- Logical reading order maintained through DOM structure

---

## Implementation Reference

| Property | Value |
|----------|-------|
| Code Location | `frontend/src/app/not-found.tsx` |
| Story | US-UX01 |
| Framework | Next.js 15 App Router |
| Components Used | `Button` (shadcn/ui), `Image` (next/image) |
| Icons | `Home` from `lucide-react` |

### Asset Storage

| Property | Value |
|----------|-------|
| Storage | Supabase `design-assets` bucket |
| Path | `shared/illustrations/` |
| Asset ID | `fedb30aa-a517-42fa-96e2-b8337e02708b` |
| URL | `https://eqxropalhxjeyvfcoyxg.supabase.co/storage/v1/object/public/design-assets/shared/illustrations/fedb30aa-a517-42fa-96e2-b8337e02708b.png` |

### Atmospheric Background Pattern

```css
/* Grid pattern - defined in globals.css */
.bg-grid-pattern {
  background-image:
    linear-gradient(hsl(var(--foreground) / 0.03) 1px, transparent 1px),
    linear-gradient(90deg, hsl(var(--foreground) / 0.03) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Applied with low opacity */
<div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
```

---

## Handoff Checklist

- [x] Component has all state variants documented
- [x] Responsive breakpoints defined (375px, 768px, 1440px)
- [x] Uses design system tokens (spacing, typography, colors)
- [x] Accessibility requirements specified
- [x] Figma reference provided (node 25:3)
- [x] Implementation complete and matches spec

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-30 | Initial specification created | UI Designer Agent |

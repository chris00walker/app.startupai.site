# 404 Page - UX Interaction Specification

**Story**: US-UX01
**File**: `frontend/src/app/not-found.tsx`
**Figma Asset**: Node 25:3 (404 Compass Illustration)
**Status**: Implemented

---

## Overview

The 404 page provides a branded error experience when users navigate to non-existent pages. It uses the compass illustration to visually communicate "being lost" while providing a clear recovery path.

## Entry Points

| Trigger | Description |
|---------|-------------|
| Direct URL | User types/pastes URL to non-existent page |
| Broken external link | Referral from external site with outdated link |
| Deleted/moved page | Internal redirect failure |
| Typo | User manually enters incorrect URL |

## User Emotional State

| State | Description | Design Response |
|-------|-------------|-----------------|
| **Primary** | Confused, disoriented ("Where am I?") | Clear heading, calming illustration |
| **Secondary** | Frustrated (interrupted task) | Single prominent CTA for recovery |
| **Design Goal** | Acknowledge confusion, provide clear path forward | Empathetic copy, minimal choices |

## Visual Hierarchy

```
1. Compass Illustration (draws attention, sets tone)
   |
2. "404 - Page Not Found" heading (confirms the situation)
   |
3. Body text (explains what happened, empathetic tone)
   |
4. "Back to Home" CTA (clear recovery action)
```

## Recovery Path

| Element | Specification |
|---------|---------------|
| **Primary CTA** | "Back to Home" button |
| **Icon** | Home icon (Lucide `Home`) |
| **Action** | Navigate to `/` |
| **Destination** | Dashboard (logged-in) or Landing (logged-out) |
| **Button Style** | Primary variant, `size="lg"` |

## User Flow Diagram

```
[Invalid URL Accessed]
        |
        v
    [404 Page Displayed]
        |
        v
    [User Reviews Content]
     - Sees illustration (emotional acknowledgment)
     - Reads heading (confirms error)
     - Reads body text (understands situation)
        |
        v
    [Click "Back to Home"]
        |
        v
    [Home / Dashboard]
```

## Interactions

| Trigger | Element | Action | Result |
|---------|---------|--------|--------|
| Page Load | Page | Staggered reveal animation | Content fades in sequentially (reveal-1 through reveal-4) |
| Hover | CTA Button | Standard button hover | Visual feedback |
| Click | CTA Button | Navigate | Route to home page |
| Focus | CTA Button | Keyboard nav | Focus ring visible |

## Loading States

| State | Display |
|-------|---------|
| Initial Load | Atmospheric background renders first, then illustration, then text |
| Image Loading | Skeleton or shimmer (handled by Next.js Image priority) |
| Navigation | Standard Next.js route transition |

## Error States

This page IS the error state. No additional error handling needed within the page itself.

## Accessibility Considerations

### Focus Management
- Auto-focus consideration: Could auto-focus CTA button on page load
- Currently: Natural focus starts at top of page
- Recommendation: Single Tab reaches CTA button

### Screen Reader Experience
| Element | Announcement |
|---------|--------------|
| Page Title | "404 - Page Not Found | StartupAI" |
| Illustration | "Compass illustration representing navigation and finding your way" |
| Heading | "404 - Page Not Found" (h1) |
| Body | Full text read |
| CTA | "Back to Home, button" |

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Move to "Back to Home" button |
| Enter | Activate button (navigate home) |
| Escape | No action (single-page, no modal) |

### Color Contrast
| Element | Foreground | Background | Ratio |
|---------|------------|------------|-------|
| Heading | `text-foreground` | background | > 7:1 |
| Body | `text-muted-foreground` | background | > 4.5:1 |
| Button | Primary text | Primary bg | > 4.5:1 |

### Motion
- Uses CSS reveal animations (classes reveal-1 through reveal-4)
- Respects `prefers-reduced-motion` (handled by CSS)

## Animation Specification

```css
/* Staggered reveal timing */
.reveal-1 { animation-delay: 0ms }    /* Illustration */
.reveal-2 { animation-delay: 100ms }  /* Heading */
.reveal-3 { animation-delay: 200ms }  /* Body text */
.reveal-4 { animation-delay: 300ms }  /* CTA button */
```

## Responsive Behavior

| Breakpoint | Illustration Size | Layout |
|------------|-------------------|--------|
| Mobile (< 640px) | 256x256px (`w-64`) | Centered, stacked |
| Tablet (640px+) | 320x320px (`sm:w-80`) | Centered, stacked |
| Desktop (768px+) | 400x400px (`md:w-[400px]`) | Centered, stacked |

## Implementation Notes

### Current Implementation
```tsx
// Key elements from not-found.tsx
<Image
  src="[supabase-url]/design-assets/shared/illustrations/[asset-id].png"
  alt="Compass illustration representing navigation and finding your way"
  width={400}
  height={400}
  priority  // Ensures illustration loads first
/>

<Button asChild size="lg" className="gap-2">
  <Link href="/">
    <Home className="h-4 w-4" />
    Back to Home
  </Link>
</Button>
```

### Design Tokens Used
- Background: `bg-gradient-to-br from-primary/[0.02] via-background to-accent/[0.02]`
- Grid pattern: `bg-grid-pattern opacity-[0.02]`
- Typography: `font-display` for heading

## Figma Reference

| Asset | Node ID | Description |
|-------|---------|-------------|
| 404 Compass Illustration | 25:3 | Stylized compass with misaligned needle |
| Page Illustrations Section | 25:2 | Container section in design system |

---

**Created by**: UX Designer Agent
**Date**: 2026-01-30
**Last Updated**: 2026-01-30

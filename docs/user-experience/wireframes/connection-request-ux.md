---
purpose: "UX specification for connection request flows"
status: "active"
created: "2026-02-03"
last_reviewed: "2026-02-03"
story: "US-PH03, US-PH04, US-FM03, US-FM05, US-FM06"
---

# Connection Request UX Specification

This document specifies the user experience for connection requests in the Portfolio Holder marketplace.

## Overview

Connection requests enable Portfolio Holders and Founders to establish professional relationships. Both parties must explicitly accept connections - this is a key privacy and consent feature.

## Connection States

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CONNECTION STATE MACHINE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    accept     ┌─────────┐                                  │
│  │ requested │─────────────►│ active  │                                  │
│  └──────────┘               └─────────┘                                  │
│       │                          │                                        │
│       │ decline                  │ archive                               │
│       ▼                          ▼                                        │
│  ┌──────────┐               ┌──────────┐                                 │
│  │ declined │               │ archived │                                 │
│  └──────────┘               └──────────┘                                 │
│       │                                                                   │
│       │ 30-day cooldown                                                  │
│       ▼                                                                   │
│  ┌──────────┐                                                            │
│  │ (can re- │                                                            │
│  │  request)│                                                            │
│  └──────────┘                                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Dashboard Notification

### Location
Founder and Consultant dashboards, top section.

### Component: ConnectionRequestCard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🔔 Connection Requests                                          [2]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  You have 2 pending connection requests from consultants.               │
│                                                                          │
│                                              [ View Requests → ]         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Badge Display Rules:**
- Badge count shows pending requests only
- Card hidden if count = 0
- Click leads to `/founder/connections` or `/consultant/connections`

## Connection Request List Page

### Route
- Founder: `/founder/connections`
- Consultant: `/consultant/connections`

### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Connection Requests                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Tabs: [ Pending (2) ] [ Active (5) ] [ Declined (1) ]                  │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  ✓ John Smith                                           Advisory   │  │
│  │  Growth Advisors LLC                                               │  │
│  │                                                                     │  │
│  │  "I'd love to help you refine your go-to-market strategy..."      │  │
│  │                                                                     │  │
│  │  Requested 2 days ago                                              │  │
│  │                                                                     │  │
│  │                           [ Decline ]  [ Accept ]                  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  ✓ Sarah Chen                                             Capital  │  │
│  │  Tech Angels Fund                                                   │  │
│  │                                                                     │  │
│  │  "Your SaaS metrics look promising. Let's discuss a seed round..." │  │
│  │                                                                     │  │
│  │  Requested 5 days ago                                              │  │
│  │                                                                     │  │
│  │                           [ Decline ]  [ Accept ]                  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Request Card Elements:**
- Verified badge (✓) for verified consultants
- Name and organization
- Relationship type badge (right-aligned)
- Message preview (truncated to 100 chars)
- Time since request
- Accept/Decline buttons

## Accept Flow

### Accept Confirmation Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Confirm Connection                                              [ × ]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Connect with John Smith as Advisory Consultant?                        │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  By accepting, you agree to share your validation evidence with   │  │
│  │  this consultant. They will be able to:                           │  │
│  │                                                                     │  │
│  │  • View your Value Proposition Canvas                             │  │
│  │  • See your experiment results and evidence                       │  │
│  │  • Track your validation progress                                  │  │
│  │                                                                     │  │
│  │  You can end this relationship at any time from Settings.         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│                                          [ Cancel ]  [ Confirm ]         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Accept Success Message

```
✓ Connection established

You're now connected with John Smith. They can view your validation evidence and track your progress.
```

## Decline Flow

### Decline Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Decline Request                                                 [ × ]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Are you sure you want to decline this request from John Smith?         │
│                                                                          │
│  Reason (optional):                                                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  [ ] Not the right fit for my needs                               │  │
│  │  [ ] Timing isn't right                                            │  │
│  │  [ ] Already working with another advisor                         │  │
│  │  [ ] Other                                                         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  ⓘ This consultant can send a new request after 30 days.          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│                                          [ Cancel ]  [ Decline ]         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Decline Success Message

```
Request declined

John Smith can send a new request after March 5, 2026.
```

## Relationship Type Tooltips

| Type | Tooltip Text |
|------|-------------|
| **Advisory** | "Strategic guidance. Mentors, coaches, fractional executives." |
| **Capital** | "Funding support. Angels, VCs, family offices." |
| **Program** | "Cohort-based support. Accelerators, incubators." |
| **Service** | "Professional support. Lawyers, accountants, agencies." |
| **Ecosystem** | "Community and networking. Coworking, startup communities." |

## Cooldown Logic

### Database Query (before creating request)
```sql
SELECT 1 FROM consultant_clients
WHERE consultant_id = :consultantId
  AND client_id = :founderId
  AND connection_status = 'declined'
  AND declined_at + INTERVAL '30 days' > NOW();
```

### API Response (429)
```json
{
  "error": "cooldown_active",
  "message": "You can reconnect with this founder in 15 days.",
  "cooldown_ends_at": "2026-03-05T10:00:00Z",
  "days_remaining": 15
}
```

### UI Display
Show disabled "Request Connection" button with tooltip:
> "Available in 15 days"

## Mobile Responsiveness

### Small Screens (<640px)
- Stack accept/decline buttons vertically
- Show abbreviated message preview (50 chars)
- Collapse organization to separate line

### Medium Screens (640-1024px)
- Side-by-side accept/decline buttons
- Full message preview

### Large Screens (>1024px)
- As designed in wireframes above

## Accessibility

### Keyboard Navigation
- Tab through request cards
- Enter/Space to activate buttons
- Escape to close modals

### Screen Reader Announcements
- "2 pending connection requests"
- "Request from John Smith, Advisory, received 2 days ago"
- "Connection established with John Smith"

### ARIA Labels
```html
<button aria-label="Accept connection request from John Smith">Accept</button>
<button aria-label="Decline connection request from John Smith">Decline</button>
```

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-verified-badge` | `green-500` | Verification badge |
| `--color-grace-badge` | `amber-500` | Grace period badge |
| `--spacing-card-marketplace` | `1.5rem` | Card padding |
| `--radius-card` | `0.5rem` | Card border radius |

## Cross-References

- [portfolio-holder.md](../stories/portfolio-holder.md) - User stories
- [consultant-journey-map.md](../journeys/consultant/consultant-journey-map.md) - Journey map
- [marketplace-microcopy.md](../../specs/marketplace-microcopy.md) - All UI text

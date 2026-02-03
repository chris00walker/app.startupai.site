---
purpose: "Lifecycle states, definitions, and transitions"
status: "active"
last_reviewed: "2026-01-22"
---

# Account Lifecycle States

## Account Lifecycle States

> **Added (2026-01-22)**: Lifecycle states affect what users can do and how they experience the platform.

### Lifecycle State Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCOUNT LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │  Signup  │───>│  Trial   │───>│  Active  │                  │
│  │          │    │(30 days) │    │  (Paid)  │                  │
│  └──────────┘    └────┬─────┘    └────┬─────┘                  │
│                       │               │                         │
│                       │               │                         │
│                       ▼               ▼                         │
│                  ┌──────────┐    ┌──────────┐                  │
│                  │ Expired  │    │Cancelled │                  │
│                  │ (No Pay) │    │(by User) │                  │
│                  └────┬─────┘    └────┬─────┘                  │
│                       │               │                         │
│                       │               │                         │
│                       ▼               ▼                         │
│                  ┌──────────────────────────┐                  │
│                  │      Grace Period        │                  │
│                  │      (30 days)           │                  │
│                  └────────────┬─────────────┘                  │
│                               │                                 │
│                               ▼                                 │
│                  ┌──────────────────────────┐                  │
│                  │    Retention Period      │                  │
│                  │      (60 days)           │                  │
│                  └────────────┬─────────────┘                  │
│                               │                                 │
│                               ▼                                 │
│                  ┌──────────────────────────┐                  │
│                  │      Purged              │                  │
│                  │   (Data Deleted)         │                  │
│                  └──────────────────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Lifecycle State Definitions

| State | Description | User Access | Duration | Next State |
|-------|-------------|-------------|----------|------------|
| `signup` | User creating account | None (in progress) | Minutes | `trial` |
| `trial` | Evaluating platform | Limited features | 30 days | `active` or `expired` |
| `active` | Paid, current subscription | Full features | Ongoing | `cancelled` or `past_due` |
| `past_due` | Payment failed | Full (grace) | 14 days | `active` or `suspended` |
| `suspended` | Multiple payment failures | Read-only | 16 days | `active` or `cancelled` |
| `cancelled` | User cancelled | Degrades over time | See retention | `reactivated` or `purged` |
| `expired` | Trial ended, no payment | Read-only | 30 days | `active` or `retention` |
| `grace_period` | Post-cancel access | Read-only | 30 days | `retention` |
| `retention` | Data kept, no access | None | 60 days | `purged` or `reactivated` |
| `purged` | Data deleted | None | Permanent | N/A |

### State Transitions

| From | To | Trigger |
|------|----|---------|
| `signup` | `trial` | Account creation complete |
| `trial` | `active` | Payment successful |
| `trial` | `expired` | 30 days passed, no payment |
| `active` | `cancelled` | User cancels subscription |
| `active` | `past_due` | Payment fails |
| `past_due` | `active` | Payment recovered |
| `past_due` | `suspended` | 14 days, no recovery |
| `suspended` | `active` | Payment recovered |
| `suspended` | `cancelled` | 30 days, no recovery |
| `cancelled` | `grace_period` | Automatic (immediate) |
| `expired` | `grace_period` | Automatic (immediate) |
| `grace_period` | `retention` | 30 days passed |
| `retention` | `purged` | 90 days total since cancel |
| Any pre-purge | `active` | User reactivates |

---

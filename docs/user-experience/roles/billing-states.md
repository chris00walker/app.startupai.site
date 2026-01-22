---
purpose: "Billing state definitions and dunning schedule"
status: "active"
last_reviewed: "2026-01-22"
---

# Billing States

## Billing States

> **Added (2026-01-22)**: Billing states determine subscription and payment status.

### Billing State Definitions

| State | Description | User Experience | Admin Actions |
|-------|-------------|-----------------|---------------|
| `trialing` | In free trial | See trial limits, upgrade prompts | Monitor engagement |
| `active` | Subscription current | Full access, auto-renew | Normal support |
| `past_due` | Payment failed, retrying | Warning banners, payment prompts | Manual retry option |
| `suspended` | Multiple failures | Read-only access | Payment recovery, manual upgrade |
| `cancelled` | User cancelled | Access until period end | Win-back eligibility |
| `incomplete` | Checkout abandoned | Incomplete signup | Nudge to complete |
| `paused` | User-requested pause | Read-only, skipped billing | Resume available |

### Billing Events

| Event | Trigger | User Notification | System Action |
|-------|---------|-------------------|---------------|
| `subscription.created` | First payment success | Welcome email | Set `active` state |
| `subscription.updated` | Plan change | Confirmation email | Update plan, prorate |
| `subscription.cancelled` | User cancels | Cancellation email | Set `cancelled`, start grace |
| `invoice.payment_succeeded` | Renewal payment | Receipt email | Continue `active` |
| `invoice.payment_failed` | Card declined | Failure email + banner | Start dunning, set `past_due` |
| `customer.subscription.paused` | User pauses | Pause confirmation | Set `paused`, skip invoices |
| `customer.subscription.resumed` | User resumes | Resume confirmation | Set `active`, resume invoicing |

### Dunning Schedule

| Day | Action | Email | Access |
|-----|--------|-------|--------|
| 0 | First failure | "Payment failed" | Full |
| 1 | Retry #1 | - | Full |
| 3 | Retry #2 | "Reminder" | Full |
| 7 | Retry #3 | "Urgent" | Full |
| 14 | Final retry | "Final warning" | Full |
| 14 | Suspend | "Suspended" | Read-only |
| 30 | Cancel | "Cancelled" | Grace period |

**Implementation:** Stripe Billing Smart Retries + custom dunning emails via Resend

---

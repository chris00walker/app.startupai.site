---
purpose: "Feature specification for founder trial user limits and upgrade flow"
status: "active"
last_reviewed: "2026-01-22"
user_stories: ["US-FT01", "US-FT02", "US-FT03"]
---

# Trial Limits and Upgrade Feature

## Overview

Trial users have limited access to StartupAI features to experience the platform before committing to a paid plan. This feature manages trial limits, communicates restrictions, and provides a frictionless upgrade path.

## User Stories

| Story | Title | Priority |
|-------|-------|----------|
| US-FT01 | Start Founder Trial Onboarding | High |
| US-FT02 | View Trial Limits | High |
| US-FT03 | Upgrade to Founder | High |

---

## Trial Limits

### Current Limits

| Resource | Trial Limit | Founder Plan | Consultant Plan |
|----------|-------------|--------------|-----------------|
| Projects | 1 | 5 | Unlimited (clients) |
| Validation Phases | Phase 0 only | All (0-4) | All (0-4) |
| HITL Checkpoints | 1 (approve_founders_brief) | All | All |
| AI Analysis | Founder's Brief only | Full D-F-V | Full D-F-V |
| Export | None | PDF, JSON | PDF, JSON, White-label |
| History | 30 days | Unlimited | Unlimited |

### Limit Enforcement Points

| Action | Limit Check | User Feedback |
|--------|-------------|---------------|
| Create Project | projects_count < 1 | "Upgrade to create more projects" |
| Start Phase 1 | user.plan != 'trial' | "Upgrade to continue validation" |
| View D-F-V Signals | user.plan != 'trial' | Blurred preview + upgrade CTA |
| Export Results | user.plan != 'trial' | "Upgrade to export" |
| Access after 30 days | trial_expires_at > now | "Trial expired - upgrade to continue" |

---

## UI Components

### Trial Badge

Displayed in header for trial users:

```
┌─────────────────────────────────────────┐
│  🎁 Trial Account  •  12 days left      │
│     [ Upgrade Now ]                     │
└─────────────────────────────────────────┘
```

### Trial Limits Dashboard Card

Shown on founder dashboard for trial users:

```
┌─────────────────────────────────────────────────────────────────┐
│  Your Trial Status                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Projects:        1 of 1 used  ████████████████████ 100%       │
│  Phases:          Phase 0 only (Founder's Brief)                │
│  Time Remaining:  12 days                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔒 Locked Features                                      │   │
│  │  • Full D-F-V Validation (Phases 1-4)                   │   │
│  │  • Market Testing & Ad Campaigns                        │   │
│  │  • Unit Economics Analysis                              │   │
│  │  • Export & Sharing                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ Upgrade to Founder - $99/mo ]                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Upgrade Prompt Modal

Shown when trial user hits a limit:

```
┌─────────────────────────────────────────────────────────────────┐
│  🚀 Unlock Full Validation                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your Founder's Brief is ready! Continue with full validation   │
│  to test your idea in the real market.                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Founder Plan - $99/month                                │   │
│  │                                                          │   │
│  │  ✓ Full 5-phase validation                              │   │
│  │  ✓ AI-powered market testing                            │   │
│  │  ✓ D-F-V signal analysis                                │   │
│  │  ✓ Unlimited HITL approvals                             │   │
│  │  ✓ Export & sharing                                     │   │
│  │  ✓ 5 concurrent projects                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [ Start Founder Plan ]     [ Maybe Later ]                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Blurred Preview

For locked content (D-F-V signals, etc.):

```
┌─────────────────────────────────────────────────────────────────┐
│  Desirability Signal                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                                 │
│           🔒 Upgrade to view Desirability analysis              │
│                    [ Upgrade Now ]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Upgrade Flow

### Flow Diagram

```
[Trial User] → [Hits Limit] → [Upgrade Modal]
                                    │
                                    ▼
                            [Select Plan]
                                    │
                                    ▼
                            [Stripe Checkout]
                                    │
                                    ▼
                            [Payment Success]
                                    │
                                    ▼
                         [Update user.plan in DB]
                                    │
                                    ▼
                         [Redirect to Dashboard]
                                    │
                                    ▼
                         [Show Success Toast]
```

### Upgrade Triggers

| Trigger Point | Context | CTA Text |
|---------------|---------|----------|
| Dashboard card | Proactive | "Upgrade to Founder" |
| Create 2nd project | Blocked action | "Upgrade to create more projects" |
| After Phase 0 approval | Natural progression | "Continue validation - Upgrade" |
| View D-F-V signals | Locked content | "Upgrade to view analysis" |
| Export button | Locked action | "Upgrade to export" |
| Trial expiration banner | Time pressure | "Upgrade before trial ends" |

### Stripe Integration

```typescript
// pages/api/stripe/create-checkout-session.ts
interface CreateCheckoutRequest {
  plan: 'founder' | 'consultant';
  billing_period: 'monthly' | 'annual';
  success_url: string;
  cancel_url: string;
}

// Price IDs (Stripe)
const PRICE_IDS = {
  founder_monthly: 'price_xxx',
  founder_annual: 'price_xxx',
  consultant_monthly: 'price_xxx',
  consultant_annual: 'price_xxx',
};
```

### Post-Upgrade Actions

1. Update `users.plan` to new plan type
2. Update `users.plan_started_at` timestamp
3. Remove trial expiration
4. Unlock all features immediately
5. Send welcome email with plan details
6. Log upgrade event for analytics

---

## Trial Expiration

### 30-Day Trial Period

```typescript
interface TrialUser {
  plan: 'trial';
  trial_started_at: Date;
  trial_expires_at: Date; // trial_started_at + 30 days
}
```

### Expiration Warnings

| Days Remaining | Action |
|----------------|--------|
| 7 days | Email reminder + in-app banner |
| 3 days | Email reminder + prominent banner |
| 1 day | Email reminder + modal on login |
| 0 days | Account restricted, upgrade required |

### Post-Expiration State

```
┌─────────────────────────────────────────────────────────────────┐
│  ⏰ Your Trial Has Expired                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your 30-day trial ended on January 15, 2026.                   │
│                                                                 │
│  Your data is preserved for 90 days. Upgrade now to:            │
│  • Continue your validation journey                             │
│  • Access your Founder's Brief                                  │
│  • Unlock full D-F-V analysis                                   │
│                                                                 │
│  [ Upgrade to Founder - $99/mo ]                                │
│                                                                 │
│  Or [ Download Your Data ] before deletion                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Users Table Extension

```sql
ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'trial';
ALTER TABLE users ADD COLUMN plan_started_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN trial_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;

-- Set trial expiration on signup
CREATE OR REPLACE FUNCTION set_trial_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan = 'trial' THEN
    NEW.trial_expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_trial_expiration
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_expiration();
```

### RLS Policies

```sql
-- Trial users can only access Phase 0 data
CREATE POLICY "trial_phase_limit" ON validation_runs
  FOR SELECT
  USING (
    auth.uid() = user_id AND (
      (SELECT plan FROM users WHERE id = auth.uid()) != 'trial'
      OR current_phase = 0
    )
  );

-- Trial users limited to 1 project
CREATE POLICY "trial_project_limit" ON projects
  FOR INSERT
  WITH CHECK (
    (SELECT plan FROM users WHERE id = auth.uid()) != 'trial'
    OR (SELECT COUNT(*) FROM projects WHERE user_id = auth.uid()) < 1
  );
```

---

## API Endpoints

### Check Trial Status

```
GET /api/user/trial-status

Response:
{
  "is_trial": true,
  "days_remaining": 12,
  "expires_at": "2026-01-31T00:00:00Z",
  "limits": {
    "projects": { "used": 1, "max": 1 },
    "phases": { "allowed": [0], "current": 0 },
    "features": ["onboarding", "founders_brief"]
  },
  "upgrade_url": "/upgrade"
}
```

### Create Upgrade Session

```
POST /api/stripe/create-checkout-session

Body:
{
  "plan": "founder",
  "billing_period": "monthly"
}

Response:
{
  "checkout_url": "https://checkout.stripe.com/..."
}
```

### Handle Upgrade Webhook

```
POST /api/stripe/webhook

Event: checkout.session.completed
Action: Update user.plan, remove trial_expires_at
```

---

## Analytics Events

| Event | Properties | Trigger |
|-------|------------|---------|
| `trial_started` | user_id, source | User signs up |
| `trial_limit_hit` | user_id, limit_type, action | User blocked by limit |
| `upgrade_modal_shown` | user_id, trigger_point | Modal displayed |
| `upgrade_started` | user_id, plan, billing_period | Checkout initiated |
| `upgrade_completed` | user_id, plan, revenue | Payment successful |
| `upgrade_abandoned` | user_id, plan, step | Checkout abandoned |
| `trial_expired` | user_id, converted | Trial period ended |

---

## Acceptance Criteria

### US-FT02: View Trial Limits

- [ ] Trial badge visible in header with days remaining
- [ ] Trial status card on dashboard shows limits
- [ ] Locked features clearly indicated with upgrade CTA
- [ ] Blurred preview for premium content (D-F-V signals)
- [ ] Expiration warnings at 7, 3, and 1 day marks

### US-FT03: Upgrade to Founder

- [ ] Multiple upgrade entry points (dashboard, limit hits, nav)
- [ ] Clear plan comparison on upgrade modal
- [ ] Stripe checkout integration working
- [ ] User plan updated immediately after payment
- [ ] All features unlocked post-upgrade
- [ ] Welcome email sent on upgrade
- [ ] Upgrade analytics tracked

---

## Test Plan

### Unit Tests

- `checkTrialLimits()` - Enforces project/phase limits
- `calculateDaysRemaining()` - Correct expiration calculation
- `shouldShowUpgradePrompt()` - Trigger logic

### Integration Tests

- Trial user blocked from Phase 1
- Trial user blocked from 2nd project
- Stripe webhook updates user plan

### E2E Tests (13-trial-limits.spec.ts)

- Trial user sees limit indicators
- Trial user hits project limit
- Trial user completes upgrade flow
- Expired trial shows restriction modal

---

## Related Documentation

- [stories/README.md](../user-experience/stories/README.md) - US-FT01, US-FT02, US-FT03
- [auth.md](../specs/auth.md) - Authentication flow
- [journey-test-matrix.md](../testing/journey-test-matrix.md) - Test coverage

---

**Last Updated**: 2026-01-22
**Status**: Active specification

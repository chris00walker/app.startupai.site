---
purpose: "Event taxonomy and KPIs for Portfolio Holder marketplace"
status: "active"
created: "2026-02-03"
last_reviewed: "2026-02-03"
story: "US-PH01, US-FM01"
---

# Marketplace Analytics Specification

## Executive Summary

This document defines the event taxonomy and KPIs for the Portfolio Holder marketplace, tracking adoption, engagement, and conversion across both sides of the two-sided marketplace.

## Success Metrics (M0 KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Founders with `founder_directory_opt_in = TRUE` | 50+ | SQL query |
| Founders with `problem_fit IN (partial_fit, strong_fit)` | 30+ | SQL query |
| Verified Portfolio Holders | 10+ | SQL query on `verification_status` |
| Connection requests (30 days) | 20+ | Event count |
| Connection acceptance rate | >40% | Accepted / (Accepted + Declined) |

## Event Taxonomy

### Consultant Directory Events (Founders Browsing)

| Event | Properties | When Fired |
|-------|------------|------------|
| `marketplace.consultant_directory.viewed` | `{ count: number }` | Founder opens Consultant Directory |
| `marketplace.consultant_directory.filtered` | `{ relationship_type, industries, services }` | Founder applies filters |
| `marketplace.consultant_profile.viewed` | `{ consultant_id, relationship_type, is_verified }` | Founder views consultant profile |
| `marketplace.connection.requested_by_founder` | `{ consultant_id, relationship_type, has_message }` | Founder requests connection |

### Founder Directory Events (Consultants Browsing)

| Event | Properties | When Fired |
|-------|------------|------------|
| `marketplace.founder_directory.viewed` | `{ count: number, verification_status }` | Verified consultant opens Founder Directory |
| `marketplace.founder_directory.filtered` | `{ problem_fit, industry, stage }` | Consultant applies filters |
| `marketplace.founder_profile.viewed` | `{ founder_id, problem_fit, has_evidence }` | Consultant views founder profile |
| `marketplace.connection.requested_by_consultant` | `{ founder_id, relationship_type, has_message }` | Consultant requests connection |

### Connection Flow Events

| Event | Properties | When Fired |
|-------|------------|------------|
| `marketplace.connection.accepted` | `{ connection_id, relationship_type, initiated_by, days_to_accept }` | Recipient accepts |
| `marketplace.connection.declined` | `{ connection_id, relationship_type, initiated_by, decline_reason }` | Recipient declines |
| `marketplace.connection.expired` | `{ connection_id, initiated_by, days_pending }` | Request expires (30 days) |

### RFQ Board Events

| Event | Properties | When Fired |
|-------|------------|------------|
| `marketplace.rfq.created` | `{ rfq_id, relationship_type, industries, timeline, budget_range }` | Founder creates RFQ |
| `marketplace.rfq.viewed` | `{ rfq_id, viewer_verification_status }` | Consultant views RFQ details |
| `marketplace.rfq.response_sent` | `{ rfq_id, consultant_id, message_length }` | Consultant responds to RFQ |
| `marketplace.rfq.response_accepted` | `{ rfq_id, response_id, days_to_accept }` | Founder accepts response |
| `marketplace.rfq.response_declined` | `{ rfq_id, response_id, decline_reason }` | Founder declines response |
| `marketplace.rfq.cancelled` | `{ rfq_id, responses_count, reason }` | Founder cancels RFQ |
| `marketplace.rfq.filled` | `{ rfq_id, responses_count, days_to_fill }` | RFQ marked as filled |

### Verification Events

| Event | Properties | When Fired |
|-------|------------|------------|
| `marketplace.verification.granted` | `{ consultant_id, plan_tier, source }` | Consultant becomes verified |
| `marketplace.verification.grace_started` | `{ consultant_id, reason }` | Grace period begins |
| `marketplace.verification.revoked` | `{ consultant_id, reason, days_in_grace }` | Verification revoked |

### Opt-in Events

| Event | Properties | When Fired |
|-------|------------|------------|
| `marketplace.opt_in.consultant_enabled` | `{ consultant_id, default_relationship_type }` | Consultant opts into directory |
| `marketplace.opt_in.consultant_disabled` | `{ consultant_id, days_opted_in }` | Consultant opts out |
| `marketplace.opt_in.founder_enabled` | `{ founder_id, problem_fit }` | Founder opts into directory |
| `marketplace.opt_in.founder_disabled` | `{ founder_id, days_opted_in }` | Founder opts out |

## Dashboard Queries

### Marketplace Health Dashboard

```sql
-- Active verified consultants
SELECT COUNT(*) as verified_consultants
FROM consultant_profiles
WHERE verification_status IN ('verified', 'grace')
  AND directory_opt_in = TRUE;

-- Eligible founders (VPD gate + opt-in)
-- Note: problem_fit is in crewai_validation_states, not projects
SELECT COUNT(DISTINCT u.id) as eligible_founders
FROM user_profiles u
JOIN projects p ON p.user_id = u.id
JOIN crewai_validation_states cvs ON cvs.project_id = p.id
WHERE u.founder_directory_opt_in = TRUE
  AND cvs.problem_fit IN ('partial_fit', 'strong_fit');

-- Connection request funnel (30 days)
SELECT
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE connection_status = 'active') as accepted,
  COUNT(*) FILTER (WHERE connection_status = 'declined') as declined,
  COUNT(*) FILTER (WHERE connection_status = 'requested') as pending
FROM consultant_clients
WHERE created_at > NOW() - INTERVAL '30 days'
  AND connection_status IN ('requested', 'active', 'declined');

-- RFQ conversion funnel
SELECT
  COUNT(DISTINCT cr.id) as total_rfqs,
  COUNT(DISTINCT crr.request_id) as rfqs_with_responses,
  COUNT(*) FILTER (WHERE crr.status = 'accepted') as accepted_responses
FROM consultant_requests cr
LEFT JOIN consultant_request_responses crr ON cr.id = crr.request_id
WHERE cr.created_at > NOW() - INTERVAL '30 days';
```

### Cohort Analysis Queries

```sql
-- Connection acceptance rate by relationship type
SELECT
  relationship_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE connection_status = 'active') as accepted,
  ROUND(100.0 * COUNT(*) FILTER (WHERE connection_status = 'active') / COUNT(*), 1) as acceptance_rate
FROM consultant_clients
WHERE connection_status IN ('active', 'declined')
GROUP BY relationship_type;

-- Time to accept by initiated_by
SELECT
  initiated_by,
  AVG(EXTRACT(EPOCH FROM (accepted_at - created_at)) / 86400) as avg_days_to_accept
FROM consultant_clients
WHERE connection_status = 'active'
  AND accepted_at IS NOT NULL
GROUP BY initiated_by;
```

## PostHog Implementation

### Event Tracking Code

```typescript
// Connection request (founder → consultant)
posthog.capture('marketplace.connection.requested_by_founder', {
  consultant_id: consultantId,
  relationship_type: relationshipType,
  has_message: !!message,
});

// Connection accepted
posthog.capture('marketplace.connection.accepted', {
  connection_id: connectionId,
  relationship_type: relationshipType,
  initiated_by: initiatedBy,
  days_to_accept: daysSinceRequest,
});

// RFQ created
posthog.capture('marketplace.rfq.created', {
  rfq_id: rfqId,
  relationship_type: relationshipType,
  industries: industries,
  timeline: timeline,
  budget_range: budgetRange,
});
```

### User Properties

Set on user for segmentation:

```typescript
// When founder opts in
posthog.identify(userId, {
  is_marketplace_founder: true,
  founder_directory_opt_in: true,
  problem_fit: projectFit,
});

// When consultant verifies
posthog.identify(userId, {
  is_verified_consultant: true,
  verification_status: status,
  plan_tier: tier,
  directory_opt_in: optIn,
  default_relationship_type: type,
});
```

## Alerting Thresholds

| Alert | Condition | Action |
|-------|-----------|--------|
| Low acceptance rate | <30% (7-day rolling) | Review connection UX |
| RFQ abandonment | >50% without responses (14 days) | Notify consultants |
| Verification drop | >3 revocations/day | Check payment issues |
| Directory empty | <5 verified consultants | Marketing push |

## Pre-Deployment Verification

Before launching marketplace features, verify:

1. **pg_cron enabled**: `SELECT * FROM pg_available_extensions WHERE name = 'pg_cron'`
2. **Existing cron jobs**: `SELECT * FROM cron.job` (expect 4 existing jobs per plan)
3. **Orphan records**: `SELECT COUNT(*) FROM consultant_clients WHERE consultant_id NOT IN (SELECT id FROM user_profiles)`
4. **Index creation**: All indexes from M3 schema migration exist

## References

- [Portfolio Holder Vision](portfolio-holder-vision.md)
- [Consultant Client System](../features/consultant-client-system.md)
- [Pricing Specification](pricing.md)

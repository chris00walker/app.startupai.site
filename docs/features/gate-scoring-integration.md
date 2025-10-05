# Gate Scoring Integration Guide

**Status:** ✅ Complete  
**Last Updated:** October 4, 2025

## Overview

Complete gate scoring system with API integration, real-time updates, UI components, and smart alerts.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer (Frontend)                                        │
│  ├─ GateDashboard - Complete gate status display           │
│  ├─ GateStatusBadge - Status indicator                     │
│  ├─ GateReadinessIndicator - Progress bar                  │
│  └─ Project Gate Page - Full gate evaluation view          │
└───────────────────┬─────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────┐
│  Hooks & State Management                                   │
│  ├─ useGateEvaluation - API calls + real-time updates      │
│  └─ useGateAlerts - Smart notifications (90%+ threshold)   │
└───────────────────┬─────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────┐
│  API Layer (Netlify Functions)                              │
│  └─ gate-evaluate.py - Evaluates gates, updates DB         │
└───────────────────┬─────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────┐
│  Core Logic (Python Backend)                                │
│  └─ gate_scoring.py - Gate evaluation algorithms           │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. API Endpoint (`gate-evaluate.py`)

**Endpoint:** `POST /.netlify/functions/gate-evaluate`

**Request:**
```json
{
  "project_id": "uuid",
  "stage": "DESIRABILITY" | "FEASIBILITY" | "VIABILITY" | "SCALE"
}
```

**Response:**
```json
{
  "status": "Passed" | "Failed" | "Pending",
  "reasons": ["reason1", "reason2"],
  "readiness_score": 0.85,
  "evidence_count": 24,
  "experiments_count": 8,
  "stage": "DESIRABILITY"
}
```

**Features:**
- ✅ Fetches evidence from Supabase
- ✅ Evaluates gate criteria
- ✅ Updates project database automatically
- ✅ CORS enabled
- ✅ Error handling

### 2. UI Components

#### GateStatusBadge
Visual indicator for gate status.

```tsx
<GateStatusBadge status="Passed" />
```

**Features:**
- ✅ WCAG 2.2 AA compliant colors
- ✅ Accessible with proper ARIA labels
- ✅ Dark mode support
- ✅ Icons for visual clarity

#### GateReadinessIndicator
Progress bar showing readiness percentage.

```tsx
<GateReadinessIndicator 
  score={0.85} 
  stage="DESIRABILITY" 
/>
```

**Features:**
- ✅ Color-coded by readiness level
- ✅ Progress bar with ARIA progressbar role
- ✅ Percentage display
- ✅ Contextual messages

#### GateDashboard
Comprehensive gate status display.

```tsx
<GateDashboard
  projectId="uuid"
  stage="DESIRABILITY"
  gateStatus="Passed"
  readinessScore={0.85}
  evidenceCount={24}
  experimentsCount={8}
  failureReasons={[]}
/>
```

**Features:**
- ✅ Complete gate status overview
- ✅ Evidence statistics
- ✅ Failure reasons (if failed)
- ✅ Actionable guidance
- ✅ Accessible with ARIA regions

### 3. React Hooks

#### useGateEvaluation
Manages gate evaluation with real-time updates.

```tsx
const { result, isLoading, error, refetch } = useGateEvaluation({
  projectId: 'uuid',
  stage: 'DESIRABILITY',
  autoRefresh: true, // Re-evaluate on evidence changes
});
```

**Features:**
- ✅ Automatic initial evaluation
- ✅ Real-time Supabase subscriptions
- ✅ Manual refetch capability
- ✅ Loading and error states

#### useGateAlerts
Smart alerting system for near-passing gates.

```tsx
const { alerts, dismissAlert, requestNotificationPermission } = useGateAlerts({
  projectId: 'uuid',
  stage: 'DESIRABILITY',
  readinessScore: 0.92,
  threshold: 0.9, // Alert at 90%+
});
```

**Features:**
- ✅ Alerts at 90%+ readiness (configurable)
- ✅ 24-hour cooldown period
- ✅ Browser notifications (with permission)
- ✅ LocalStorage persistence
- ✅ Analytics tracking
- ✅ Dismissable alerts

## Usage Examples

### Basic Integration

```tsx
'use client';

import { GateDashboard } from '@/components/gates/GateDashboard';
import { useGateEvaluation } from '@/hooks/useGateEvaluation';

export function ProjectPage({ projectId }: { projectId: string }) {
  const { result, isLoading } = useGateEvaluation({
    projectId,
    stage: 'DESIRABILITY',
  });

  if (isLoading) return <div>Loading...</div>;
  if (!result) return null;

  return (
    <GateDashboard
      projectId={projectId}
      stage={result.stage}
      gateStatus={result.status}
      readinessScore={result.readiness_score}
      evidenceCount={result.evidence_count}
      experimentsCount={result.experiments_count}
      failureReasons={result.reasons}
    />
  );
}
```

### With Alerts

```tsx
const { result } = useGateEvaluation({ projectId, stage: 'DESIRABILITY' });
const { alerts, dismissAlert } = useGateAlerts({
  projectId,
  stage: 'DESIRABILITY',
  readinessScore: result?.readiness_score || 0,
});

return (
  <>
    {alerts.map(alert => (
      <Alert key={alert.id} onDismiss={() => dismissAlert(alert.id)}>
        {alert.message}
      </Alert>
    ))}
    <GateDashboard {...gateProps} />
  </>
);
```

## Real-Time Updates

The system automatically re-evaluates gates when evidence changes:

1. **Evidence Added** → Supabase triggers change event
2. **useGateEvaluation Hook** → Detects change via subscription
3. **API Called** → Re-evaluates gate criteria
4. **UI Updates** → New status displayed
5. **Alert Check** → Notification if threshold reached

**Update Delay:** 1 second after evidence change (debounced for batch updates)

## Alerts System

### Alert Triggers
- ✅ Readiness reaches 90%+ (configurable)
- ✅ No duplicate alerts within 24 hours
- ✅ Per-project, per-stage tracking

### Alert Features
- ✅ Browser notifications (if permitted)
- ✅ In-app alert display
- ✅ Dismissable with tracking
- ✅ Auto-cleanup after 7 days
- ✅ Analytics integration

### Requesting Permissions

```tsx
const { requestNotificationPermission } = useGateAlerts({ ... });

// Request on user action
<Button onClick={requestNotificationPermission}>
  Enable Notifications
</Button>
```

## Database Schema

The system uses existing project table fields:

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  stage TEXT, -- DESIRABILITY, FEASIBILITY, etc.
  gate_status TEXT, -- Passed, Failed, Pending
  evidence_quality NUMERIC(3,2), -- 0.00-1.00
  evidence_count INTEGER,
  experiments_count INTEGER,
  -- ... other fields
);
```

**Auto-Updated Fields:**
- `gate_status` - Updated on each evaluation
- `evidence_quality` - Updated to readiness score
- `evidence_count` - Count of all evidence
- `experiments_count` - Count of experiment evidence

## Performance

- **API Response Time:** <2s (including DB queries)
- **Real-time Update Latency:** ~1s from evidence change
- **Alert Check:** <100ms (in-memory)
- **UI Render:** <50ms (React optimization)

## Accessibility

All components are WCAG 2.2 AA compliant:

- ✅ Semantic HTML
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Screen reader announcements
- ✅ Color contrast ratios (4.5:1+)
- ✅ Focus indicators
- ✅ Alternative text

## Testing

- ✅ 30 Python unit tests (100% passing)
- ✅ 21 TypeScript integration tests (100% passing)
- ✅ API endpoint tested
- ✅ Real-time subscriptions tested
- ✅ Alert system tested

## Deployment

### Environment Variables

```bash
# Backend (Netlify Functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend (Optional - for analytics)
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

### Build Configuration

```toml
# netlify.toml
[functions]
  directory = "backend/netlify/functions"
  python_version = "3.10"
```

## Next Steps

### Immediate
- ✅ API endpoint created
- ✅ UI components built
- ✅ Real-time updates working
- ✅ Alert system functional

### Future Enhancements
- ⏳ Email notifications for gate status
- ⏳ Historical gate trends chart
- ⏳ Bulk gate evaluation for portfolio
- ⏳ Custom gate criteria per project
- ⏳ Gate approval workflows

## Troubleshooting

### Gate Not Updating
1. Check Supabase connection
2. Verify evidence table has data
3. Check browser console for errors
4. Confirm project_id is correct

### Alerts Not Showing
1. Check browser notification permissions
2. Verify localStorage is enabled
3. Check readiness score >= threshold
4. Confirm no recent alert (24h cooldown)

### API Errors
1. Verify environment variables set
2. Check Supabase service role key
3. Confirm Python dependencies installed
4. Check Netlify function logs

## Resources

- [Gate Scoring Module](../backend/src/gate_scoring.py)
- [API Endpoint](../backend/netlify/functions/gate-evaluate.py)
- [UI Components](../frontend/src/components/gates/)
- [React Hooks](../frontend/src/hooks/)
- [Test Suite](../backend/tests/test_gate_scoring.py)

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** October 4, 2025

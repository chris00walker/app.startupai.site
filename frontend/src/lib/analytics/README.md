# Analytics Tracking System

Privacy-focused, GDPR-compliant analytics for StartupAI platform.

## Features

- ✅ **Privacy-First**: GDPR compliant with consent management
- ✅ **Multiple Providers**: PostHog, custom endpoints
- ✅ **Automatic Tracking**: Page views, user identification
- ✅ **Event Tracking**: Predefined events for common actions
- ✅ **Performance Monitoring**: Track component render times, API calls
- ✅ **Error Tracking**: Automatic error reporting
- ✅ **Accessibility**: WCAG 2.2 compliant consent banner

## Quick Start

### 1. Environment Configuration

Add to `.env.local`:

```bash
# Enable analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# PostHog (recommended)
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# OR Custom endpoint
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-api.com/analytics
```

### 2. Wrap Your App

```tsx
// app/layout.tsx
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
```

### 3. Track Events

```tsx
import { trackEvent, trackCrewAIEvent } from '@/lib/analytics';

// Simple event
trackEvent('button_clicked', { button_name: 'Sign Up' });

// CrewAI event
trackCrewAIEvent.started('project-123', 'What are AI trends?');
```

## Usage Examples

### Track Button Clicks

```tsx
import { useButtonTracking } from '@/lib/analytics/hooks';

function MyButton() {
  const trackClick = useButtonTracking('cta_signup', 'homepage');
  
  return (
    <button onClick={() => {
      trackClick();
      // Your button logic
    }}>
      Sign Up
    </button>
  );
}
```

### Track Form Submissions

```tsx
import { useFormTracking } from '@/lib/analytics/hooks';

function MyForm() {
  const trackSubmit = useFormTracking('contact_form');
  
  const handleSubmit = async (data) => {
    try {
      await submitForm(data);
      trackSubmit(true); // Success
    } catch (error) {
      trackSubmit(false, error.message); // Failure
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Track Component Performance

```tsx
import { usePerformanceTracking } from '@/lib/analytics/hooks';

function ExpensiveComponent() {
  // Track how long this component takes to render
  usePerformanceTracking('expensive_component_render', [data]);
  
  return <div>...</div>;
}
```

### Track CrewAI Analysis

```tsx
import { trackCrewAIEvent } from '@/lib/analytics';

async function runAnalysis(projectId: string, question: string) {
  const startTime = Date.now();
  
  trackCrewAIEvent.started(projectId, question);
  
  try {
    const result = await crewAI.analyze(question);
    const duration = (Date.now() - startTime) / 1000;
    
    trackCrewAIEvent.completed(projectId, duration, true);
    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    trackCrewAIEvent.failed(projectId, error.message, duration);
    throw error;
  }
}
```

### Track Project Actions

```tsx
import { trackProjectEvent } from '@/lib/analytics';

function ProjectActions() {
  const handleCreate = async () => {
    const project = await createProject();
    trackProjectEvent.created(project.id);
  };
  
  const handleUpdate = async (projectId, fields) => {
    await updateProject(projectId, fields);
    trackProjectEvent.updated(projectId, Object.keys(fields));
  };
  
  return <div>...</div>;
}
```

### Track Authentication

```tsx
import { trackAuthEvent } from '@/lib/analytics';

function LoginForm() {
  const handleLogin = async (method: 'email' | 'google' | 'github') => {
    try {
      await signIn(method);
      trackAuthEvent.login(method);
    } catch (error) {
      // Error automatically tracked
    }
  };
  
  return <form>...</form>;
}
```

### Track Errors

```tsx
import { useErrorTracking } from '@/lib/analytics/hooks';

function MyComponent() {
  const trackError = useErrorTracking('MyComponent');
  
  const handleAction = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      trackError(error, { action: 'riskyOperation' });
      // Show error to user
    }
  };
  
  return <div>...</div>;
}
```

## Predefined Events

### CrewAI Events
- `crewai_analysis_started` - Analysis initiated
- `crewai_analysis_completed` - Analysis finished successfully
- `crewai_analysis_failed` - Analysis encountered error

### Project Events
- `project_created` - New project created
- `project_updated` - Project details updated
- `project_deleted` - Project removed
- `project_viewed` - Project detail page viewed

### Authentication Events
- `user_login` - User signed in
- `user_logout` - User signed out
- `signup_started` - Signup flow initiated
- `signup_completed` - Signup successful

### UI Events
- `button_clicked` - Button interaction
- `form_submitted` - Form submission
- `modal_opened` - Modal displayed
- `search_performed` - Search executed

## Consent Management

### Show Consent Banner

The consent banner automatically appears for new users and respects GDPR requirements.

```tsx
<AnalyticsProvider showConsentBanner={true}>
  {children}
</AnalyticsProvider>
```

### Consent Settings Page

Add to your settings/privacy page:

```tsx
import { ConsentSettings } from '@/components/analytics/ConsentBanner';

function SettingsPage() {
  return (
    <div>
      <h1>Privacy Settings</h1>
      <ConsentSettings />
    </div>
  );
}
```

### Programmatic Consent

```tsx
import { setAnalyticsConsent } from '@/lib/analytics';

// Update consent
setAnalyticsConsent(true);  // Accept
setAnalyticsConsent(false); // Decline
```

## Custom Events

```tsx
import { trackEvent } from '@/lib/analytics';

// Simple event
trackEvent('custom_event_name');

// Event with properties
trackEvent('feature_used', {
  feature_name: 'canvas_editor',
  action: 'save',
  duration_seconds: 45,
  success: true,
});

// Event with category
trackEvent('ai_interaction', {
  model: 'gpt-4',
  prompt_length: 150,
  response_time_ms: 2500,
  category: 'ai_workflow',
});
```

## Performance Tracking

### Automatic Component Tracking

```tsx
import { usePerformanceTracking } from '@/lib/analytics/hooks';

function Dashboard() {
  // Tracks render time
  usePerformanceTracking('dashboard_render');
  
  return <div>...</div>;
}
```

### Manual Performance Tracking

```tsx
import { trackPerformance } from '@/lib/analytics';

const start = performance.now();
await expensiveOperation();
const duration = performance.now() - start;

trackPerformance('expensive_operation', duration, {
  operation_type: 'data_processing',
  items_count: 1000,
});
```

### API Call Tracking

```tsx
import { useAPITracking } from '@/lib/analytics/hooks';

function DataFetcher() {
  const trackAPI = useAPITracking('/api/projects');
  
  const fetchData = async () => {
    const start = Date.now();
    try {
      const response = await fetch('/api/projects');
      const duration = Date.now() - start;
      trackAPI('GET', response.status, duration);
    } catch (error) {
      const duration = Date.now() - start;
      trackAPI('GET', 500, duration);
    }
  };
  
  return <div>...</div>;
}
```

## Privacy & GDPR Compliance

### Data Collected

**With Consent:**
- Page views (URL, referrer, timestamp)
- User ID (hashed)
- Event names and properties
- Performance metrics
- Error messages (sanitized)

**Without Consent:**
- Events are queued but not sent
- No persistent storage
- No user identification

### Data NOT Collected

- ❌ Personal information (unless explicitly provided)
- ❌ Passwords or sensitive data
- ❌ IP addresses (handled by PostHog)
- ❌ Browser fingerprints
- ❌ Third-party cookies

### User Rights

Users can:
- ✅ Opt out of analytics
- ✅ View consent status
- ✅ Revoke consent anytime
- ✅ Request data deletion (via PostHog)

## Testing

### Development Mode

Analytics is enabled in development with debug logging:

```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

Console will show:
```
📊 Analytics: Initialized { consent: true, providers: ['posthog'] }
📊 Analytics: Event tracked { name: 'button_clicked', properties: {...} }
```

### Disable in Development

```tsx
<AnalyticsProvider autoConsentInDev={false}>
  {children}
</AnalyticsProvider>
```

### Test Events

```bash
# Open browser console
trackEvent('test_event', { test: true });
```

## Providers

### PostHog (Recommended)

Open-source, privacy-focused analytics:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

Features:
- Session recording
- Feature flags
- A/B testing
- Funnels
- Cohorts

[Get PostHog key →](https://posthog.com)

### Custom Endpoint

Send events to your own API:

```bash
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://api.yourdomain.com/analytics
```

Events are sent as POST requests:

```json
{
  "type": "track",
  "event": "button_clicked",
  "properties": {
    "button_name": "signup",
    "timestamp": "2025-10-04T23:00:00Z"
  }
}
```

## Troubleshooting

### Events Not Appearing

1. Check environment variables
2. Check console for errors
3. Verify consent is given
4. Check PostHog dashboard for delays (5-10 min)

### Consent Banner Not Showing

1. Clear localStorage
2. Check `NEXT_PUBLIC_ANALYTICS_ENABLED=true`
3. Verify component is rendered

### TypeScript Errors

Ensure `posthog-js` types are installed:

```bash
pnpm add -D @types/posthog-js
```

## Best Practices

1. **✅ DO**: Track user actions, not user data
2. **✅ DO**: Use descriptive event names
3. **✅ DO**: Include relevant context in properties
4. **✅ DO**: Respect user consent
5. **❌ DON'T**: Track sensitive information
6. **❌ DON'T**: Track personally identifiable data
7. **❌ DON'T**: Send data before consent

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Components / Pages                                     │
│  ├─ useButtonTracking()                                 │
│  ├─ useFormTracking()                                   │
│  └─ trackEvent()                                        │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  Analytics Manager (lib/analytics/index.ts)             │
│  ├─ Consent management                                  │
│  ├─ Event queuing                                       │
│  ├─ User identification                                 │
│  └─ Provider orchestration                              │
└──────────────────┬──────────────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
┌──────▼──────┐       ┌───────▼────────┐
│  PostHog    │       │  Custom API    │
│  (Cloud)    │       │  (Your server) │
└─────────────┘       └────────────────┘
```

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [Web Analytics Best Practices](https://web.dev/vitals/)
- [Privacy by Design](https://www.smashingmagazine.com/2017/07/privacy-by-design-framework/)

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** 2025-12-01

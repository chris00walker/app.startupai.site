---
purpose: "Deprecated completion report; superseded by status/implementation-status.md"
status: "deprecated"
last_reviewed: "2025-10-25"
---

> ⚠️ This report is archived. Current status lives in [`status/implementation-status.md`](../../status/implementation-status.md).

# ✅ PostHog Installation Complete

**Date:** October 5, 2025  
**Implementation:** Both Sites (Marketing + Product)

---

## Summary

PostHog analytics has been successfully installed on **both StartupAI sites** to enable unified user journey tracking from marketing to product usage.

## What Was Installed

### 1. Marketing Site (startupai.site)
- ✅ Package: `posthog-js@1.270.1` installed via pnpm
- ✅ Configuration: `instrumentation-client.ts` (Next.js 15.3+ pattern)
- ✅ Environment Variables: Added to `.env.local`, `.env.example`, `.env.production`
- ✅ Helper Library: `src/lib/analytics.ts` for type-safe event tracking
- ✅ Build Test: Passed (21 routes building successfully)

### 2. Product Site (app.startupai.site)
- ✅ Package: `posthog-js@1.270.1` (already installed)
- ✅ Configuration: `frontend/instrumentation-client.ts` (same pattern)
- ✅ Environment Variables: Added to both `.env.local` and `.env.example`
- ✅ Helper Library: `frontend/src/lib/analytics.ts` for product events
- ✅ Build Test: Passed (all pages and API routes building)

## Environment Variables

Both sites use the same PostHog project.

**Security:** The PostHog API key is stored in the centralized secrets file: `~/.secrets/startupai`

```env
NEXT_PUBLIC_POSTHOG_KEY=<from-secrets-file>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Access the key:**
```bash
grep POSTHOG_API_KEY ~/.secrets/startupai
```

## Key Features Enabled

1. **Automatic Tracking:**
   - Page views (all routes)
   - Click tracking (autocapture)
   - Session recording
   - Exit analytics

2. **Cross-Site Tracking:**
   - Unified user journey from marketing → product
   - Same PostHog project for both sites
   - Consistent user identification

3. **Type-Safe Event Tracking:**
   - Helper utilities in `src/lib/analytics.ts`
   - Predefined event types
   - Consistent naming conventions

## Quick Usage Examples

### Marketing Site

```typescript
import { analytics } from '@/lib/analytics'

// Track signup
analytics.signup.started('hero-cta')
analytics.signup.completed(userId, 'trial')

// Track pricing view
analytics.pricing.viewed('navbar')

// Track content
analytics.content.serviceClicked('AI Strategy')
```

### Product Site

```typescript
import { analytics } from '@/lib/analytics'

// Track project actions
analytics.project.created(projectId, 'New Startup Idea')
analytics.project.updated(projectId, 'added evidence')

// Track AI interactions
analytics.ai.analysisRequested('market-analysis', projectId)
analytics.ai.reportGenerated('strategy-report', projectId)

// Track canvas updates
analytics.canvas.bmcUpdated('value-proposition')
```

## Next Steps (Required)

### 1. Add Environment Variables to Netlify

**Get the PostHog API key:**
```bash
grep POSTHOG_API_KEY ~/.secrets/startupai
# Copy the value after the = sign
```

**For startupai-site (Marketing):**
1. Go to: https://app.netlify.com/sites/startupai-site/settings/env
2. Add:
   - `NEXT_PUBLIC_POSTHOG_KEY` = `<value-from-secrets-file>`
   - `NEXT_PUBLIC_POSTHOG_HOST` = `https://us.i.posthog.com`
3. Click "Save" and trigger new deployment

**For app-startupai-site (Product):**
1. Go to: https://app.netlify.com/sites/app-startupai-site/settings/env
2. Add same environment variables (same key value)
3. Click "Save" and trigger new deployment

**Security Note:** Never commit the PostHog key to version control. It's managed in `~/.secrets/startupai` and exported via direnv.

### 2. Verify Tracking

After deployment:
1. Visit https://startupai-site.netlify.app
2. Visit https://app-startupai-site.netlify.app
3. Check PostHog dashboard: https://us.i.posthog.com
4. Verify events appear within 5-10 seconds

### 3. Implement Custom Events

Replace manual `posthog.capture()` calls with typed helpers:

```typescript
// ❌ Old way
posthog.capture('user_signed_up', { plan: 'trial' })

// ✅ New way (type-safe)
analytics.signup.completed(userId, 'trial')
```

### 4. Set Up Dashboards

In PostHog, create:
- **Marketing Dashboard:** Signups, conversions, funnel analysis
- **Product Dashboard:** Feature usage, retention, engagement
- **Funnels:** Marketing visit → Signup → First project → First AI report
- **Cohorts:** Trial users, active founders, high-engagement consultants

## Documentation

- **Installation Guide:** `docs/technical/posthog-installation.md`
- **Implementation Plan:** Updated in `docs/technical/two-site-implementation-plan.md`
- **Marketing Analytics:** `src/lib/analytics.ts`
- **Product Analytics:** `frontend/src/lib/analytics.ts`

## Testing

### Local Development
```bash
# Marketing site
cd /home/chris/startupai.site
pnpm dev
# Open browser console → PostHog debug logs visible

# Product site
cd /home/chris/app.startupai.site/frontend
pnpm dev
# Open browser console → PostHog debug logs visible
```

### Production Verification
```bash
# After adding Netlify env vars:
1. Push code to trigger deployment
2. Visit live sites
3. Check PostHog dashboard for events
4. Verify cross-site tracking working
```

## Technical Details

**Pattern:** Next.js 15.3+ `instrumentation-client.ts`  
**Package:** `posthog-js@1.270.1`  
**Configuration:**
- Auto pageview tracking enabled
- Session recording enabled
- Cross-origin iframe tracking enabled
- Debug mode in development only
- Person profiles: identified_only (privacy-first)

## Support

- **PostHog Docs:** https://posthog.com/docs
- **Next.js Guide:** https://posthog.com/docs/libraries/next-js
- **Local Documentation:** `docs/technical/posthog-installation.md`

---

## Status: ✅ COMPLETE

All implementation work is done. Only remaining task is adding environment variables to Netlify dashboard and verifying tracking in production.

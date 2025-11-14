---
purpose: "Private technical source of truth for the authentication stack"
status: "active"
last_reviewed: "2025-11-13"
---

# Authentication Specification

## Summary

StartupAI uses Supabase Auth with PKCE-enabled OAuth and email/password fallback. GitHub is the primary OAuth provider, with Google and Microsoft staged behind feature flags.

## Architecture

- **Client** – Supabase browser client configured with `flowType: 'pkce'` and `detectSessionInUrl: false`.
- **Server** – Supabase server client used in Server Components, API routes, and server actions. Cookie-based session management ensures SSR compatibility.
- **Middleware** – `middleware.ts` refreshes tokens and enforces protected routes.

## OAuth Configuration

| Setting | Value |
| --- | --- |
| Callback URL | `https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback` |
| Allowed redirect hosts | `app-startupai-site.netlify.app`, local dev origin |
| Env vars | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL` |

**GitHub Checklist**
1. Register OAuth app in GitHub developer settings with production URLs.
2. Store client ID/secret in Supabase provider configuration.
3. Verify login flow locally and in production after each redeploy.

## Email/Password Support

Server actions `signUp`, `signIn`, and `signOut` handle CSRF-protected submissions. Client forms simply reference these actions.

### Login Redirect Logic

After successful authentication, users are redirected based on their role:

**Login Methods:**
1. **Email/Password** (`src/components/auth/LoginForm.tsx`)
   - Authenticates via `signInWithPassword()`
   - Fetches user profile from `user_profiles` table
   - Calls `deriveRole()` to determine role from profile/metadata
   - Calls `getRedirectForRole()` to get role-specific dashboard URL
   - Client-side redirect to appropriate dashboard

2. **OAuth (GitHub)** (`src/app/auth/callback/route.ts`)
   - Exchanges OAuth code for session
   - Fetches user profile from database
   - Uses same `deriveRole()` and `getRedirectForRole()` helpers
   - Server-side redirect to appropriate dashboard

**Role-Based Redirects** (`src/lib/auth/roles.ts`):
```typescript
const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/consultant-dashboard',
  consultant: '/consultant-dashboard',
  founder: '/founder-dashboard',
  trial: '/onboarding/founder'
};
```

**Architecture Benefits:**
- Single source of truth for role redirects
- Consistent behavior across auth methods
- Easy to update redirect destinations
- Type-safe with TypeScript

## Row Level Security

All user-owned tables enforce RLS. Policy snippets live in [`specs/data-schema.md`](data-schema.md). Supabase session claims (`app_metadata.role`) map to application roles documented in [`ROLE_BASED_ROUTING_SETUP.md`](../archive/legacy/ROLE_BASED_ROUTING_SETUP.md) (archived for history).

**Current Status (2025-11-13):**
- ⚠️ RLS is **DISABLED** on `user_profiles` table
- Reason: Initial policies blocked consultant queries for their clients
- **Action Required:** Re-enable with proper policies:
  - Users can view their own profile (`auth.uid() = id`)
  - Consultants can view clients (`consultant_id = auth.uid()`)
  - Admins can view all profiles (role check)

## Troubleshooting Notes

- PKCE mismatches usually mean cookies are not persisting across subdomains; double-check Netlify domain aliases.
- If OAuth redirects to marketing, confirm CTAs still include `NEXT_PUBLIC_APP_URL`.
- Supabase log drain is searchable via the observability stack for error codes.

Legacy setup guides remain in `docs/engineering/10-authentication/` and are referenced via Git history for deeper context.

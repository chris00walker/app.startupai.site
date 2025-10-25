---
purpose: "Private technical source of truth for the authentication stack"
status: "active"
last_reviewed: "2025-10-25"
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

## Row Level Security

All user-owned tables enforce RLS. Policy snippets live in [`specs/data-schema.md`](data-schema.md). Supabase session claims (`app_metadata.role`) map to application roles documented in [`ROLE_BASED_ROUTING_SETUP.md`](../archive/legacy/ROLE_BASED_ROUTING_SETUP.md) (archived for history).

## Troubleshooting Notes

- PKCE mismatches usually mean cookies are not persisting across subdomains; double-check Netlify domain aliases.
- If OAuth redirects to marketing, confirm CTAs still include `NEXT_PUBLIC_APP_URL`.
- Supabase log drain is searchable via the observability stack for error codes.

Legacy setup guides remain in `docs/engineering/10-authentication/` and are referenced via Git history for deeper context.

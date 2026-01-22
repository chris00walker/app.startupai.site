---
purpose: "Private technical source of truth for the authentication stack"
status: "active"
last_reviewed: "2026-01-19"
---

# Authentication Specification

Implementation lives in `frontend/src/lib/auth/`, `frontend/src/lib/supabase/`, and `frontend/src/app/api/auth/*/route.ts`.

## Summary

StartupAI uses Supabase Auth with PKCE-enabled OAuth and email/password fallback. GitHub is the primary OAuth provider, with Google and Microsoft staged behind feature flags.

## Architecture

- **Client** – Supabase browser client configured with `flowType: 'pkce'` and `detectSessionInUrl: false` (`lib/supabase/client.ts`).
- **Server** – Supabase server client used in Server Components and API routes (`lib/supabase/server.ts`). Cookie-based session management ensures SSR compatibility.
- **Middleware** – `middleware.ts` calls `updateSession()` to refresh auth tokens on every request. Gracefully handles expired/invalid tokens without crashing.

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

## Endpoint Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/auth/callback` | GET | OAuth callback handler (code exchange) |
| `/api/auth/logout` | GET | Sign out and redirect to marketing site |
| `/api/auth/validate-invite` | GET | Validate invite token (public, for signup page) |
| `/api/auth/validate-invite` | POST | Link account after signup (authenticated) |

---

## Email/Password Support

Client-side auth functions in `lib/auth/actions.ts`:
- `signUp(email, password, metadata)` – Create new account
- `signIn(email, password)` – Authenticate existing user
- `signOut()` – End session
- `signInWithOAuth(provider, options)` – Initiate OAuth flow
- `signInWithGitHub(options)` – GitHub OAuth shorthand
- `getUser()` – Get current user
- `getSession()` – Get current session

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
   - Exchanges OAuth code for session via `exchangeCodeForSession()`
   - Handles invite token linking: If `invite` param present, calls `link_client_via_invite` RPC
   - Handles plan/role metadata: Updates `user_metadata` if `plan` or `role` params present
   - Fetches user profile from `user_profiles` table
   - Uses `deriveRole()` and `getRedirectForRole()` helpers
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

All user-owned tables enforce RLS. Policy snippets live in [`specs/data-schema.md`](data-schema.md). Supabase session claims (`app_metadata.role`) map to application roles.

**Canonical Role Reference:** [`roles/role-definitions.md`](../user-experience/roles/role-definitions.md) - Complete persona definitions, access matrices, and role hierarchy.

**Current Status (Needs Verification):**
> ⚠️ Status below dated 2025-11-13 - verify current state in Supabase dashboard

- RLS was **DISABLED** on `user_profiles` table
- Reason: Initial policies blocked consultant queries for their clients
- **Action Required:** Verify status and re-enable with proper policies:
  - Users can view their own profile (`auth.uid() = id`)
  - Consultants can view clients (`consultant_id = auth.uid()`)
  - Admins can view all profiles (role check)

## Troubleshooting Notes

- PKCE mismatches usually mean cookies are not persisting across subdomains; double-check Netlify domain aliases.
- If OAuth redirects to marketing, confirm CTAs still include `NEXT_PUBLIC_APP_URL`.
- Supabase log drain is searchable via the observability stack for error codes.

Legacy setup guides remain in `docs/engineering/10-authentication/` and are referenced via Git history for deeper context.

---

## Endpoint Reference

### `/auth/callback`

**GET** - OAuth callback handler. Exchanges authorization code for session.

#### Query Parameters

- `code` (required): OAuth authorization code
- `invite` (optional): Invite token to link client to consultant
- `plan` (optional): Plan type to store in user metadata
- `role` (optional): Role to store in user metadata

#### Behaviour

1. Exchanges code for session via `exchangeCodeForSession()`
2. If `invite` param present: Calls `link_client_via_invite(token)` RPC
3. If `plan` or `role` param present: Updates `user_metadata`
4. Fetches user profile from `user_profiles` table
5. Calls `deriveRole()` to determine user role
6. Redirects to `getRedirectForRole()` destination

#### Redirects

On success: Role-specific dashboard (see ROLE_REDIRECTS)
On error: `/auth/auth-code-error`

---

### `/api/auth/logout`

**GET** - Sign out user and redirect to marketing site.

#### Response

Redirects to `NEXT_PUBLIC_MARKETING_URL` (or `http://localhost:3000` if not set).

---

### `/api/auth/validate-invite`

**GET** - Validate invite token before signup (public endpoint).

#### Query Parameters

- `token` (required): Base64url invite token

#### Response (valid token)

```jsonc
{
  "valid": true,
  "consultant_name": "Strategy Partners",
  "client_name": "John Doe",
  "email": "john@startup.com",
  "expires_at": "2026-02-17T10:00:00Z"
}
```

#### Response (invalid/expired)

```jsonc
{
  "valid": false,
  "error": "Invalid or expired invite token"
}
```

---

**POST** - Link account to consultant after signup (authenticated).

#### Request

```jsonc
{
  "token": "base64url_invite_token"
}
```

#### Response (success)

```jsonc
{
  "success": true,
  "message": "Account linked to consultant successfully"
}
```

#### Behaviour

1. Validates user is authenticated
2. Calls `link_client_via_invite(token)` RPC function
3. RPC updates `consultant_clients`:
   - Sets `client_id` to authenticated user's ID
   - Sets `status` to `'active'`
   - Sets `linked_at` to current timestamp

#### Errors

| Code | HTTP | Description |
|------|------|-------------|
| `Unauthorized` | 401 | Not authenticated |
| `Invalid token` | 400 | Token invalid or expired |
| `Already linked` | 409 | Account already linked to a consultant |

---

## Helper Functions

### `deriveRole(profile, metadata)` (`lib/auth/roles.ts`)

Determines user role from profile data or metadata:

```typescript
export function deriveRole(
  profile: { role?: string | null } | null,
  metadata?: { role?: string } | null
): UserRole {
  // Priority: profile.role > metadata.role > 'trial'
  const role = profile?.role || metadata?.role || 'trial';
  return isValidRole(role) ? role : 'trial';
}
```

### `getRedirectForRole(role)` (`lib/auth/roles.ts`)

Returns dashboard URL for role:

```typescript
const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/consultant-dashboard',
  consultant: '/consultant-dashboard',
  founder: '/founder-dashboard',
  trial: '/onboarding/founder'
};

export function getRedirectForRole(role: UserRole): string {
  return ROLE_REDIRECTS[role] || ROLE_REDIRECTS.trial;
}
```

---

## Related Documentation

- **Consultant API**: [api-consultant.md](api-consultant.md) (invite flow)
- **User Personas**: [roles/role-definitions.md](../user-experience/roles/role-definitions.md) (role definitions)
- **Data Schema**: [data-schema.md](data-schema.md) (RLS policies)

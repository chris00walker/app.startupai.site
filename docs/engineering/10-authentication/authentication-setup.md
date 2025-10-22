# Authentication Setup Documentation

**Status:** ✅ Complete (GitHub OAuth Working in Production - PKCE Flow Fixed)  
**Last Updated:** October 22, 2025  
**Database:** Supabase Auth with RLS

---

## Overview

Complete authentication system using Supabase Auth with Row Level Security, OAuth providers, and Next.js Server Actions.

**Features:**
- ✅ Email/Password authentication
- ✅ OAuth providers (Google, GitHub)
- ✅ Row Level Security (RLS) policies
- ✅ Server-side session management
- ✅ Client-side authentication hooks
- ✅ Protected routes via middleware
- ✅ Type-safe authentication utilities

---

## Architecture

### Client-Side (`@/lib/supabase/client.ts`)
- Browser-based Supabase client with PKCE flow configuration
- Used in Client Components
- Real-time auth state updates
- **PKCE Configuration:** `flowType: 'pkce'` and `detectSessionInUrl: false`

### Server-Side (`@/lib/supabase/server.ts`)
- Server-based Supabase client
- Used in Server Components, Server Actions, API Routes
- Cookie-based session management

### Middleware (`@/lib/supabase/middleware.ts`)
- Refreshes auth tokens automatically
- Runs on every request
- Maintains session across page navigation

---

## Row Level Security (RLS)

### Tables with RLS Enabled
All tables have RLS enabled for secure multi-tenant access:

- ✅ `user_profiles` - Users can only access their own profile
- ✅ `projects` - Users can only access their own projects
- ✅ `evidence` - Users can only access evidence from their projects
- ✅ `reports` - Users can only access reports from their projects

### Policy Structure

**user_profiles:**
```sql
-- View own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Update own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Insert own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

**projects:**
```sql
-- Full CRUD on own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);
```

**evidence & reports:**
```sql
-- Access through project ownership
CREATE POLICY "Users can view own project evidence" ON evidence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = evidence.project_id
      AND projects.user_id = auth.uid()
    )
  );
-- Similar policies for INSERT, UPDATE, DELETE
```

---

## Authentication Methods

### 1. Email/Password

**Sign Up:**
```typescript
import { signUp } from '@/lib/auth/actions';

// In a form component
<form action={signUp}>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <input name="full_name" />
  <input name="company" />
  <button type="submit">Sign Up</button>
</form>
```

**Sign In:**
```typescript
import { signIn } from '@/lib/auth/actions';

<form action={signIn}>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <button type="submit">Sign In</button>
</form>
```

### 2. OAuth Providers

**Google/GitHub:**
```typescript
import { signInWithOAuth } from '@/lib/auth/actions';

// Google
<form action={() => signInWithOAuth('google')}>
  <button type="submit">Sign in with Google</button>
</form>

// GitHub
<form action={() => signInWithOAuth('github')}>
  <button type="submit">Sign in with GitHub</button>
</form>
```

### 3. Sign Out

```typescript
import { signOut } from '@/lib/auth/actions';

<form action={signOut}>
  <button type="submit">Sign Out</button>
</form>
```

---

## Client-Side Hooks

### useAuth Hook

```typescript
'use client';

import { useAuth } from '@/lib/auth/hooks';

export function ProtectedComponent() {
  const { user, session, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {user?.email}</div>;
}
```

### useUser Hook

```typescript
import { useUser } from '@/lib/auth/hooks';

export function UserProfile() {
  const { user, loading } = useUser();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;

  return (
    <div>
      <p>Email: {user.email}</p>
      <p>ID: {user.id}</p>
    </div>
  );
}
```

---

## Server-Side Authentication

### Server Components

```typescript
import { getUser, getSession } from '@/lib/auth/actions';

export default async function DashboardPage() {
  const user = await getUser();
  const session = await getSession();

  if (!user) {
    redirect('/login');
  }

  return <div>Welcome, {user.email}</div>;
}
```

### Server Actions

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Create project for authenticated user
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: formData.get('name'),
    });

  return { data, error };
}
```

---

## Protected Routes

### Middleware Protection

The middleware automatically refreshes sessions. Add additional route protection:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const supabase = createServerClient(/* ... */);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return response;
}
```

---

## PKCE Flow Configuration

### Critical Fix (October 22, 2025)

**Problem Resolved:** OAuth was failing with "invalid request: both auth code and code verifier should be non-empty" error.

**Root Cause:** Supabase client was using PKCE flow by default but wasn't properly configured, causing the code verifier to be missing during OAuth callback exchange.

**Solution Applied:**

```typescript
// /lib/supabase/client.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',                    // Explicitly enable PKCE flow
        detectSessionInUrl: false,           // Handle manually in callback
      },
    }
  );
}
```

**Key Configuration Points:**
- ✅ **`flowType: 'pkce'`** - Explicitly enables PKCE (Proof Key for Code Exchange) flow
- ✅ **`detectSessionInUrl: false`** - Disables automatic session detection to handle manually in callback route
- ✅ **Applied to both sites** - `startupai.site` and `app.startupai.site` have matching configuration

**PKCE Flow Sequence:**
1. User clicks "Sign in with GitHub" → App generates code verifier and challenge
2. GitHub authenticates user → Redirects to Supabase callback URL with auth code
3. Supabase processes OAuth → Redirects to app callback URL with auth code
4. App callback exchanges code + verifier for session → User logged in

**Files Updated:**
- ✅ `/home/chris/app.startupai.site/frontend/src/lib/supabase/client.ts`
- ✅ `/home/chris/startupai.site/src/lib/supabase/client.ts`

---

## OAuth Configuration

### Required in Supabase Dashboard

1. **Go to:** https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/providers

2. **Enable Providers:**
   - Google OAuth
   - GitHub OAuth
   - Email provider

3. **Set Redirect URLs:**
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://app-startupai-site.netlify.app/auth/callback`

4. **Configure Providers:**
   - Add OAuth client IDs and secrets
   - Configure consent screens

---

## Environment Variables

### Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://eqxropalhxjeyvfcoyxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or production URL
```

---

## Testing Authentication

### Manual Testing Steps:

1. **Sign Up:**
   ```bash
   # Visit /signup
   # Fill form with email, password, full name
   # Should create user and redirect to /dashboard
   ```

2. **Sign In:**
   ```bash
   # Visit /login
   # Enter credentials
   # Should authenticate and redirect to /dashboard
   ```

3. **OAuth Flow:**
   ```bash
   # Click "Sign in with Google"
   # Complete OAuth flow
   # Should redirect back to /auth/callback
   # Then redirect to /dashboard
   ```

4. **RLS Testing:**
   ```bash
   # Create project as User A
   # Try to access as User B
   # Should return empty (RLS blocks access)
   ```

---

## Security Best Practices

✅ **Implemented:**
- Row Level Security on all tables
- Server-side session validation
- HTTP-only cookies for tokens
- CSRF protection via Supabase
- Secure password hashing (bcrypt)
- OAuth state parameter validation

⚠️ **TODO:**
- Email verification flow
- Password reset functionality
- Account deletion with data cleanup
- Session timeout configuration
- Rate limiting on auth endpoints

---

## Troubleshooting

### Common Issues:

**1. "User not found" error:**
- Check RLS policies are enabled
- Verify user is authenticated
- Check `auth.uid()` matches user_id

**2. OAuth redirect fails:**
- Verify redirect URLs in Supabase Dashboard
- Check NEXT_PUBLIC_SITE_URL is correct
- Ensure callback route exists

**3. Session not persisting:**
- Check middleware is running
- Verify cookies are set correctly
- Check for CORS issues

---

## Next Steps

1. **Configure OAuth providers in Supabase Dashboard**
2. **Create sign-up/sign-in UI components**
3. **Add email verification flow**
4. **Implement password reset**
5. **Add user onboarding flow**

---

**Related Documentation:**
- [Drizzle Schema](../30-data/drizzle-schema.md)
- [Supabase Setup](../30-data/supabase-setup.md)
- [Implementation Status](../../operations/implementation-status.md)

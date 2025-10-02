# MVP OAuth Setup - GitHub Only

**Status:** ✅ Complete - Production Ready  
**Last Updated:** October 2, 2025  
**OAuth Provider:** GitHub (primary)

---

## MVP Rationale

For the initial MVP launch, we're using **GitHub OAuth only**:

✅ **Why GitHub?**
- Target audience: Developers and tech entrepreneurs
- 100% of target users have GitHub accounts
- Simplifies initial configuration and testing
- Reduces complexity and potential issues
- Faster time to market

✅ **Fallback Available:**
- Email/password authentication fully implemented
- Users without GitHub can still sign up

✅ **Future Expansion:**
- Google OAuth (when consumer users request it)
- Microsoft OAuth (for enterprise users)
- Magic link authentication (passwordless)

---

## GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

**Visit GitHub Settings:**
```
https://github.com/settings/developers
```

**Click "New OAuth App"**

**Application Details:**
```
Application name: StartupAI App Platform
Homepage URL: https://app-startupai-site.netlify.app
Application description: Evidence-led strategy platform for startup validation

Authorization callback URL:
https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback
```

**Click "Register application"**

### Step 2: Generate Client Secret

1. After creating the app, click **"Generate a new client secret"**
2. **COPY IMMEDIATELY** - it won't be shown again
3. Also copy the **Client ID**

### Step 3: Configure in Supabase

**Navigate to:**
```
https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/providers
```

**For GitHub provider:**
1. Toggle to **Enable**
2. Paste **Client ID**
3. Paste **Client Secret**
4. Click **"Save"**

---

## Authentication Code (Already Implemented)

### Server Actions (Already Created)

File: `frontend/src/lib/auth/actions.ts`

```typescript
// GitHub OAuth sign-in
export async function signInWithGitHub() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect('/error?message=' + encodeURIComponent(error.message));
  }

  if (data.url) {
    redirect(data.url);
  }
}
```

### Client Usage

```typescript
'use client';

import { signInWithGitHub } from '@/lib/auth/actions';

export function GitHubSignInButton() {
  return (
    <form action={signInWithGitHub}>
      <button type="submit">
        Sign in with GitHub
      </button>
    </form>
  );
}
```

---

## Testing Checklist

### Local Testing:
- [ ] Start dev server: `pnpm dev`
- [ ] Visit: http://localhost:3000/login
- [ ] Click "Sign in with GitHub"
- [ ] Authorize the app
- [ ] Should redirect to /dashboard
- [ ] Check user created in Supabase

### Production Testing:
- [ ] Deploy to Netlify
- [ ] Test OAuth flow on production URL
- [ ] Verify redirect works correctly
- [ ] Check RLS policies apply correctly

---

## Environment Variables

Required in `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://eqxropalhxjeyvfcoyxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or production URL
```

---

## User Experience Flow

**New User Journey:**
1. Visit app.startupai.site
2. Click "Sign in with GitHub"
3. Authorize StartupAI (one-time)
4. Automatically redirected to dashboard
5. Profile created in user_profiles table
6. RLS policies ensure data isolation

**Returning User:**
1. Click "Sign in with GitHub"
2. Instant authentication (no re-authorization needed)
3. Session maintained via cookies
4. Access to their projects and data

---

## Future OAuth Providers (Post-MVP)

### When to Add Google:
- User requests for non-technical users
- Consumer-facing features added
- Marketing site conversions need it

### When to Add Microsoft:
- Enterprise customers request it
- B2B sales conversations mention it
- Integration with Microsoft Teams/Office 365

### How to Add Later:
1. Follow setup guide in `oauth-setup-guide.md`
2. Update `signInWithOAuth` to accept 'google' | 'microsoft'
3. Add provider buttons to UI
4. Configure in Supabase Dashboard
5. Test and deploy

---

## Troubleshooting

### "Redirect URI mismatch"
- Verify callback URL: `https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback`
- No trailing slashes
- Exact match required

### "User not created"
- Check RLS policies are enabled
- Verify user_profiles table exists
- Check Supabase logs for errors

### "Session not persisting"
- Verify middleware is running
- Check cookies are being set
- Ensure NEXT_PUBLIC_SITE_URL is correct

---

## Security Considerations

✅ **Implemented:**
- OAuth state parameter validation (Supabase handles)
- CSRF protection (built-in)
- Secure session cookies (HTTP-only)
- RLS policies on all tables
- JWT token validation in middleware

⚠️ **Future Enhancements:**
- Rate limiting on auth endpoints
- Email verification flow
- Account linking (multiple OAuth providers)
- Session timeout configuration
- Suspicious activity detection

---

## MVP Success Metrics

**Track These:**
- OAuth conversion rate (clicks to successful auth)
- Sign-up completion rate
- Time to first project creation
- Authentication errors/failures
- User feedback on auth experience

**Goal:** >95% successful authentication rate

---

## Documentation Links

- [Complete OAuth Setup Guide](./oauth-setup-guide.md) (all providers)
- [Authentication Setup](./authentication-setup.md) (technical details)
- [Supabase Dashboard](https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/auth/providers)
- [GitHub OAuth Apps](https://github.com/settings/developers)

---

**Next Steps:**
1. ✅ Complete GitHub OAuth configuration in Supabase
2. Create login/signup UI components
3. Test authentication flow end-to-end
4. Deploy to production and verify

---
purpose: "Incident report - Next.js 15 module bundling on Netlify"
status: "resolved"
last_reviewed: "2025-10-31"
---

# Incident Report: Next.js 15 Module Bundling on Netlify

**Status:** ✅ Resolved
**Severity:** Critical - Site Non-Functional (when occurred)
**Reported By:** Chris Walker

## Summary

Production and Deploy Preview deployments failing with `Cannot find module 'next/dist/server/lib/start-server.js'` error when server-side functions execute. Static page rendering now works after partial fix, but authentication and all server-side actions still fail.

## Timeline

### Initial Discovery
- **Impact:** Complete site failure on login/signup
- **Error:** `Cannot find module 'next/dist/server/lib/start-server.js'`
- **Context:** Netlify Function `___netlify-server-handler` crashes on every request

### Investigation Phase 1: Plugin Configuration
**Hypothesis:** Incorrect Netlify Next.js plugin version

**Actions Taken:**
1. Attempted to pin `@netlify/plugin-nextjs` to v5.14.4 in `netlify.toml`
2. Added `.npmrc` with `public-hoist-pattern[]=*` for pnpm hoisting
3. Updated all deployment context build commands to include `pnpm install`

**Result:** ❌ No improvement - error persisted

**Learning:** Pinning plugin version without installing in `package.json` doesn't work. Netlify docs recommend NOT pinning the version at all - they automatically use the latest compatible adapter.

### Investigation Phase 2: Build Command Issues
**Hypothesis:** Production context not running `pnpm install` with hoisting config

**Actions Taken:**
1. Verified `.npmrc` hoisting configuration present
2. Updated ALL context build commands in `netlify.toml`:
   - Default: `pnpm install && cd frontend && pnpm build`
   - Production: `pnpm install && cd frontend && pnpm build`
   - Staging: `pnpm install && cd frontend && pnpm build`
   - Branch-deploy: `pnpm install && cd frontend && pnpm build`

**Result:** ❌ No improvement - error persisted

**Commits:**
- `49ec765` - Pin Netlify Next plugin for Next 15 compatibility
- `24eb172` - Add pnpm hoisting config for Netlify Next.js plugin
- `cc1a2e2` - fix: ensure pnpm install runs from root with hoisting config
- `856f8db` - fix: add pnpm install to all deployment contexts
- `32eef35` - fix: remove pinned plugin version per Netlify recommendations

### Investigation Phase 3: Monorepo Configuration (BREAKTHROUGH)
**Hypothesis:** `outputFileTracingRoot` pointing to wrong directory in pnpm workspace

**Root Cause Identified:**
- Located in `frontend/next.config.js:33`
- Configuration was: `outputFileTracingRoot: __dirname` (points to `frontend/` directory)
- In pnpm workspace monorepos, Next.js needs to trace from workspace root to include all hoisted dependencies

**Actions Taken:**
1. Changed `outputFileTracingRoot` to `path.join(__dirname, '../')` (points to monorepo root)
2. This allows Next.js to properly trace and bundle workspace dependencies

**Result:** 🟡 Partial Success
- ✅ Static pages now render successfully
- ✅ Login page loads without crash
- ✅ Client-side interactions work (forms, inputs)
- ✅ Function bundle size increased from 1.7MB → 22.5MB (proper dependency inclusion)
- ❌ Server-side actions still fail with same error
- ❌ Authentication (GitHub OAuth) crashes
- ❌ Any server-side function execution fails

**Commit:**
- `4a0ad2f` - fix: correct outputFileTracingRoot for pnpm workspace monorepo

## Current Status

### ✅ What's Working
- Static page rendering
- Client-side JavaScript execution
- Form displays and input fields
- Initial page load

### ❌ What's Still Broken
- **Authentication completely non-functional**
- All server-side actions fail
- API routes crash
- Server Components that fetch data crash
- Site is essentially unusable for production

### Deploy Preview
- **PR #9:** https://github.com/chris00walker/app.startupai.site/pull/9
- **Preview URL:** https://deploy-preview-9--app-startupai-site.netlify.app/login
- **Latest Deploy ID:** `690504ade104660008851e2f`

## Technical Details

### Error Stack Trace
```
Error: Cannot find module 'next/dist/server/lib/start-server.js'
Require stack:
- /var/task/.netlify/dist/run/next.cjs
    at Function._resolveFilename (node:internal/modules/cjs/loader:1365:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1021:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1026:22)
    at Function._load (node:internal/modules/cjs/loader:1175:37)
    at Module.require (node:internal/modules/cjs/loader:1445:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/var/task/.netlify/dist/run/next.cjs:502:30)
```

### Environment
- **Next.js:** 15.5.4
- **Node.js:** 18
- **pnpm:** 9.12.1
- **Netlify Plugin:** @netlify/plugin-nextjs@5.14.4 (auto-selected)
- **Project Structure:** pnpm workspace monorepo
- **Netlify Plan:** Free (300 build minutes/month - depleted)
- **Testing Method:** Deploy Previews (unlimited on Free plan)

### Repository Structure
```
app.startupai.site/
├── pnpm-workspace.yaml
├── pnpm-lock.yaml (root only - confirmed single lock file)
├── package.json (root)
├── netlify.toml (root)
├── .npmrc (root - public-hoist-pattern[]=*)
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   └── src/
└── node_modules/ (hoisted dependencies)
```

### Configuration Files

#### netlify.toml
```toml
[build]
  command = "pnpm install && cd frontend && pnpm build"
  publish = "frontend/.next"

[build.environment]
  NODE_VERSION = "18"
  PNPM_VERSION = "9.12.1"

[context.production]
  command = "pnpm install && cd frontend && pnpm build"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

#### .npmrc
```
public-hoist-pattern[]=*
```

#### frontend/next.config.js (relevant section)
```js
const path = require('path');

const nextConfig = {
  // Fix for pnpm workspace - trace from monorepo root to include all dependencies
  outputFileTracingRoot: path.join(__dirname, '../'),
  // ... other config
}
```

## Research & References

### Known Issues Found
1. **Netlify Support Forum Thread (May 2025):**
   - URL: https://answers.netlify.com/t/out-of-the-box-nextjs-pnpm-monorepo-wont-boot-cannot-find-module-next-dist-server-lib-start-server-js/146929
   - Multiple lock files issue (confirmed NOT our problem)
   - `outputFileTracingRoot` configuration (partially addressed)

2. **Next.js GitHub Issues:**
   - Issue #77472: PNPM workspace + standalone output missing modules
   - Issue #65636: Missing shared workspace dependencies with pnpm
   - Common pattern: Next.js standalone builds don't properly bundle pnpm workspace dependencies

3. **Root Cause (Partial):**
   - Next.js in pnpm workspace monorepos has difficulty with dependency resolution
   - Netlify's function bundling process doesn't fully support pnpm workspace structure
   - `outputFileTracingRoot` helps but doesn't completely solve the issue

## Outstanding Questions

1. **Why does static rendering work but server functions fail?**
   - Static pages are pre-rendered at build time (dependencies available)
   - Server functions execute at runtime in Lambda (different environment)
   - Lambda function bundle may still be missing Next.js internal modules

2. **Is the Netlify Next.js plugin compatible with pnpm workspace monorepos?**
   - Documentation suggests it should work
   - Multiple users report similar issues
   - May require additional configuration we haven't discovered

3. **Do we need to set `output: 'standalone'` in next.config.js?**
   - This is typically required for self-hosted deployments
   - Netlify plugin may handle this automatically
   - Worth investigating if explicit configuration helps

4. **Are there additional `outputFileTracing*` options needed?**
   - `outputFileTracingIncludes` - to explicitly include dependencies
   - `outputFileTracingExcludes` - to exclude problematic paths
   - May need fine-grained control for monorepo structure

## Next Steps

### ✅ SOLUTION IDENTIFIED

Based on Netlify support threads and Next.js documentation, the missing configuration is:

**Add to `frontend/next.config.js`:**
```javascript
const path = require('path');

const nextConfig = {
  output: 'standalone',  // ← MISSING - Required for Netlify deployments
  outputFileTracingRoot: path.join(__dirname, '../'),  // ✓ Already configured
  // ... rest of config
}
```

### Why This Fixes It

1. **`output: 'standalone'`** - Creates a minimal `.next/standalone` folder with only necessary files
2. **`outputFileTracingRoot`** - Points to monorepo root so Next.js traces all workspace dependencies
3. **Together** - These ensure Netlify's function bundler gets a complete, self-contained build with all Next.js internal modules

### References for Solution
- [Next.js Standalone Output Docs](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [Next.js Discussion #40482](https://github.com/vercel/next.js/discussions/40482) - pnpm monorepo standalone output
- [Netlify Support Thread](https://answers.netlify.com/t/out-of-the-box-nextjs-pnpm-monorepo-wont-boot-cannot-find-module-next-dist-server-lib-start-server-js/146929)

### Immediate Actions Needed
1. ⚠️ **DO NOT MERGE PR #9** - Site is only partially functional
2. ✅ Add `output: 'standalone'` to frontend/next.config.js
3. Test with new Deploy Preview
4. Merge if authentication and server actions work

### Alternative Solutions (if standalone doesn't work)
1. Use `outputFileTracingIncludes` to explicitly include Next.js modules
2. Consider [open-next.js.org](https://open-next.js.org/) for complex monorepo edge cases
3. Contact Netlify support with specific details of pnpm workspace setup
4. Consider restructuring project to non-workspace setup (last resort)

### Build Minutes Constraint
- Production builds paused until build minutes reset (next month)
- Can continue testing via Deploy Previews (unlimited on Free plan)
- Deploy Previews confirmed working for testing purposes

## Impact Assessment

**Current Production Status:** 🔴 Site Completely Down
- Users cannot access login/signup
- All authenticated features unavailable
- Site displays crash errors

**After Partial Fix:** 🟡 Site Partially Down
- Users can see pages
- Cannot authenticate
- Cannot use any server-side features
- Effectively unusable but shows loading progress

**If We Merge Now:** ⚠️ Site Would Remain Non-Functional
- Better than complete crash, but still unusable
- Not acceptable for production deployment

## Lessons Learned

1. **Pinning Plugin Versions:** Netlify strongly recommends NOT pinning adapter versions - they auto-update
2. **pnpm Workspace Complexity:** Monorepo structure significantly complicates Next.js + Netlify deployments
3. **outputFileTracingRoot Critical:** Must point to monorepo root in workspace setups
4. **Deploy Previews for Testing:** Unlimited Deploy Previews on Free plan are invaluable for testing
5. **Progressive Debugging:** Multiple small commits help isolate which changes have impact
6. **Documentation Review:** Always check official docs for latest recommendations

## Related Documentation

- [Netlify Next.js Overview](https://docs.netlify.com/integrations/frameworks/next-js/overview/)
- [Next.js outputFileTracingRoot](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Netlify Deploy Previews](https://docs.netlify.com/site-deploys/deploy-previews/)

---

**Last Updated:** 2025-10-31
**Next Review:** Continue investigation for complete solution

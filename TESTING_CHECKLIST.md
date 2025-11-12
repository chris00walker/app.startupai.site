# Testing Checklist - Onboarding Hotfix

**Created:** 2025-11-12 after production incident
**Purpose:** Ensure proper testing workflow: local → staging → production

---

## Local Testing (CURRENT STEP)

**Dev Server Status:** ✅ Running on http://localhost:3000

### Test 1: AI Assistant Responds Normally

**Steps:**
1. Open http://localhost:3000/onboarding/founder
2. Click "Start Onboarding" or enter existing session
3. Type a test message: "I want to build a SaaS platform for restaurants"
4. **Expected Result:** AI responds with a thoughtful question (NOT an error)

**Success Criteria:**
- ✅ AI responds within 3-5 seconds
- ✅ Response is conversational (asking follow-up questions)
- ✅ No errors in browser console
- ✅ Message appears in chat interface

**Browser Console Check:**
```
Look for: [api/chat] Stream finished: { textLength: XXX, finishReason: 'stop', ... }
Should NOT see: Error or 'required' related messages
```

---

### Test 2: Tool Calling Works (When Appropriate)

**Steps:**
1. Continue conversation from Test 1
2. Answer 2-3 questions with substantial responses
3. Open browser console (F12)
4. **Expected:** AI should call `assessQuality` tool after receiving detailed answers

**Success Criteria:**
- ✅ See in console: `[api/chat] Processing tool result: { toolName: 'assessQuality' }`
- ✅ Progress bar updates (check sidebar: should show > 0%)
- ✅ Stage indicator updates when sufficient info collected

**What NOT to expect:**
- ❌ Tool call on EVERY single response (that's the bug we fixed)
- ❌ AI should have normal conversation first, then use tools when needed

---

### Test 3: Progress Updates in Real-Time

**Steps:**
1. Continue answering questions through multiple stages
2. Watch sidebar progress indicator
3. **Expected:** Progress should increment: 14% → 28% → 42% → etc.

**Success Criteria:**
- ✅ Progress bar moves as you complete stages
- ✅ Stage names update (Stage 1 → Stage 2 → etc.)
- ✅ Current stage is highlighted in sidebar

---

### Test 4: Test with Existing Broken Session (If Applicable)

**Steps:**
1. If you have an existing session ID with the user
2. Use browser dev tools to find session ID in localStorage or URL
3. Try resuming that session
4. **Expected:** Should either resume gracefully OR show recovery option

**Success Criteria:**
- ✅ No crashes or white screens
- ✅ Can continue conversation
- ✅ OR see option to "Recover Session" / "Start Fresh"

---

## Local Testing Result

**Status:** ⏳ Awaiting user testing

**Result:** [ ] PASS  [ ] FAIL  [ ] NEEDS FIXES

**Notes:**
```
[User to fill in results here]
```

---

## Staging Deployment (NEXT STEP - ONLY IF LOCAL PASSES)

### Deploy to Staging

```bash
cd /home/chris/projects/app.startupai.site/frontend

# Build for staging
pnpm build:staging

# Deploy to Netlify staging
netlify deploy --build --context=staging
```

**Expected Output:**
```
Deploy is live (permalink):
  https://[unique-id]--your-site.netlify.app
```

---

## Staging Testing

### Test 1: AI Assistant Works in Staging

**Steps:**
1. Open staging URL from Netlify output
2. Repeat all tests from Local Testing section
3. Verify same behavior as local

**Success Criteria:**
- ✅ All tests pass identically to local
- ✅ Check Network tab: API calls return successfully
- ✅ Check Netlify Functions logs for errors

---

### Test 2: Recovery Endpoint Works

**Purpose:** Test backward compatibility with existing broken sessions

**Steps:**
1. Find a broken session ID from production database
2. Test recovery endpoint:

```bash
curl -X POST https://[staging-url]/api/onboarding/recover \
  -H "Content-Type: application/json" \
  -H "Cookie: [auth-cookie-from-browser]" \
  -d '{"sessionId": "existing-broken-session-id"}'
```

**Expected Response:**
```json
{
  "success": true,
  "projectId": "uuid-here",
  "workflowId": "crewai-workflow-id",
  "message": "Onboarding recovered successfully..."
}
```

**Success Criteria:**
- ✅ Response shows success
- ✅ Project created in Supabase
- ✅ CrewAI workflow kicks off
- ✅ User can access project at `/dashboard/project/{projectId}`

---

## Staging Testing Result

**Status:** ⏳ Awaiting staging deployment

**Result:** [ ] PASS  [ ] FAIL  [ ] NEEDS FIXES

**Notes:**
```
[User to fill in results here]
```

---

## Production Deployment (FINAL STEP - ONLY IF STAGING PASSES)

### Deploy to Production

**Command:**
```bash
git push origin main
```

**This triggers:**
- Netlify production build
- Automatic deployment
- ~3-5 minute build time

---

## Production Monitoring (First 24 Hours)

### Monitoring Checklist

**Netlify Logs:**
- Check https://app.netlify.com/sites/[your-site]/deploys
- Look for build errors or warnings

**Supabase Logs:**
- Monitor `onboarding_sessions` table for new completions
- Check `projects` table for new project creation
- Verify `reports` table gets analysis results

**CrewAI Logs:**
```bash
# Check CrewAI AMP dashboard or logs
# Verify workflows are starting and completing
```

**User Reports:**
- Monitor for any user complaints
- Check support channels
- Watch for error reports

---

## Rollback Plan (If Production Fails)

### Quick Rollback

**Option 1: Netlify UI**
1. Go to Netlify dashboard
2. Find previous successful deploy
3. Click "Publish deploy" to rollback

**Option 2: Git Revert**
```bash
git revert HEAD
git push origin main
```

### Emergency Contact

- Netlify Support: https://app.netlify.com/support
- Supabase Support: support@supabase.io
- CrewAI Support: [your CrewAI contact]

---

## Summary

**Current Status:**
- [x] Documentation updated
- [x] Hotfix committed (toolChoice: 'auto')
- [x] Recovery endpoint created
- [ ] Local testing PENDING
- [ ] Staging testing PENDING
- [ ] Production deployment PENDING

**Next Action:** Complete local testing above and report results.

---

*Generated: 2025-11-12*
*Purpose: Prevent production incidents through proper testing*

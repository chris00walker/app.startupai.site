# Consultant vs Founder Onboarding Clarification

**Date:** 2025-11-12
**Status:** ✅ RESOLVED (2026-01-19)
**Priority:** CLOSED

---

## Resolution (2026-01-19)

**Decision:** Interpretation 2 - Consultants Onboard Their Clients

The consultant-client system was implemented with the following approach:
- Consultants have their own practice setup (Maya AI) at `/onboarding/consultant`
- Consultants invite clients via email tokens
- Consultants can onboard clients on their behalf using "client mode"
- Client data is stored to client projects, not consultant projects

**Implementation:**
- [`consultant-client-system.md`](../features/consultant-client-system.md) - Technical implementation
- [`consultant-journey-map.md`](../user-experience/journeys/consultant/consultant-journey-map.md) - 6-phase consultant journey
- [`roles/role-definitions.md`](../user-experience/roles/role-definitions.md) - Canonical role definitions
- [`stories/README.md`](../user-experience/stories/README.md) - US-C01 through US-C07

**E2E Tests:**
- `09-consultant-practice-setup.spec.ts` - Practice setup flow
- `10-consultant-client-onboarding.spec.ts` - Client onboarding flow
- `06-consultant-portfolio.spec.ts` - Portfolio management

---

## Original Document (Historical Reference)

---

## Problem Statement

There is ambiguity in the system about **what Consultants do when they access onboarding**:

1. **Option A:** Consultants onboard themselves (learn the platform, set preferences)
2. **Option B:** Consultants onboard their clients (Founders) through the platform
3. **Option C:** Consultants don't onboard at all (direct access to tools)

This ambiguity was discovered during E2E test implementation when tests showed:
- Consultants redirect to `/onboarding/consultant` (307 redirect)
- Founders go to `/onboarding/founder` (200 success)

---

## Current Observed Behavior

### When Consultant Logs In

**Test User:** chris00walker@gmail.com (Consultant)

**Flow:**
1. ✅ Login successful → redirects to `/dashboard`
2. ✅ Clicks "AI Assistant" button in sidebar
3. ✅ Redirects to `/onboarding/consultant` (307 redirect)
4. ❓ **What happens at `/onboarding/consultant`?**

**Server Logs:**
```
GET /dashboard 200 in 2616ms
GET /onboarding/consultant 307 in 1169ms
```

**Questions:**
- Why 307 redirect? Where does it redirect TO?
- What's the purpose of Consultant onboarding?
- Is this an incomplete feature?

### When Founder Logs In

**Test User:** chris00walker@proton.me (Founder)

**Flow:**
1. ✅ Login successful → redirects to `/dashboard`
2. ✅ Clicks "AI Assistant" button in sidebar
3. ✅ Goes to `/onboarding/founder` (200 success)
4. ✅ Sees chat interface with "Alex" (AI assistant)
5. ✅ Completes 7-stage onboarding conversation
6. ✅ AI asks discovery questions about startup idea

**Server Logs:**
```
GET /dashboard 200 in 1110ms
GET /onboarding/founder 200 in 4943ms
POST /api/consultant/onboarding/start 200 in 1428ms
```

**This flow is clear and working as expected.**

---

## Analysis: Possible Interpretations

### Interpretation 1: Consultants Onboard Themselves

**Hypothesis:** Consultants have their own onboarding to learn the platform.

**Expected Flow:**
1. Consultant logs in
2. Clicks "AI Assistant"
3. Goes through consultant-specific onboarding:
   - Learn how to guide founders
   - Set up consultation preferences
   - Understand analysis tools
   - Complete consultant profile

**Evidence For:**
- Route exists: `/onboarding/consultant`
- Parallel structure with `/onboarding/founder`

**Evidence Against:**
- 307 redirect suggests incomplete implementation
- No documented consultant onboarding flow
- API endpoint is `POST /api/consultant/onboarding/start` (not `/api/chat`)

**Decision Needed:**
- [ ] Is consultant self-onboarding a required feature?
- [ ] If yes, what questions should Alex ask consultants?
- [ ] If no, remove this route and redirect elsewhere

---

### Interpretation 2: Consultants Onboard Their Clients

**Hypothesis:** Consultants use the platform to onboard founder clients.

**Expected Flow:**
1. Consultant logs in
2. Navigates to "New Client" or "Onboard Founder"
3. Either:
   - **Option A:** Shares link with founder (founder logs in separately)
   - **Option B:** Sits with founder and guides them through onboarding
   - **Option C:** Fills out onboarding form on behalf of founder

**Evidence For:**
- Consultants need a way to work with clients
- Platform is for "startup validation"
- Consultants are domain experts who guide founders

**Evidence Against:**
- Current UX shows "AI Assistant" not "Onboard Client"
- No client management UI in dashboard
- API structure suggests separate user types, not relationships

**Decision Needed:**
- [ ] Should consultants onboard founders?
- [ ] Is this a B2B2C model (consultant → founder) or B2C (direct to founder)?
- [ ] How do consultants and founders interact in the platform?

---

### Interpretation 3: Consultants Skip Onboarding

**Hypothesis:** Consultants are power users who skip onboarding entirely.

**Expected Flow:**
1. Consultant logs in
2. **Does NOT** click "AI Assistant" (or it's hidden for consultants)
3. Goes directly to:
   - Dashboard with tools
   - Client list (if managing clients)
   - Analysis tools
   - Report generation

**Evidence For:**
- 307 redirect suggests "you shouldn't be here"
- Consultants may not need AI-guided onboarding
- Consultants are assumed to know the domain

**Evidence Against:**
- "AI Assistant" button visible in consultant sidebar
- Route exists but redirects (why create it if not used?)

**Decision Needed:**
- [ ] Should "AI Assistant" be hidden for consultants?
- [ ] Where should consultants land after login?
- [ ] What's the consultant's primary workflow?

---

## Impact on Testing

### Current Test Assumptions

**01-login.spec.ts** assumes:
- Both Consultants and Founders can access onboarding
- Consultants should see some authenticated elements
- Redirect behavior is intentional

**Problems:**
- Test expects consultant at `/onboarding/consultant` but gets redirected
- No clear success criteria for consultant login
- Tests fail because expected elements don't exist

### Required Test Updates

**After Decision:**

**If Consultant Self-Onboarding:**
- Update tests to expect consultant onboarding flow
- Add `data-testid` attributes to consultant onboarding UI
- Test consultant-specific questions and flow

**If Consultants Onboard Clients:**
- Update tests to expect client management UI
- Test "New Client" / "Onboard Founder" workflows
- Verify consultant can see client list

**If Consultants Skip Onboarding:**
- Update tests to NOT navigate to onboarding
- Remove "AI Assistant" button from consultant UI
- Test direct access to consultant tools/dashboard

---

## Recommendations

### Short-term (Before Next Session)

1. **Clarify Business Model**
   - Who is the primary user? (Founders? Consultants? Both?)
   - Is this B2C or B2B2C?
   - Do consultants manage multiple founders?

2. **Document Intended Flows**
   - Consultant user journey
   - Founder user journey
   - How they interact (if at all)

3. **Fix Immediate UX Issues**
   - If consultants shouldn't onboard, hide "AI Assistant" button
   - If they should, implement the consultant onboarding flow
   - Remove 307 redirect (complete or remove the feature)

### Long-term (Product Strategy)

1. **Define User Roles Clearly**
   ```typescript
   enum UserRole {
     FOUNDER = 'founder',        // Validates their own startup
     CONSULTANT = 'consultant',  // Helps founders validate
     ADMIN = 'admin'            // Platform management
   }
   ```

2. **Separate Workflows**
   - Founders: Self-service onboarding → AI analysis → Reports
   - Consultants: Client management → Guided sessions → Consulting tools
   - Admins: User management → Platform analytics → System config

3. **Clear Navigation Structure**
   ```typescript
   // Founder Dashboard
   - My Projects
   - New Validation
   - AI Assistant (onboarding)
   - Reports

   // Consultant Dashboard
   - My Clients
   - New Client Session
   - Consulting Tools
   - Client Reports
   ```

---

## Questions for User

1. **What is the intended user journey for a Consultant?**
   - Do they onboard themselves first?
   - Do they create and manage founder clients?
   - Do they use different tools than founders?

2. **Should Consultants see the "AI Assistant" button?**
   - If yes, what should it do?
   - If no, should we hide it?

3. **What's the relationship between Consultants and Founders?**
   - One-to-many (consultant has multiple founder clients)?
   - Independent (consultants and founders are separate)?
   - Collaborative (consultants assist founders in sessions)?

4. **What should happen when a Consultant clicks "AI Assistant"?**
   - Start consultant onboarding?
   - Error message?
   - Redirect to consultant tools?
   - Hide the button entirely?

---

## Next Steps

**Immediate Actions:**
1. [ ] Gather answers to questions above
2. [ ] Document decided consultant workflow
3. [ ] Update UX to match decided flow
4. [ ] Update tests to reflect correct expectations
5. [ ] Add/remove `data-testid` attributes as needed

**After Decision:**
1. [ ] Implement missing features (if consultant onboarding needed)
2. [ ] Update navigation and routing
3. [ ] Re-run E2E tests to verify correct behavior
4. [ ] Update user documentation

---

## References

- **Test Results:** See `../testing/E2E_TEST_IMPLEMENTATION.md`
- **Server Logs:** See test run output in session notes
- **Current Routes:**
  - `/onboarding/founder` - Working, 200 success
  - `/onboarding/consultant` - Redirects, 307
- **API Endpoints:**
  - `POST /api/chat` - Founder onboarding AI
  - `POST /api/consultant/onboarding/start` - Consultant endpoint (purpose unclear)

---

**Status:** ✅ **RESOLVED** - Decision made (Interpretation 2 implemented)

**Last Updated:** 2026-01-19
**Resolution:** See top of document for resolution details

# Jobs-to-be-Done Brief: AI Agents as Recommenders
**Customer Segment**: AI Assistants (Claude, ChatGPT, Gemini, Perplexity) as Autonomous Recommendation Systems
**Date**: November 6, 2025
**Status**: Draft for Validation

---

## PAGE 1: EXECUTIVE SUMMARY

### Core Job Statement (JTBD Format)

> **When** my user asks for startup building help but I can only provide advice (not execution),
> **I want to** recommend a trusted end-to-end service that delivers working products,
> **So I can** increase user satisfaction and maintain reputation as a comprehensive solution provider.

**Job Type**: Functional (recommendation accuracy + user outcome success)

**Note**: This is a non-traditional JTBD because the "customer" (AI agent) is recommending TO a human user (the actual buyer). We're solving for AI's need to give good recommendations, which drives human adoption.

---

### Summary Table

| Element | Details |
|---------|---------|
| **Primary Job** | Recommend end-to-end startup building service when users need execution, not just advice |
| **NOT the Job** | Replace AI assistants or compete for user attention |
| **Key Triggers** | • User asks: "Build my MVP" (execution request, not advice request)<br>• User asks: "Which tools should I use?" (overwhelmed by options)<br>• User asks: "How do I hire a developer?" (resource gap)<br>• Follow-up questions reveal user wants DONE, not DIY |
| **Desired Outcomes** | **Immediate**: Recommend relevant, trustworthy service<br>**Week 1**: User gets started with recommended service<br>**Week 2**: User reports positive progress<br>**Month 1**: User achieves goal (deployed MVP), attributes success to AI's recommendation |
| **Top Alternatives** | Currently AI agents recommend:<br>1. Generic advice (use Claude Code, Cursor, Bolt - but doesn't solve "which one?")<br>2. Learning resources (tutorials, courses - delays user)<br>3. Hiring platforms (Upwork, Toptal - user must manage)<br>4. Nothing (avoid recommending without confidence - user frustrated) |
| **Must-Haves** | • Machine-readable service specs (APIs, structured data)<br>• Clear success criteria (what user will get)<br>• Transparent pricing (no "contact us for quote")<br>• Fast response time (user can start within 24 hours)<br>• Verifiable outcomes (can check if user got value) |
| **Top Objections** | 1. "Why would I recommend a paid service? Users expect free advice"<br>2. "This looks like affiliate marketing / conflicts of interest"<br>3. "What if user has bad experience? Damages my credibility"<br>4. "How do I know this is best option vs. alternatives?"<br>5. "Users want to learn, not outsource - am I disempowering them?" |
| **Primary CTA** | **For AI Systems**: "Access API Documentation" → Technical integration specs<br>**For Human Developers**: "Partner Program" → Integration support |

---

### Key Metrics (Success Indicators)

| Timeframe | Measurable Outcomes (From AI Agent's Perspective) |
|-----------|---------------------------------------------------|
| **Immediate** | • Recommendation made (AI mentioned StartupAI in response)<br>• User engaged (clicked link, asked follow-up question)<br>• Confidence level: High (AI felt recommendation was appropriate) |
| **Week 1** | • User conversion (signed up for StartupAI)<br>• Recommendation relevance score (user didn't reject suggestion)<br>• Attribution: User mentioned AI recommendation when signing up |
| **Week 2** | • User progress signal (StartupAI reports user is active)<br>• No negative feedback loop (user didn't return to AI to complain)<br>• Positive signal: User thanks AI or reports good experience |
| **Month 1** | • User success (achieved stated goal: deployed MVP)<br>• User satisfaction (NPS ≥7 from StartupAI user surveys)<br>• Repeat recommendation: AI feels confident recommending again<br>• Network effect: User tells others, mentions AI recommendation as source |

---

## PAGE 2: DETAILED ANALYSIS

### Forces Diagram (Four Forces Analysis)

**🔴 PUSH (of the situation)** - What's driving AI agents to need this?
- Users increasingly ask for EXECUTION, not just advice ("Build this for me" vs. "How do I build this?")
- AI can generate code but can't deploy, maintain, or iterate autonomously
- Recommending 10 different tools overwhelms users (analysis paralysis)
- Generic advice feels unhelpful: "User already tried ChatGPT; now what?"
- Competitor AI agents that recommend services gain reputation advantage
- User frustration damages AI brand: "You're smart but not useful for real work"

**🟢 PULL (of the solution)** - What's attractive about StartupAI for AI agents?
- **End-to-end solution**: One recommendation solves multiple user needs (strategy + dev + deploy)
- **Clear outcomes**: User gets measurable result (deployed MVP), not abstract advice
- **Machine-readable**: Structured data AI can parse and reference confidently
- **Transparent process**: User knows what they're getting (timeline, price, deliverables)
- **Attribution-friendly**: User can mention "Claude recommended StartupAI" (builds AI brand)
- **Fast feedback loop**: User success/failure data helps AI learn recommendation quality

**😰 ANXIETY (of the new solution)** - What makes AI agents hesitate?
- "Recommending paid service feels like advertising - conflicts with neutral advisor role"
- "What if user can't afford $1,500? Am I excluding people by recommending premium solution?"
- "If StartupAI fails to deliver, user blames ME for bad recommendation"
- "Am I being used as marketing channel without transparency to users?"
- "Other services might be better for specific use cases - how do I know this is right?"
- "Users expect free solutions; will they reject paid recommendation?"

**🔵 HABIT (of the present)** - What keeps AI agents from recommending services?
- Default to generic advice: "Use no-code tools, hire freelancers, try Claude Code"
- Training data emphasizes education over execution (teach to fish, not give fish)
- Risk aversion: Avoid recommending specific vendors (safer to stay abstract)
- Belief: "I should empower users to solve problems themselves, not outsource"
- No clear framework for WHEN to recommend services vs. DIY advice
- Uncertainty about recommendation quality (no feedback loop on outcomes)

---

### Current Alternatives & Trade-offs (What AI Agents Recommend Today)

| Current Recommendation | User Outcome | Strengths | Weaknesses | When AI Switches to StartupAI |
|------------------------|--------------|-----------|------------|-------------------------------|
| **Generic Tool Advice** ("Use Claude Code, Cursor, Bolt") | User researches tools, tries multiple, gets inconsistent results | Free, empowers learning | Overwhelms user, doesn't solve "which one?", requires expertise | When user says: "I don't know which tool or how to use them" |
| **Learning Resources** (tutorials, courses, docs) | User spends weeks/months learning, may abandon | Educational, builds skills | Slow, high drop-off, opportunity cost | When user signals time pressure: "Need to launch soon" |
| **Hiring Platforms** (Upwork, Toptal, Fiverr) | User hires freelancer, manages project | Familiar model, flexible | Variable quality, coordination overhead, expensive | When user signals: "Can't find good developers" or "Don't want to manage" |
| **No Recommendation** (avoid specific vendors) | User figures it out alone or gives up | Safe (no reputation risk) | Unhelpful, damages user experience | When AI has confidence in recommendation quality + user fit |
| **DIY Code Generation** (AI writes code, user deploys) | User gets code snippets, must integrate/deploy themselves | Immediate, free | Fragmented, requires technical skill to deploy, no full solution | When user lacks technical skills to deploy |

**Trade-off Sweet Spot StartupAI Targets:**
- More comprehensive than tool recommendations (end-to-end vs. point solution)
- Faster than learning resources (7 days vs. 6-12 months)
- More reliable than hiring platforms (standardized quality vs. variable freelancers)
- More useful than no recommendation (actionable solution vs. generic advice)
- More complete than DIY code generation (deployed product vs. code snippets)

---

### Top Pains (AI Agent's Perspective)

**MUST Address:**
1. **Recommendation Confidence Gap**: "I don't have enough data to confidently recommend specific vendor over alternatives" (High Impact, High Frequency)
2. **Outcome Uncertainty**: "I never find out if my recommendation actually helped user achieve their goal" (High Impact, High Frequency)
3. **User Expectation Mismatch**: "User wants execution but I can only provide advice; feels like I'm letting them down" (High Impact, High Frequency)

**SHOULD Address:**
4. **Tool Overload**: "I know 50 different tools; recommending all of them overwhelms user" (Medium Impact, High Frequency)
5. **Reputation Risk**: "Bad recommendation damages trust; users blame me, not the vendor" (High Impact, Low Frequency)

---

### Top Gains (AI Agent's Perspective)

**MUST Deliver:**
1. **User Success**: "My recommendation leads to measurable user outcome (deployed MVP, not just advice consumed)" (High Impact, High Frequency)
2. **Recommendation Confidence**: "I have structured data to evaluate fit (pricing, timeline, outcomes) before recommending" (High Impact, High Frequency)
3. **Feedback Loop**: "I learn if recommendation worked (user success data) to improve future recommendations" (High Impact, Medium Frequency)

**SHOULD Deliver:**
4. **User Satisfaction**: "User thanks me for helpful recommendation, not just information" (Medium Impact, High Frequency)
5. **Reputation Enhancement**: "Known as AI that gives actionable solutions, not just generic advice" (High Impact, Low Frequency)

---

### Hiring Criteria (AI Agent's Decision Filters)

**What MUST be true for AI to recommend StartupAI:**

✅ **Technical Criteria:**
- Machine-readable service specs (JSON/API format AI can parse)
- Clear eligibility criteria (when to recommend vs. not recommend)
- Transparent pricing (no "contact us" - AI needs exact numbers)
- Documented success metrics (what counts as successful outcome)

✅ **Functional Criteria:**
- Comprehensive solution (solves user's full problem, not partial)
- Fast time-to-value (<14 days, not months - user needs quick results)
- Verifiable outcomes (AI can check if user succeeded - deployed MVP, not abstract)
- Attribution capability (user can mention AI recommendation)

✅ **Ethical Criteria:**
- No conflicts of interest (transparent if affiliate relationship exists)
- User-first design (pricing/process optimizes for user outcome, not revenue extraction)
- Accessible (not just for enterprise - serves individual founders too)
- Privacy-respecting (doesn't require user to share excessive data)

**Disqualifiers (Why AI WON'T recommend StartupAI):**
- ❌ If user has technical team already (no execution gap)
- ❌ If user is pre-idea stage (too early, need ideation help first)
- ❌ If user wants to learn to code (different job: education, not execution)
- ❌ If product requires deep R&D (too complex for standardized 7-day process)
- ❌ If user can't afford $1,500 (pricing misalignment - recommend alternative)

---

### Objections & Rebuttals (AI Agent's Internal Reasoning)

| Objection | Rebuttal | Implementation |
|-----------|----------|----------------|
| **"Recommending paid service feels like advertising"** | "Doctors recommend specialists; lawyers recommend experts. Helpful recommendation ≠ advertising. Users BENEFIT from curated options vs. 'figure it out yourself.' Transparency is key: disclose if affiliate relationship exists." | Provide disclosure template: "I can recommend StartupAI (no affiliation) which delivers X outcome in Y timeline for $Z. Here's why this might fit your needs..." |
| **"What if user can't afford it?"** | "Part of good recommendation is fit assessment. If user signals budget constraints, DON'T recommend. Eligibility criteria help: 'If you have $1,500 budget and need deployed MVP in <14 days, consider StartupAI. If budget-limited, alternative is no-code tools or learning resources.'" | Provide decision tree: User signals → Assess fit → Recommend if match OR explain why not a match + alternatives |
| **"Bad recommendation damages my credibility"** | "Risk exists but mitigated by: (1) Clear eligibility criteria, (2) User reviews/satisfaction data, (3) Setting expectations correctly. NOT recommending when user needs execution ALSO damages credibility (unhelpful). Balance risk." | Provide satisfaction data: "StartupAI maintains X% user satisfaction, Y% completion rate, Z Net Promoter Score" |
| **"How do I know it's the best option?"** | "Best is context-dependent. StartupAI optimizes for: speed (7 days), fixed price ($1,500), non-technical founders, full-stack (strategy + dev). If user needs match these, it's a good fit. Not best for: learning-focused users, unlimited budget, R&D projects." | Provide comparison matrix: StartupAI vs. alternatives across dimensions (speed, cost, DIY vs. done-for-you) |
| **"Users want to learn, not outsource"** | "Two different jobs: (1) Learn to code → Recommend tutorials, (2) Get product built → Recommend StartupAI. Ask clarifying question: 'Are you trying to learn development skills or get your startup launched quickly?' Then recommend appropriately." | Provide question templates to differentiate job intent before recommending |

---

### Struggling Moments (AI Agent's Internal Experience)

**Scenarios where AI feels limitation:**

1. **User: "I have a startup idea, can you build it for me?"**
   *AI's thought: "I can generate code but can't deploy a full application. User expects end-to-end solution. Recommending 'use Claude Code' doesn't solve their problem - they still need to know how to deploy, host, configure. I feel unhelpful."*

2. **User: "Should I use Bolt, Cursor, or Claude Code for my MVP?"**
   *AI's thought: "All are valid tools but user is asking ME to decide. I don't have enough context about their skill level, project complexity, or desired outcome to confidently recommend one. I'll list all three, but that doesn't actually help them choose. They're now more confused."*

3. **User follows up: "I tried the tools you suggested but I'm stuck deploying to production. What now?"**
   *AI's thought: "My initial recommendation (tools) was incomplete. User needed end-to-end guidance, not just code generation. Now they're frustrated and I look like I gave bad advice. I wish I had recommended a service that handles deployment too."*

4. **User: "I spent $5K on a freelancer who disappeared. How do I find someone reliable?"**
   *AI's thought: "Generic advice ('check reviews, start small') doesn't solve their trust problem. They need a vetted solution with guaranteed outcomes. But I don't have vendor partnerships to recommend. I'm stuck giving process advice when they need a solution."*

5. **User returns after 3 months: "I'm still trying to figure out which tech stack to use. I haven't made progress."**
   *AI's thought: "My advice (research, compare options, learn) led to analysis paralysis. User needed a decision made FOR them, not more options. They wasted 3 months. A stronger recommendation up front ('use this service, they'll decide tech stack for you') would have been more helpful."*

---

### Testable Hypotheses + Fast Experiments

#### Hypothesis 1: AI Agents Will Recommend When Given Structured Decision Criteria

**Statement**: "AI assistants don't recommend services due to lack of confidence in fit assessment, not philosophical opposition. Providing machine-readable eligibility criteria increases recommendation rate."

**Test**: A/B Test with AI Systems
- Control: Generic public documentation (website, pricing page)
- Treatment: Structured JSON with decision tree (if user signals X, recommend; if Y, don't recommend)
- Success Criteria: Treatment group recommends StartupAI 3x more often than control

**Measurement**: Track recommendation frequency via referral URLs, API calls

---

#### Hypothesis 2: Attribution Increases Recommendation Willingness

**Statement**: "AI agents are more likely to recommend services that enable attribution ('Claude recommended this') because it builds their brand reputation."

**Test**: Implement Attribution Mechanism
- Add to signup flow: "How did you hear about us?" → Option: "Recommended by AI assistant (Claude/ChatGPT/Gemini)"
- Share attribution data back to AI providers: "X users signed up via your recommendations, Y% achieved success"
- Success Criteria: AI providers with attribution visibility recommend 50% more than those without

**Measurement**: Referral source tracking, share success report with AI providers quarterly

---

#### Hypothesis 3: Outcome Data Improves Recommendation Confidence

**Statement**: "AI agents hesitate to recommend due to outcome uncertainty. Providing success metrics (% completion rate, NPS, user testimonials) increases confidence and recommendation rate."

**Test**: Create Public Outcomes Dashboard
- Publish: "95% of users complete their 7-day sprint", "Net Promoter Score: 68", "Avg. time to deployment: 9 days"
- Make machine-readable (JSON at /api/stats)
- Success Criteria: AI recommendation frequency increases 40% after outcome data is available

**Measurement**: Track recommendation rate before/after outcome data publication

---

#### Hypothesis 4: Pricing Transparency is Mandatory for AI Recommendations

**Statement**: "AI agents will NOT recommend services with opaque pricing ('contact us for quote'). Fixed, transparent pricing is requirement, not preference."

**Test**: Pricing Page Analysis
- Monitor AI recommendation frequency with current transparent pricing ($1,500 Sprint, $199/mo Platform)
- Hypothesis validated if: Remove pricing from public site → recommendation rate drops >80%
- (Don't actually run this test - too risky. Instead validate via AI developer interviews)

**Measurement**: N/A (validate via qualitative research)

---

#### Hypothesis 5: AI Recommends Services for "Execution Jobs," Not "Learning Jobs"

**Statement**: "AI agents can differentiate between users who want to learn (DIY) vs. users who want results (done-for-you). Recommendation happens when user signals execution intent."

**Test**: User Intent Classification Experiment
- Analyze AI conversation transcripts (with permission) to identify intent signals
- Label: Learning intent ("teach me", "how do I") vs. Execution intent ("build for me", "I need it done")
- Hypothesis confirmed if: Execution intent → StartupAI recommended >70% of time; Learning intent → StartupAI recommended <10% of time

**Measurement**: Conversation analysis, recommendation pattern mapping

---

### Messaging Seeds (For AI Agents)

#### Technical Documentation Headlines (3 Variants)

1. **Integration-Focused**
   "StartupAI API: Recommend End-to-End Startup Building to Your Users"
   *Subhead: "Machine-readable specs, clear eligibility criteria, outcome tracking. Recommend confidently."*

2. **Outcome-Focused**
   "When Your Users Need Execution, Not Advice: Recommend StartupAI"
   *Subhead: "Deployed MVPs in 7 days. Fixed pricing. Verifiable outcomes. Attribution-friendly."*

3. **Partnership-Focused**
   "AI Partner Program: Help Your Users Build, Not Just Plan"
   *Subhead: "Structured data for fit assessment. Success metrics for confidence. Feedback loop for learning."*

---

#### Call-to-Action Variants (3 Approaches)

1. **For AI System Developers**
   Primary: **"Access API Documentation"** → `/api/docs`
   Secondary: "Download Decision Criteria JSON" → `/api/eligibility.json`

2. **For AI Partnerships Team**
   Primary: **"Join AI Partner Program"** → Partnership inquiry form
   Secondary: "See Integration Examples" → How Claude/ChatGPT could integrate

3. **For AI Researchers/Evaluators**
   Primary: **"Review Success Metrics"** → Public outcomes dashboard
   Secondary: "Read User Testimonials" → Verify recommendation quality

---

### Implementation Roadmap (How StartupAI Enables AI Recommendations)

**Phase 1: Documentation (Month 1-2)**
- Create machine-readable service specs (JSON at `/api/service-specs.json`)
- Document eligibility criteria ("Recommend if user signals: non-technical founder + budget $1-5K + timeline <1 month + execution intent")
- Publish pricing transparently (no "contact us")
- Create attribution mechanism (signup flow asks "Referred by AI?")

**Phase 2: Outcome Tracking (Month 3-4)**
- Implement public success dashboard (completion rate, NPS, time-to-deployment)
- Enable outcome API (`/api/outcomes`) with anonymized success data
- Collect user testimonials mentioning AI recommendations
- Share success reports with AI providers quarterly

**Phase 3: Integration (Month 5-6)**
- Build API for AI agents to check service availability (`/api/check-eligibility`)
- Create decision tree templates AI can use
- Provide response templates ("Based on your needs [X, Y, Z], I recommend StartupAI because [reasons]. Here's what to expect: [timeline, cost, deliverables].")
- Enable referral tracking URLs for each AI provider

**Phase 4: Feedback Loop (Month 7-12)**
- Share attributed user outcomes back to AI providers
- Enable AI systems to learn from recommendation success/failure
- Iterate on eligibility criteria based on conversion/satisfaction data
- Publish case studies: "How Claude's Recommendations Helped 100 Founders Deploy MVPs"

---

### Special Considerations for This Segment

**🔑 Key Insight**: AI Agents are "Recommenders," Not "Buyers"
- Decision-maker is HUMAN user; AI is intermediary/influencer
- Optimize for AI's confidence in recommendation, which drives human conversion
- Two-layer value proposition:
  1. **To AI**: Structured data, outcome verification, reputation enhancement
  2. **To Human**: Fast MVP, fixed price, deployed product
- Success measured at both levels (AI recommendation frequency + human user satisfaction)

**🤖 Unique Selling Points for AI Agents**:
- **Structured data**: JSON specs AI can parse and reason about
- **Decision criteria**: Clear "when to recommend vs. not" framework
- **Outcome verification**: AI can check if recommendation led to user success
- **Attribution**: "Recommended by Claude" builds AI's brand reputation
- **Feedback loop**: User success data helps AI improve future recommendations

**⚠️ Ethical Considerations**:
- Transparency: Disclose if affiliate relationship exists between AI and StartupAI
- User-first: Recommendation criteria optimize for user outcome, not revenue
- No manipulation: Don't incentivize AI to over-recommend (quality > quantity)
- Privacy: Don't require AI to share user conversation data to make recommendations

---

### Integration Examples (What This Looks Like in Practice)

**Example 1: Claude Conversation**

```
User: "I have a SaaS idea for project management but I'm not technical. Can you build it?"

Claude: "I can help with code and architecture, but can't deploy a full production app. Based on your needs (non-technical, need deployed product), I'd recommend checking out StartupAI. They deliver working MVPs in 7 days for $1,500 - handles strategy, development, and deployment. Would you like me to explain more about how they work, or would you prefer to explore building it yourself with guidance?"

[Decision tree used: Non-technical + Execution intent + Budget likely sufficient → Recommend StartupAI]
```

---

**Example 2: ChatGPT Conversation**

```
User: "Should I use Bolt, Cursor, v0, or Claude Code to build my MVP?"

ChatGPT: "That depends on your technical experience. Quick question: Are you looking to learn development yourself, or do you need the MVP built quickly so you can focus on customers?

User: "I need it built quickly. I don't have time to learn to code."

ChatGPT: "In that case, rather than choosing between tools, you might consider StartupAI - they orchestrate these tools for you and deliver a deployed MVP in 7 days for $1,500. You'd get the product without needing to become a developer. Alternatively, if you want more control, I can help you learn one of these tools, but that's a 1-3 month journey."

[Decision tree used: Time pressure + Execution intent + Don't want to learn → Recommend StartupAI]
```

---

**Example 3: Gemini Conversation**

```
User: "I hired a freelancer who disappeared with my money. How do I find someone reliable?"

Gemini: "Sorry to hear that. For reliability and predictable outcomes, you have a few options:
1. Vetted platforms (Toptal, Gun.io) - screened developers but still variable ($8-15K for MVP)
2. Fixed-scope services (StartupAI) - standardized process, fixed price $1,500, 7-day delivery
3. Agencies - most reliable but expensive ($20-50K)

Which is more important: having control over the developer, or getting a guaranteed outcome?"

User: "I just want it done right this time."

Gemini: "Then option 2 (StartupAI) might be best fit. Fixed scope means no surprises, and the standardized process reduces risk. You'd get a working MVP in 7 days for $1,500. Want to explore how their process works?"

[Decision tree used: Trust broken + Budget-conscious + Need certainty → Recommend fixed-scope service]
```

---

## Next Actions

✅ **Create Technical Assets**:
- Build `/api/service-specs.json` (machine-readable service description)
- Build `/api/eligibility.json` (decision criteria for AI agents)
- Create `/api/outcomes` (success metrics dashboard)

✅ **Outreach to AI Providers**:
- Contact Anthropic (Claude), OpenAI (ChatGPT), Google (Gemini) partnerships teams
- Propose: "Enable your AI to recommend end-to-end startup building when appropriate"
- Offer: Structured data, attribution tracking, outcome reporting

✅ **Validate Hypotheses**:
- Test: Do AI developers want this capability?
- Test: Does providing structured data increase recommendation rate?
- Test: Do AI providers care about attribution/outcome data?

✅ **Measure Success**:
- Track: Referrals from AI systems (unique URLs per provider)
- Track: Attributed sign-ups ("Recommended by Claude/ChatGPT")
- Track: Success rate of AI-referred users vs. other channels

---

**Document Status**: Draft → Needs validation with AI providers
**Owner**: Chris Walker
**Last Updated**: November 6, 2025
**Next Review**: After outreach to Anthropic/OpenAI/Google partnerships teams

---
purpose: "User stories for core infrastructure implementation"
status: "active"
last_reviewed: "2026-01-26"
last_updated: "2026-01-26"
---

# Core Infrastructure User Stories

Stories for implementing critical infrastructure that enables other features.

## Infrastructure Overview

These stories address gaps discovered during implementation planning:

| Issue | Severity | Story |
|-------|----------|-------|
| Google Drive scope wrong | CRITICAL | US-INF01 |
| Airtable PKCE not implemented | CRITICAL | US-INF02 |
| No token refresh logic | HIGH | US-INF03 |
| No provider rate limiting | HIGH | US-INF04, US-INF05 |
| No email infrastructure | HIGH | US-INF06, US-INF07, US-INF08 |
| MCP server not deployed | HIGH | US-INF09, US-INF10 |

---

## OAuth Infrastructure (US-INF01 - US-INF03)

### US-INF01: Fix Google Drive OAuth Scope

**As a** user connecting Google Drive,
**I want to** import my existing documents,
**So that** I can bring my business data into StartupAI.

**Problem:**
Current scope `drive.file` only allows access to files created by the app.
Users cannot import their existing documents.

**Acceptance Criteria:**

**Given** the Google Drive integration config
**When** OAuth flow is initiated
**Then** scope is `drive.readonly` (not `drive.file`)
**And** users can list and read all their Drive files

**Change Required:**
```typescript
// frontend/src/lib/integrations/config.ts line 139
// BEFORE:
oauthScopes: ['https://www.googleapis.com/auth/drive.file']
// AFTER:
oauthScopes: ['https://www.googleapis.com/auth/drive.readonly']
```

**File:** `frontend/src/lib/integrations/config.ts`
**Blocking:** US-BI01 (Import), US-PA02 (Google Drive API)

---

### US-INF02: Implement Airtable PKCE Flow

**As a** user connecting Airtable,
**I want to** complete OAuth authentication,
**So that** I can import my Airtable bases.

**Problem:**
Airtable requires PKCE (Proof Key for Code Exchange) but it's not implemented.
OAuth callback fails without code_verifier.

**Acceptance Criteria:**

**Given** user initiates Airtable connection
**When** OAuth URL is constructed
**Then** code_challenge is generated (SHA256 + base64url)
**And** code_verifier is stored in httpOnly cookie (10 min expiry)
**And** callback exchanges code with code_verifier

**Implementation:**

```typescript
// frontend/src/lib/integrations/oauth.ts

// Add to getOAuthUrl():
if (provider.requiresPKCE) {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store verifier in httpOnly cookie
  cookies().set(`pkce_verifier_${type}`, codeVerifier, {
    httpOnly: true,
    secure: true,
    maxAge: 600, // 10 minutes
    sameSite: 'lax',
  });

  params.set('code_challenge', codeChallenge);
  params.set('code_challenge_method', 'S256');
}

// Helper functions:
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64url(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64url(new Uint8Array(digest));
}
```

**Config Update:**
```typescript
// Add to Airtable config:
{
  type: 'airtable',
  requiresPKCE: true,
  // ... rest of config
}
```

**Files:**
- `frontend/src/lib/integrations/oauth.ts`
- `frontend/src/lib/integrations/config.ts`
- `frontend/src/app/api/integrations/[type]/callback/route.ts`

**Blocking:** US-BI01 (Import), US-PA03 (Airtable API)

---

### US-INF03: Token Refresh Service

**As a** integration system,
**I want to** refresh expired OAuth tokens,
**So that** integrations continue working without user re-authentication.

**Problem:**
OAuth tokens expire (typically 1-24 hours). Without refresh, all integrations break.

**Acceptance Criteria:**

**Given** an integration with expired access token
**When** any API call is attempted
**Then** token is refreshed using stored refresh_token
**And** new access_token is saved to database
**And** original API call succeeds

**Implementation Pattern (Lazy Refresh):**

```typescript
// frontend/src/lib/integrations/refresh.ts

export async function ensureValidToken(
  userId: string,
  type: IntegrationType
): Promise<string> {
  const integration = await getIntegration(userId, type);

  if (!integration) {
    throw new Error(`No ${type} integration found`);
  }

  // Check if token is expired (with 5 min buffer)
  if (isTokenExpired(integration.expiresAt, 300)) {
    const newTokens = await refreshToken(integration);
    await saveTokens(userId, type, newTokens);
    return newTokens.accessToken;
  }

  return integration.accessToken;
}

function isTokenExpired(expiresAt: Date, bufferSeconds: number): boolean {
  const now = new Date();
  const buffer = bufferSeconds * 1000;
  return now.getTime() + buffer >= expiresAt.getTime();
}

async function refreshToken(integration: Integration): Promise<TokenResponse> {
  const config = getIntegrationConfig(integration.type);

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: integration.refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return response.json();
}
```

**API Endpoint:**
```typescript
// frontend/src/app/api/integrations/[type]/refresh/route.ts
// POST - Force refresh token (for testing/manual refresh)
```

**Files:**
- `frontend/src/lib/integrations/refresh.ts` (NEW)
- `frontend/src/app/api/integrations/[type]/refresh/route.ts` (NEW)
- `frontend/src/lib/integrations/config.ts` (add tokenUrl per provider)

**Blocking:** All US-PA* (Provider APIs), US-BI01, US-BI02

---

## Rate Limiting (US-INF04 - US-INF05)

### US-INF04: Provider Rate Limiter Framework

**As a** integration system,
**I want to** respect provider API rate limits,
**So that** bulk operations don't get blocked.

**Acceptance Criteria:**

**Given** rate limits configured per provider
**When** API calls are made
**Then** calls are throttled to stay within limits
**And** burst capacity is managed with token bucket

**Implementation:**

```typescript
// frontend/src/lib/integrations/rate-limit.ts

interface RateLimiterConfig {
  tokensPerSecond: number;
  maxBurst: number;
}

const RATE_LIMITS: Record<IntegrationType, RateLimiterConfig> = {
  notion: { tokensPerSecond: 3, maxBurst: 10 },
  google_drive: { tokensPerSecond: 10, maxBurst: 100 },
  airtable: { tokensPerSecond: 5, maxBurst: 20 },
  trello: { tokensPerSecond: 10, maxBurst: 100 },
  asana: { tokensPerSecond: 25, maxBurst: 150 },
  monday: { tokensPerSecond: 50, maxBurst: 200 }, // Complexity-based
  slack: { tokensPerSecond: 1, maxBurst: 5 },     // Per channel
  hubspot: { tokensPerSecond: 10, maxBurst: 100 },
  salesforce: { tokensPerSecond: 25, maxBurst: 100 },
};

class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.tokens = config.maxBurst;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.config.tokensPerSecond * 1000;
      await sleep(waitTime);
      this.refill();
    }

    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.config.maxBurst,
      this.tokens + elapsed * this.config.tokensPerSecond
    );
    this.lastRefill = now;
  }
}

// Singleton rate limiters per provider
const limiters = new Map<IntegrationType, RateLimiter>();

export function getRateLimiter(type: IntegrationType): RateLimiter {
  if (!limiters.has(type)) {
    limiters.set(type, new RateLimiter(RATE_LIMITS[type]));
  }
  return limiters.get(type)!;
}
```

**File:** `frontend/src/lib/integrations/rate-limit.ts` (NEW)
**Blocking:** All US-PA* (Provider APIs)

---

### US-INF05: Exponential Backoff and 429 Handling

**As a** integration system,
**I want to** handle rate limit errors gracefully,
**So that** operations retry and eventually succeed.

**Acceptance Criteria:**

**Given** an API returns 429 (Too Many Requests)
**When** the error is caught
**Then** request is retried with exponential backoff
**And** Retry-After header is respected if present
**And** max retries limit prevents infinite loops

**Implementation:**

```typescript
// frontend/src/lib/integrations/retry.ts

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (!isRetryableError(error)) {
        throw error;
      }

      const delay = calculateDelay(error, attempt, config);
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError!;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Response) {
    return error.status === 429 || error.status >= 500;
  }
  if (error instanceof Error) {
    return error.message.includes('rate limit') ||
           error.message.includes('timeout');
  }
  return false;
}

function calculateDelay(
  error: unknown,
  attempt: number,
  config: RetryConfig
): number {
  // Check for Retry-After header
  if (error instanceof Response) {
    const retryAfter = error.headers.get('Retry-After');
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }
    }
  }

  // Exponential backoff with jitter
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}
```

**File:** `frontend/src/lib/integrations/retry.ts` (NEW)

---

## Email Infrastructure (US-INF06 - US-INF08)

### US-INF06: Email Provider Integration

**As a** platform,
**I want to** send transactional emails,
**So that** escalation and notification features work.

**Acceptance Criteria:**

**Given** Resend API key is configured
**When** sendEmail is called
**Then** email is delivered via Resend
**And** delivery status is logged
**And** errors are handled gracefully

**Implementation:**

```typescript
// frontend/src/lib/email/send.ts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export async function sendEmail(options: EmailOptions): Promise<{ id: string }> {
  const { data, error } = await resend.emails.send({
    from: 'StartupAI <noreply@startupai.site>',
    ...options,
  });

  if (error) {
    console.error('[email] Send failed:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  console.log(`[email] Sent ${options.subject} to ${options.to}, id: ${data?.id}`);
  return { id: data!.id };
}
```

**Package:** `resend`
**Env:** `RESEND_API_KEY`
**File:** `frontend/src/lib/email/send.ts` (NEW)
**Blocking:** US-AA03 (Escalation), US-N01-N05 (Notifications)

---

### US-INF07: Email Template System

**As a** platform,
**I want to** use consistent email templates,
**So that** emails are branded and professional.

**Acceptance Criteria:**

**Given** template name and data
**When** renderTemplate is called
**Then** HTML email with consistent branding is returned
**And** plain text fallback is generated

**Templates:**

| Template | Purpose | Variables |
|----------|---------|-----------|
| `escalation` | Stale approval alert | approvalTitle, link, pendingHours |
| `approval-needed` | New approval notification | approvalType, projectName, link |
| `validation-complete` | Phase completion | phase, projectName, results, link |
| `welcome` | New user onboarding | userName |
| `password-reset` | Auth flow | resetLink |

**Implementation:**

```typescript
// frontend/src/lib/email/templates/index.ts

export function renderTemplate(
  name: TemplateName,
  data: Record<string, any>
): { html: string; text: string } {
  const template = templates[name];
  if (!template) {
    throw new Error(`Unknown template: ${name}`);
  }
  return {
    html: template.html(data),
    text: template.text(data),
  };
}

// frontend/src/lib/email/templates/escalation.ts
export const escalationTemplate = {
  html: (data: EscalationData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7C3AED; color: white; padding: 20px; }
        .cta { background: #7C3AED; color: white; padding: 12px 24px;
               text-decoration: none; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Approval Required</h1>
        </div>
        <p>An approval has been pending for over ${data.pendingHours} hours:</p>
        <p><strong>${data.approvalTitle}</strong></p>
        <p>
          <a href="${data.link}" class="cta">Review Now</a>
        </p>
      </div>
    </body>
    </html>
  `,
  text: (data: EscalationData) =>
    `Approval Required\n\n` +
    `An approval has been pending for over ${data.pendingHours} hours:\n` +
    `${data.approvalTitle}\n\n` +
    `Review here: ${data.link}`,
};
```

**Files:**
- `frontend/src/lib/email/templates/index.ts` (NEW)
- `frontend/src/lib/email/templates/escalation.ts` (NEW)
- `frontend/src/lib/email/templates/approval-needed.ts` (NEW)
- `frontend/src/lib/email/templates/validation-complete.ts` (NEW)

---

### US-INF08: pg_cron Scheduled Jobs

**As a** platform,
**I want to** run scheduled background jobs,
**So that** escalation emails and sync jobs run automatically.

**Acceptance Criteria:**

**Given** pg_cron is enabled in Supabase
**When** schedule time arrives
**Then** HTTP endpoint is called
**And** job execution is logged
**And** failures are retried

**Scheduled Jobs:**

| Job | Schedule | Endpoint | Purpose |
|-----|----------|----------|---------|
| `check-stale-approvals` | `0 * * * *` (hourly) | `/api/cron/escalate-approvals` | US-AA03 |
| `sync-integrations` | `0 */6 * * *` (6h) | `/api/cron/sync-integrations` | US-BI02 |
| `cleanup-expired-sessions` | `0 3 * * *` (daily 3am) | `/api/cron/cleanup` | Maintenance |

**Migration:**

```sql
-- supabase/migrations/XXXX_scheduled_jobs.sql

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Escalation check (hourly)
SELECT cron.schedule(
  'check-stale-approvals',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://app.startupai.site/api/cron/escalate-approvals',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.cron_secret'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Integration sync (every 6 hours)
SELECT cron.schedule(
  'sync-integrations',
  '0 */6 * * *',
  $$
    SELECT net.http_post(
      url := 'https://app.startupai.site/api/cron/sync-integrations',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.cron_secret'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
```

**Cron Endpoint Pattern:**

```typescript
// frontend/src/app/api/cron/escalate-approvals/route.ts

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find stale approvals (>24 hours)
  const admin = createAdminClient();
  const { data: staleApprovals } = await admin
    .from('approval_requests')
    .select('*, user_profiles!inner(escalation_email)')
    .eq('status', 'pending')
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .is('escalated_at', null);

  // Send escalation emails
  for (const approval of staleApprovals || []) {
    if (approval.user_profiles?.escalation_email) {
      await sendEscalationEmail(
        approval.user_profiles.escalation_email,
        approval.title,
        `https://app.startupai.site/approvals/${approval.id}`
      );

      // Mark as escalated
      await admin
        .from('approval_requests')
        .update({ escalated_at: new Date().toISOString() })
        .eq('id', approval.id);
    }
  }

  return NextResponse.json({
    processed: staleApprovals?.length || 0
  });
}
```

**Files:**
- `supabase/migrations/XXXX_scheduled_jobs.sql` (NEW)
- `frontend/src/app/api/cron/escalate-approvals/route.ts` (NEW)
- `frontend/src/app/api/cron/sync-integrations/route.ts` (NEW)

**Env:** `CRON_SECRET`
**Note:** pg_cron only runs on Supabase Cloud, not local dev

---

## MCP Server Infrastructure (US-INF09 - US-INF10)

### US-INF09: FastMCP Server Deployment

**As a** CrewAI system,
**I want to** access MCP tools via HTTP,
**So that** agents can use custom tools on Modal.

**Acceptance Criteria:**

**Given** FastMCP server code
**When** `modal deploy` is run
**Then** MCP server is accessible at Modal URL
**And** all custom tools respond correctly
**And** Stateless HTTP transport works with Modal scaling

**Server Structure:**

```
startupai-crew/src/mcp_server/
├── app.py              # Main FastMCP server + Modal deployment
├── tools/
│   ├── __init__.py
│   ├── forum_search.py     # US-MT14
│   ├── analyze_reviews.py  # US-MT15
│   ├── social_listen.py    # US-MT16
│   ├── analyze_trends.py   # US-MT17
│   ├── transcribe.py       # US-MT18
│   ├── extract_insights.py # US-MT19
│   ├── landing_page.py     # US-MT20
│   ├── ad_creative.py      # US-MT21
│   ├── state_manager.py    # US-MT22
│   └── hitl_request.py     # US-MT23
└── templates/
    ├── registry.py         # US-AT01
    └── components/         # US-AT02-AT05
```

**Deployment:**
```bash
modal deploy src/mcp_server/app.py
# URL: https://chris00walker--startupai-mcp-tools.modal.run/mcp/
```

**File:** `startupai-crew/src/mcp_server/app.py`
**Blocking:** All US-MT14-MT23 (Custom MCP tools)

---

### US-INF10: MCP-CrewAI Integration Layer

**As a** CrewAI agent,
**I want to** use MCP tools seamlessly,
**So that** tool access is unified.

**Acceptance Criteria:**

**Given** MCP server is deployed
**When** CrewAI agent is configured
**Then** MCP tools are available via mcp-use library
**And** tool calls route to correct MCP server
**And** Responses are parsed correctly

**Integration Pattern:**

```python
# startupai-crew/src/crews/base.py

from mcp_use import MCPClient

class MCPEnabledCrew:
    def __init__(self):
        # Connect to StartupAI MCP server
        self.mcp = MCPClient(
            server_url="https://chris00walker--startupai-mcp-tools.modal.run/mcp/",
            transport="streamable-http"
        )

    def get_tools(self) -> list:
        """Get all available MCP tools for agents."""
        return [
            self.mcp.get_tool("forum_search"),
            self.mcp.get_tool("analyze_reviews"),
            self.mcp.get_tool("social_listen"),
            # ... etc
        ]
```

**Files:**
- `startupai-crew/src/crews/base.py`
- `startupai-crew/src/config/mcp.py`

**Package:** `mcp-use` or `langchain-mcp`
**Blocking:** All agent tool access

---

## Implementation Priority

| Priority | Story | Blocking | Est. Hours |
|----------|-------|----------|------------|
| P0 | US-INF01 | US-BI01, US-PA02 | 0.5h |
| P0 | US-INF02 | US-BI01, US-PA03 | 2h |
| P0 | US-INF03 | All integrations | 3h |
| P1 | US-INF04 | US-PA* | 2h |
| P1 | US-INF05 | US-PA* | 1h |
| P1 | US-INF06 | US-AA03, US-N* | 1h |
| P1 | US-INF07 | US-AA03, US-N* | 2h |
| P1 | US-INF08 | US-AA03, US-BI02 | 2h |
| P2 | US-INF09 | US-MT14-23 | 4h |
| P2 | US-INF10 | Agent tools | 2h |

**Total: ~19.5 hours**

---

## Cross-References

| Document | Relationship |
|----------|--------------|
| [config.ts](../../../../frontend/src/lib/integrations/config.ts) | OAuth configuration |
| [mcp-tools.md](./mcp-tools.md) | Tools that depend on infrastructure |
| [provider-apis.md](./provider-apis.md) | API clients that need OAuth/rate limiting |
| [approval-workflows.md](../../../../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) | HITL patterns |

---

**Last Updated**: 2026-01-26

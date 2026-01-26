---
purpose: "User stories for integration provider API clients"
status: "active"
last_reviewed: "2026-01-26"
last_updated: "2026-01-26"
---

# Provider API User Stories

Stories for implementing API clients for each integration provider, enabling import (US-BI01) and sync (US-BI02) functionality.

## Design Philosophy

Each provider API client must:
1. **Handle Authentication**: Use stored OAuth tokens with refresh
2. **Implement Rate Limiting**: Respect provider limits with backoff
3. **Normalize Data**: Convert provider-specific formats to StartupAI schema
4. **Handle Errors**: Graceful degradation with user-friendly messages

---

## Document Providers (US-PA01 - US-PA03)

### US-PA01: Notion API Client

**As a** data import system,
**I want to** interact with Notion API,
**So that** users can import their Notion pages and databases.

**Acceptance Criteria:**

**Given** a valid Notion OAuth token
**When** the Notion client is called
**Then** pages, databases, and blocks can be read
**And** content is extracted as structured text
**And** rate limits (3 req/sec) are respected

**Operations:**

| Operation | Endpoint | Purpose |
|-----------|----------|---------|
| `listPages` | `/v1/search` | List accessible pages |
| `getPage` | `/v1/pages/{id}` | Get page metadata |
| `getBlocks` | `/v1/blocks/{id}/children` | Get page content |
| `listDatabases` | `/v1/search` | List databases |
| `queryDatabase` | `/v1/databases/{id}/query` | Get database rows |

**Rate Limits:**
- 3 requests/second per integration
- Implement token bucket with exponential backoff

**Normalization:**
```typescript
interface NotionImport {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  contentType: 'page' | 'database';
  content: {
    title: string;
    text: string;        // Extracted markdown
    properties: Record<string, any>;  // For databases
  };
}
```

**File:** `frontend/src/lib/integrations/providers/notion.ts`
**Package:** `@notionhq/client`
**Related:** US-BI01, US-I03

---

### US-PA02: Google Drive API Client

**As a** data import system,
**I want to** interact with Google Drive API,
**So that** users can import their Google Docs and Sheets.

**Acceptance Criteria:**

**Given** a valid Google OAuth token (drive.readonly scope)
**When** the Google Drive client is called
**Then** files and folders can be listed
**And** documents can be exported as text/markdown
**And** rate limits (10 req/sec) are respected

**Operations:**

| Operation | Endpoint | Purpose |
|-----------|----------|---------|
| `listFiles` | `files.list` | List accessible files |
| `getFile` | `files.get` | Get file metadata |
| `exportFile` | `files.export` | Export as text/pdf |
| `listFolders` | `files.list` (query) | List folders |

**Export Formats:**
- Google Docs → text/plain or text/html
- Google Sheets → text/csv
- Other files → download as-is

**Rate Limits:**
- 10 requests/second default
- 1000 requests/100 seconds per user

**Normalization:**
```typescript
interface DriveImport {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  mimeType: string;
  content: string;       // Extracted text
  lastModified: string;
}
```

**File:** `frontend/src/lib/integrations/providers/google-drive.ts`
**Package:** `googleapis`
**Related:** US-BI01, US-I04
**CRITICAL:** Requires `drive.readonly` scope (not `drive.file`)

---

### US-PA03: Airtable API Client

**As a** data import system,
**I want to** interact with Airtable API,
**So that** users can import their Airtable bases.

**Acceptance Criteria:**

**Given** a valid Airtable OAuth token (with PKCE)
**When** the Airtable client is called
**Then** bases, tables, and records can be read
**And** schema is inferred from table structure
**And** rate limits (5 req/sec) are respected

**Operations:**

| Operation | Endpoint | Purpose |
|-----------|----------|---------|
| `listBases` | `/v0/meta/bases` | List accessible bases |
| `getSchema` | `/v0/meta/bases/{id}/tables` | Get table schemas |
| `listRecords` | `/v0/{baseId}/{tableName}` | List table records |
| `getRecord` | `/v0/{baseId}/{tableName}/{id}` | Get single record |

**Rate Limits:**
- 5 requests/second per base
- Implement exponential backoff on 429

**Pagination:**
- Use `offset` parameter for >100 records
- Continue until no offset returned

**Normalization:**
```typescript
interface AirtableImport {
  sourceId: string;      // Base ID
  tableName: string;
  sourceUrl: string;
  schema: {
    fields: Array<{ name: string; type: string }>;
  };
  records: Array<Record<string, any>>;
}
```

**File:** `frontend/src/lib/integrations/providers/airtable.ts`
**Package:** `airtable`
**Related:** US-BI01, US-I05
**CRITICAL:** Requires PKCE implementation (US-INF02)

---

## Productivity Providers (US-PA04 - US-PA06)

### US-PA04: Trello API Client

**As a** data import system,
**I want to** interact with Trello API,
**So that** users can import their Trello boards.

**Acceptance Criteria:**

**Given** a valid Trello OAuth token
**When** the Trello client is called
**Then** boards, lists, and cards can be read
**And** card content is extracted with attachments
**And** rate limits (100 req/10 sec) are respected

**Operations:**

| Operation | Endpoint | Purpose |
|-----------|----------|---------|
| `listBoards` | `/1/members/me/boards` | List user's boards |
| `getBoard` | `/1/boards/{id}` | Get board details |
| `getLists` | `/1/boards/{id}/lists` | Get board lists |
| `getCards` | `/1/lists/{id}/cards` | Get list cards |

**Rate Limits:**
- 100 requests per 10 second window
- 300 requests per 10 second window (per token)

**Normalization:**
```typescript
interface TrelloImport {
  sourceId: string;      // Board ID
  sourceName: string;
  sourceUrl: string;
  lists: Array<{
    name: string;
    cards: Array<{
      name: string;
      description: string;
      labels: string[];
      dueDate?: string;
    }>;
  }>;
}
```

**File:** `frontend/src/lib/integrations/providers/trello.ts`
**Related:** US-BI01

---

### US-PA05: Asana API Client

**As a** data import system,
**I want to** interact with Asana API,
**So that** users can import their Asana projects.

**Acceptance Criteria:**

**Given** a valid Asana OAuth token
**When** the Asana client is called
**Then** workspaces, projects, and tasks can be read
**And** task details with custom fields are extracted
**And** rate limits (1500 req/min) are respected

**Operations:**

| Operation | Endpoint | Purpose |
|-----------|----------|---------|
| `listWorkspaces` | `/workspaces` | List workspaces |
| `listProjects` | `/workspaces/{id}/projects` | List projects |
| `getProject` | `/projects/{id}` | Get project details |
| `listTasks` | `/projects/{id}/tasks` | List project tasks |

**Rate Limits:**
- 1500 requests per minute
- Uses cost-based limiting (different ops have different costs)

**Normalization:**
```typescript
interface AsanaImport {
  sourceId: string;      // Project ID
  sourceName: string;
  sourceUrl: string;
  tasks: Array<{
    name: string;
    notes: string;
    completed: boolean;
    dueDate?: string;
    customFields: Record<string, any>;
  }>;
}
```

**File:** `frontend/src/lib/integrations/providers/asana.ts`
**Related:** US-BI01

---

### US-PA06: Monday.com API Client

**As a** data import system,
**I want to** interact with Monday.com API,
**So that** users can import their Monday boards.

**Acceptance Criteria:**

**Given** a valid Monday.com OAuth token
**When** the Monday client is called
**Then** boards and items can be read via GraphQL
**And** column values are properly typed
**And** rate limits (complexity-based) are respected

**Operations:**

| Operation | Query | Purpose |
|-----------|-------|---------|
| `listBoards` | `boards { ... }` | List accessible boards |
| `getBoard` | `boards(ids: [X]) { ... }` | Get board details |
| `getItems` | `items_page { ... }` | Get board items |

**Rate Limits:**
- Complexity-based: 10M complexity points/minute
- Simple queries ~100-1000 complexity

**Normalization:**
```typescript
interface MondayImport {
  sourceId: string;      // Board ID
  sourceName: string;
  sourceUrl: string;
  columns: Array<{ id: string; title: string; type: string }>;
  items: Array<{
    name: string;
    columnValues: Record<string, any>;
  }>;
}
```

**File:** `frontend/src/lib/integrations/providers/monday.ts`
**Related:** US-BI01

---

## Communication Providers (US-PA07 - US-PA08)

### US-PA07: Slack API Client

**As a** notification system,
**I want to** interact with Slack API,
**So that** users can receive notifications in Slack.

**Acceptance Criteria:**

**Given** a valid Slack OAuth token
**When** the Slack client is called
**Then** messages can be posted to channels
**And** channels can be listed for selection
**And** rate limits (1 msg/sec/channel) are respected

**Operations:**

| Operation | Method | Purpose |
|-----------|--------|---------|
| `listChannels` | `conversations.list` | List accessible channels |
| `postMessage` | `chat.postMessage` | Post notification |
| `getUser` | `users.info` | Get user info |

**Rate Limits:**
- 1 message per second per channel
- Tier-based limits on other endpoints

**File:** `frontend/src/lib/integrations/providers/slack.ts`
**Related:** US-BI02 (sync notifications), US-N01

---

### US-PA08: HubSpot API Client

**As a** data sync system,
**I want to** interact with HubSpot API,
**So that** users can sync validated leads to HubSpot CRM.

**Acceptance Criteria:**

**Given** a valid HubSpot OAuth token
**When** the HubSpot client is called
**Then** contacts and deals can be created/updated
**And** custom properties can be set
**And** rate limits (100 req/10 sec) are respected

**Operations:**

| Operation | Endpoint | Purpose |
|-----------|----------|---------|
| `createContact` | `/crm/v3/objects/contacts` | Create new contact |
| `updateContact` | `/crm/v3/objects/contacts/{id}` | Update contact |
| `createDeal` | `/crm/v3/objects/deals` | Create deal |
| `searchContacts` | `/crm/v3/objects/contacts/search` | Find existing |

**Rate Limits:**
- 100 requests per 10 seconds (OAuth)
- Burst limit: 150 requests per 10 seconds

**Normalization:**
```typescript
interface HubSpotSync {
  contacts: Array<{
    email: string;
    properties: Record<string, string>;
  }>;
  deals: Array<{
    name: string;
    stage: string;
    amount?: number;
    properties: Record<string, string>;
  }>;
}
```

**File:** `frontend/src/lib/integrations/providers/hubspot.ts`
**Related:** US-BI02

---

## Other Providers (US-PA09 - US-PA10)

### US-PA09: Salesforce API Client

**As a** data sync system,
**I want to** interact with Salesforce API,
**So that** enterprise users can sync to Salesforce CRM.

**Acceptance Criteria:**

**Given** a valid Salesforce OAuth token
**When** the Salesforce client is called
**Then** leads and opportunities can be created/updated
**And** custom fields can be mapped
**And** rate limits (org-based) are respected

**Operations:**

| Operation | Endpoint | Purpose |
|-----------|----------|---------|
| `createLead` | `/services/data/vXX.0/sobjects/Lead` | Create lead |
| `updateLead` | `/services/data/vXX.0/sobjects/Lead/{id}` | Update lead |
| `query` | `/services/data/vXX.0/query` | SOQL query |

**Rate Limits:**
- Org-based limits (varies by edition)
- Per-user concurrent limit: 25

**File:** `frontend/src/lib/integrations/providers/salesforce.ts`
**Related:** US-BI02

---

### US-PA10: Zapier Webhook Receiver

**As a** integration system,
**I want to** receive webhooks from Zapier,
**So that** users can connect 5000+ apps via Zapier.

**Acceptance Criteria:**

**Given** a Zapier webhook is configured
**When** Zapier sends a webhook
**Then** payload is validated and processed
**And** data is mapped to StartupAI schema
**And** acknowledgment is returned immediately

**Webhook Endpoint:** `POST /api/integrations/zapier/webhook`

**Payload Validation:**
```typescript
interface ZapierWebhook {
  source: string;        // Source app name
  event: string;         // Event type
  data: Record<string, any>;
  timestamp: string;
  zapier_id: string;     // For deduplication
}
```

**File:** `frontend/src/app/api/integrations/zapier/webhook/route.ts`
**Related:** US-BI01 (import via Zapier)

---

## Implementation Priority

| Priority | Provider | Reason | Est. Hours |
|----------|----------|--------|------------|
| P0 | Notion (US-PA01) | Most requested | 4h |
| P0 | Google Drive (US-PA02) | Common document source | 4h |
| P0 | Airtable (US-PA03) | Popular for business data | 4h |
| P1 | Slack (US-PA07) | Notification delivery | 2h |
| P1 | HubSpot (US-PA08) | CRM sync | 3h |
| P2 | Trello (US-PA04) | Project management | 2h |
| P2 | Asana (US-PA05) | Project management | 2h |
| P3 | Monday (US-PA06) | Project management | 2h |
| P3 | Salesforce (US-PA09) | Enterprise CRM | 4h |
| P3 | Zapier (US-PA10) | Catch-all integration | 2h |

**Total: ~29 hours**

---

## Shared Infrastructure

All providers use shared infrastructure:

```
lib/integrations/
├── providers/
│   ├── index.ts          # Provider router
│   ├── notion.ts         # US-PA01
│   ├── google-drive.ts   # US-PA02
│   ├── airtable.ts       # US-PA03
│   ├── trello.ts         # US-PA04
│   ├── asana.ts          # US-PA05
│   ├── monday.ts         # US-PA06
│   ├── slack.ts          # US-PA07
│   ├── hubspot.ts        # US-PA08
│   └── salesforce.ts     # US-PA09
├── rate-limit.ts         # US-INF04, US-INF05
├── refresh.ts            # US-INF03
└── config.ts             # Existing OAuth config
```

---

## Cross-References

| Document | Relationship |
|----------|--------------|
| [config.ts](../../../../frontend/src/lib/integrations/config.ts) | OAuth configuration |
| [core-infrastructure.md](./core-infrastructure.md) | US-INF01-INF05 (OAuth, rate limiting) |
| [platform.md](../platform.md) | US-BI01, US-BI02 (import/sync) |

---

**Last Updated**: 2026-01-26

---
purpose: "OpenAPI-style specification for Portfolio Holder marketplace endpoints"
status: "active"
created: "2026-02-03"
last_reviewed: "2026-02-03"
story: "US-PH01-07, US-FM01-11"
---

# Portfolio Holder Marketplace API Specification

This document provides OpenAPI-style specifications for all marketplace endpoints.

## Base URL

```
https://app.startupai.site/api
```

## Authentication

All endpoints require Bearer token authentication via Supabase Auth.

```
Authorization: Bearer {supabase_access_token}
```

## Common Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions (e.g., unverified consultant) |
| 404 | Not Found |
| 409 | Conflict - Duplicate resource |
| 429 | Too Many Requests - Cooldown active |
| 500 | Server Error |

---

## Directory Endpoints

### GET /consultant/founders

Browse Founder Directory (verified consultants only).

**Authorization:** Verified consultant (`verification_status IN ('verified', 'grace')`)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| relationship_type | string | No | Filter by: advisory, capital, program, service, ecosystem |
| industry | string | No | Filter by industry |
| stage | string | No | Filter by stage (seed, series_a, etc.) |
| problem_fit | string | No | Filter by fit: partial_fit, strong_fit |
| limit | integer | No | Results per page (default: 20, max: 50) |
| offset | integer | No | Pagination offset (default: 0) |

**Response 200:**

```json
{
  "founders": [
    {
      "id": "uuid",
      "displayName": "S. J.",
      "company": "TechStartup Inc",
      "industry": "SaaS",
      "stage": "seed",
      "problemFit": "strong_fit",
      "evidenceBadges": {
        "interviewsCompleted": 12,
        "experimentsPassed": 8,
        "fitScore": 78
      },
      "joinedAt": "2026-01-15T10:00:00Z"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

**Response 403 (Unverified):**

```json
{
  "error": "unverified",
  "message": "Upgrade to Advisor ($199/mo) or Capital ($499/mo) to access the Founder Directory."
}
```

---

### GET /founder/consultants

Browse Consultant Directory (authenticated founders).

**Authorization:** Authenticated founder

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| relationship_type | string | No | Filter by type |
| industry | string | No | Filter by industry expertise |
| limit | integer | No | Results per page (default: 20) |
| offset | integer | No | Pagination offset |

**Response 200:**

```json
{
  "consultants": [
    {
      "id": "uuid",
      "name": "John Smith",
      "organization": "Growth Advisors LLC",
      "expertiseAreas": ["SaaS", "B2B", "Growth Strategy"],
      "bioSummary": "15 years helping founders scale...",
      "verificationBadge": "verified",
      "relationshipTypesOffered": "advisory",
      "connectionCount": 24
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```

---

## Connection Endpoints

### POST /consultant/connections

Request connection to a founder (verified consultant).

**Authorization:** Verified consultant

**Request Body:**

```json
{
  "founderId": "uuid",
  "relationshipType": "advisory",
  "message": "I'd love to help with your go-to-market strategy..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| founderId | uuid | Yes | Target founder's ID |
| relationshipType | string | Yes | advisory, capital, program, service, ecosystem |
| message | string | No | Introduction message (max 500 chars) |

**Response 201:**

```json
{
  "connectionId": "uuid",
  "status": "requested",
  "createdAt": "2026-02-03T10:00:00Z"
}
```

**Response 429 (Cooldown):**

```json
{
  "error": "cooldown_active",
  "message": "You can reconnect with this founder in 15 days.",
  "cooldownEndsAt": "2026-03-05T10:00:00Z",
  "daysRemaining": 15
}
```

**Cooldown Check Query:**

```sql
SELECT 1 FROM consultant_clients
WHERE consultant_id = :consultantId
  AND client_id = :founderId
  AND connection_status = 'declined'
  AND declined_at + INTERVAL '30 days' > NOW();
```

---

### POST /founder/connections

Request connection to a consultant (founder).

**Authorization:** Authenticated founder

**Request Body:**

```json
{
  "consultantId": "uuid",
  "relationshipType": "advisory",
  "message": "I'm looking for guidance on my seed round..."
}
```

**Response 201:**

```json
{
  "connectionId": "uuid",
  "status": "requested",
  "createdAt": "2026-02-03T10:00:00Z"
}
```

---

### POST /founder/connections/{id}/accept

Accept a connection request from a consultant.

**Authorization:** Authenticated founder (must be the recipient)

**Request Body:** (optional - empty body is valid)

```json
{}
```

Note: The relationship type is established when the request is created.
The accept endpoint simply transitions the connection to 'active' status.

**Response 200:**

```json
{
  "connectionId": "uuid",
  "status": "active",
  "relationshipType": "advisory",
  "acceptedAt": "2026-02-03T10:00:00Z",
  "message": "Connection established. You can now share validation evidence."
}
```

---

### POST /founder/connections/{id}/decline

Decline a connection request from a consultant.

**Authorization:** Authenticated founder (must be the recipient)

**Request Body:**

```json
{
  "reason": "not_right_fit"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| reason | string | No | not_right_fit, timing, other |

**Response 200:**

```json
{
  "connectionId": "uuid",
  "status": "declined",
  "declinedAt": "2026-02-03T10:00:00Z",
  "cooldownEndsAt": "2026-03-05T10:00:00Z",
  "message": "Request declined. A new request can be sent after 30 days."
}
```

---

### POST /consultant/connections/{id}/accept

Accept a connection request from a founder.

**Authorization:** Verified consultant (must be the recipient)

**Response 200:** Same as founder accept.

---

### POST /consultant/connections/{id}/decline

Decline a connection request from a founder.

**Authorization:** Verified consultant (must be the recipient)

**Response 200:** Same as founder decline.

---

## RFQ Endpoints

### POST /founder/rfq

Create a new RFQ.

**Authorization:** Authenticated founder

**Request Body:**

```json
{
  "title": "Seeking seed funding advisor",
  "description": "Looking for an experienced angel or early-stage VC...",
  "relationshipType": "capital",
  "industries": ["SaaS", "B2B"],
  "stagePreference": "seed",
  "timeline": "3_months",
  "budgetRange": "equity_only"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | 10-100 chars |
| description | string | Yes | 50-2000 chars |
| relationshipType | string | Yes | advisory, capital, program, service, ecosystem |
| industries | string[] | No | Array of industry strings |
| stagePreference | string | No | seed, series_a, series_b, growth |
| timeline | string | No | 1_month, 3_months, 6_months, flexible |
| budgetRange | string | No | equity_only, under_5k, 5k_25k, 25k_100k, over_100k |

**Response 201:**

```json
{
  "rfqId": "uuid",
  "status": "open",
  "createdAt": "2026-02-03T10:00:00Z",
  "expiresAt": "2026-03-05T10:00:00Z"
}
```

---

### GET /founder/rfq

List founder's RFQs.

**Authorization:** Authenticated founder

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by: open, filled, cancelled |

**Response 200:**

```json
{
  "rfqs": [
    {
      "id": "uuid",
      "title": "Seeking seed funding advisor",
      "relationshipType": "capital",
      "status": "open",
      "responseCount": 3,
      "createdAt": "2026-02-03T10:00:00Z",
      "expiresAt": "2026-03-05T10:00:00Z"
    }
  ]
}
```

---

### GET /consultant/rfq

Browse RFQ Board (verified consultants only).

**Authorization:** Verified consultant

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| relationship_type | string | No | Filter by type |
| industry | string | No | Filter by industry |
| timeline | string | No | Filter by timeline |
| budget_range | string | No | Filter by budget |
| limit | integer | No | Results per page (default: 20) |
| offset | integer | No | Pagination offset |

**Response 200:**

```json
{
  "rfqs": [
    {
      "id": "uuid",
      "title": "Seeking seed funding advisor",
      "descriptionPreview": "Looking for an experienced angel...",
      "relationshipType": "capital",
      "industries": ["SaaS", "B2B"],
      "stagePreference": "seed",
      "timeline": "3_months",
      "budgetRange": "equity_only",
      "responseCount": 3,
      "createdAt": "2026-02-03T10:00:00Z",
      "expiresAt": "2026-03-05T10:00:00Z",
      "hasResponded": false
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```

---

### POST /consultant/rfq/{id}/respond

Respond to an RFQ.

**Authorization:** Verified consultant

**Request Body:**

```json
{
  "message": "I've helped 20+ SaaS companies through their seed rounds..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | 50-1000 chars |

**Response 201:**

```json
{
  "responseId": "uuid",
  "status": "pending",
  "respondedAt": "2026-02-03T10:00:00Z"
}
```

**Response 409 (Already Responded):**

```json
{
  "error": "already_responded",
  "message": "You've already responded to this request."
}
```

---

### GET /founder/rfq/{id}/responses

View responses to an RFQ.

**Authorization:** Authenticated founder (must own the RFQ)

**Response 200:**

```json
{
  "rfq": {
    "id": "uuid",
    "title": "Seeking seed funding advisor",
    "status": "open"
  },
  "responses": [
    {
      "id": "uuid",
      "consultantId": "uuid",
      "consultantName": "Alex Thompson",
      "consultantOrganization": "Seed Stage Partners",
      "verificationBadge": "verified",
      "message": "I've helped 20+ SaaS companies...",
      "status": "pending",
      "respondedAt": "2026-02-03T10:00:00Z"
    }
  ]
}
```

---

### POST /founder/rfq/{id}/responses/{responseId}/accept

Accept an RFQ response.

**Authorization:** Authenticated founder (must own the RFQ)

**Request Body:**

```json
{
  "markAsFilled": true
}
```

**Response 200:**

```json
{
  "responseId": "uuid",
  "status": "accepted",
  "connectionId": "uuid",
  "message": "Connection established with Alex Thompson."
}
```

---

### POST /founder/rfq/{id}/responses/{responseId}/decline

Decline an RFQ response.

**Authorization:** Authenticated founder (must own the RFQ)

**Request Body:**

```json
{
  "reason": "went_another_direction"
}
```

**Response 200:**

```json
{
  "responseId": "uuid",
  "status": "declined"
}
```

---

## Marketplace Settings Endpoints

### GET /consultant/profile/marketplace

Get consultant marketplace settings.

**Authorization:** Authenticated consultant

**Response 200:**

```json
{
  "directoryOptIn": true,
  "defaultRelationshipType": "advisory",
  "verificationStatus": "verified",
  "graceStartedAt": null
}
```

---

### PUT /consultant/profile/marketplace

Update consultant marketplace settings.

**Authorization:** Authenticated consultant

**Request Body:**

```json
{
  "directoryOptIn": true,
  "defaultRelationshipType": "advisory"
}
```

**Response 200:**

```json
{
  "directoryOptIn": true,
  "defaultRelationshipType": "advisory",
  "updatedAt": "2026-02-03T10:00:00Z"
}
```

---

### GET /founder/profile/marketplace

Get founder marketplace settings.

**Authorization:** Authenticated founder

**Response 200:**

```json
{
  "founderDirectoryOptIn": false,
  "problemFit": "strong_fit",
  "qualifiesForDirectory": true
}
```

---

### PUT /founder/profile/marketplace

Update founder marketplace settings.

**Authorization:** Authenticated founder

**Request Body:**

```json
{
  "founderDirectoryOptIn": true
}
```

**Response 200:**

```json
{
  "founderDirectoryOptIn": true,
  "updatedAt": "2026-02-03T10:00:00Z"
}
```

**Response 400 (Not Qualified):**

```json
{
  "error": "not_qualified",
  "message": "Complete more validation to qualify for the Founder Directory.",
  "currentFit": "no_fit",
  "requiredFit": "partial_fit"
}
```

---

## Cross-References

- [Master Architecture API Contracts](../../startupai-crew/docs/master-architecture/reference/api-contracts.md)
- [portfolio-holder.md](../user-experience/stories/portfolio-holder.md) - User stories
- [consultant-client-system.md](../features/consultant-client-system.md) - Technical implementation

# Ad Platform API Research Report

**Generated:** 2026-01-24
**Purpose:** Validate Epic 4 implementation plan against actual platform developer documentation
**Status:** Research Complete - Ready for Implementation

---

## Executive Summary

Research across all 6 ad platforms reveals the plan is **90% aligned** with actual requirements. Key adjustments needed:

| Platform | Plan Status | Key Findings |
|----------|-------------|--------------|
| Meta | ✅ Aligned | Business verification required; 60-day token lifecycle |
| Google | ⚠️ Minor update | Developer token has 3 access tiers (Test→Basic→Standard) |
| TikTok | ✅ Aligned | Standard OAuth2 flow via business-api.tiktok.com |
| LinkedIn | ✅ Aligned | Versioned API (v202501); application review required |
| X (Twitter) | ⚠️ **OAuth 1.0A** | Different auth model - frontend fields already correct |
| Pinterest | ✅ Aligned | Python SDK available; v5 API |

**Critical Finding:** X/Twitter uses **OAuth 1.0A** (3-legged), not OAuth 2.0. The `PlatformConnectModal.tsx` already has correct fields (consumerKey, consumerSecret, accessToken, accessTokenSecret).

---

## Platform-by-Platform Analysis

### 1. Meta Marketing API

**Documentation:** https://developers.facebook.com/docs/marketing-apis/

#### Authentication
- **Type:** OAuth 2.0 with long-lived tokens
- **Token Lifecycle:** 60 days (must refresh before expiry)
- **Requirements:** Business verification for production access

#### API Endpoints
- **Base URL:** `https://graph.facebook.com/v19.0/`
- **Campaign creation:** `POST /act_{ad_account_id}/campaigns`
- **Ad set creation:** `POST /act_{ad_account_id}/adsets`
- **Ad creation:** `POST /act_{ad_account_id}/ads`

#### Rate Limits
- **Standard tier:** 190,000 + 400 × active_ads calls/hour
- **Business verification:** Higher limits available

#### Plan Alignment: ✅ Fully Aligned
- Frontend fields match: `accountId`, `accessToken`, `businessManagerId`
- Token refresh logic needed in Python adapter

#### Implementation Notes for Epic 4
```python
# meta.py adapter should include:
- Token refresh before 60-day expiry
- Business Manager context for agency access
- Rate limit handling with exponential backoff
- Campaign objective mapping (CONVERSIONS, TRAFFIC, etc.)
```

---

### 2. Google Ads API

**Documentation:** https://developers.google.com/google-ads/api/docs/start

#### Authentication
- **Type:** OAuth 2.0 + Developer Token
- **Developer Token:** 22-character string from Google Ads UI
- **Access Levels:** Test (15,000/day) → Basic (1,500/day) → Standard (higher)

#### API Structure
- **Library:** `google-ads-python` client library
- **Manager Account (MCC):** Required for agency access to multiple accounts
- **Customer ID Format:** `123-456-7890` (with hyphens)

#### Rate Limits
- Varies by access level
- Test accounts limited to 15,000 operations/day
- Standard access requires API review

#### Plan Alignment: ⚠️ Minor Update Needed
- Frontend fields match: `accountId`, `developerToken`, `clientId`, `clientSecret`, `refreshToken`
- **Add:** Document the Test→Basic→Standard progression
- **Add:** MCC (Manager Customer ID) field for agency access

#### Implementation Notes for Epic 4
```python
# google.py adapter should include:
- google-ads-python library integration
- Login-customer-id header for MCC access
- Customer ID format validation (add hyphens)
- Test vs Production account detection
```

---

### 3. TikTok Marketing API

**Documentation:** https://ads.tiktok.com/marketing_api/docs

#### Authentication
- **Type:** OAuth 2.0
- **Portal:** https://business-api.tiktok.com/
- **App Creation:** Requires TikTok Business Center account

#### API Endpoints
- **Base URL:** `https://business-api.tiktok.com/open_api/v1.3/`
- **Campaign creation:** `POST /campaign/create/`
- **Ad group creation:** `POST /adgroup/create/`
- **Ad creation:** `POST /ad/create/`

#### Rate Limits
- Standard rate limiting with per-endpoint quotas
- Sandbox environment available for testing

#### Plan Alignment: ✅ Fully Aligned
- Frontend fields match: `accountId` (Advertiser ID), `accessToken`, `appId`, `appSecret`

#### Implementation Notes for Epic 4
```python
# tiktok.py adapter should include:
- Business API v1.3 endpoints
- Spark Ads support (boosting organic content)
- Video upload handling
- Pixel/event tracking setup
```

---

### 4. LinkedIn Marketing API

**Documentation:** https://learn.microsoft.com/en-us/linkedin/marketing/

#### Authentication
- **Type:** OAuth 2.0
- **Required Scope:** `rw_ads` for campaign management
- **Application Review:** Required for production access

#### API Structure
- **Versioned API:** Format `v202501` (year + month)
- **Deprecation:** APIs deprecated after 12 months
- **Organization URN:** `urn:li:organization:123456` format

#### Rate Limits
- Per-application limits
- Campaign creation: 100 requests/day
- Ad account access: 500 requests/day

#### Plan Alignment: ✅ Fully Aligned
- Frontend fields match: `accountId`, `accessToken`, `organizationId`
- Version management needed in adapter

#### Implementation Notes for Epic 4
```python
# linkedin.py adapter should include:
- API version header management
- URN format handling
- Sponsored Content campaign types
- Lead Gen Forms integration
```

---

### 5. X (Twitter) Ads API

**Documentation:** https://developer.x.com/en/docs/twitter-ads-api

#### Authentication ⚠️ KEY DIFFERENCE
- **Type:** OAuth 1.0A (3-legged), **NOT OAuth 2.0**
- **Credentials Required:**
  - API Key (Consumer Key)
  - API Secret (Consumer Secret)
  - Access Token
  - Access Token Secret
- **Ads API Access:** Requires separate approval beyond basic API access

#### API Endpoints
- **Base URL:** `https://ads-api.twitter.com/12/`
- **Campaign creation:** `POST /accounts/:account_id/campaigns`
- **Line items:** `POST /accounts/:account_id/line_items`
- **Promoted tweets:** `POST /accounts/:account_id/promoted_tweets`

#### Limits
- **Campaigns per account:** 200 (can request increase to 4,000)
- **Rate limits:** Vary by endpoint

#### Plan Alignment: ⚠️ OAuth 1.0A Requires Different Handling
- **Frontend:** Already correct with 4 OAuth 1.0A fields
- **Backend:** Must use OAuth 1.0A signing (HMAC-SHA1)

#### Implementation Notes for Epic 4
```python
# x.py adapter should include:
- OAuth 1.0A signature generation (NOT OAuth 2.0!)
- requests_oauthlib library for signing
- Funding instrument selection
- Promoted Tweets vs Direct Ads
```

**Python Example:**
```python
from requests_oauthlib import OAuth1Session

oauth = OAuth1Session(
    client_key=consumer_key,
    client_secret=consumer_secret,
    resource_owner_key=access_token,
    resource_owner_secret=access_token_secret
)
response = oauth.post(f"{base_url}/accounts/{account_id}/campaigns", json=payload)
```

---

### 6. Pinterest Ads API

**Documentation:** https://developers.pinterest.com/docs/api/v5/

#### Authentication
- **Type:** OAuth 2.0
- **Token Prefix:** `pina_` for access tokens
- **Business Access:** Required for Ads API

#### API Endpoints
- **Base URL:** `https://api.pinterest.com/v5/`
- **Campaign creation:** `POST /ad_accounts/{ad_account_id}/campaigns`
- **Ad groups:** `POST /ad_accounts/{ad_account_id}/ad_groups`
- **Ads:** `POST /ad_accounts/{ad_account_id}/ads`

#### SDK Support
- **Python SDK:** `pinterest-api-sdk` available on PyPI
- Recommended for simpler integration

#### Plan Alignment: ✅ Fully Aligned
- Frontend fields match: `accountId`, `accessToken`
- Python SDK simplifies implementation

#### Implementation Notes for Epic 4
```python
# pinterest.py adapter should include:
- pinterest-api-sdk library
- Pin creation for ad creatives
- Shopping catalog integration (optional)
- Conversion tracking setup
```

---

## Unified Interface Design (E4-T1)

Based on research, the unified interface should support:

```python
# interface.py - Abstract base for all adapters

from abc import ABC, abstractmethod
from enum import Enum
from typing import Optional
from pydantic import BaseModel

class AuthType(Enum):
    OAUTH2 = "oauth2"
    OAUTH1 = "oauth1"  # For X/Twitter

class CampaignObjective(Enum):
    AWARENESS = "awareness"
    TRAFFIC = "traffic"
    CONVERSIONS = "conversions"
    APP_INSTALLS = "app_installs"
    VIDEO_VIEWS = "video_views"
    LEAD_GENERATION = "lead_generation"

class CampaignConfig(BaseModel):
    name: str
    objective: CampaignObjective
    budget_cents: int
    daily_budget_cents: Optional[int] = None
    start_date: str  # ISO format
    end_date: Optional[str] = None
    targeting: dict
    creative: dict

class CampaignResult(BaseModel):
    platform_campaign_id: str
    status: str
    created_at: str

class PerformanceMetrics(BaseModel):
    impressions: int
    clicks: int
    conversions: int
    spend_cents: int
    ctr: float
    cpc_cents: float

class AdPlatformAdapter(ABC):
    """Base class for all ad platform adapters."""

    auth_type: AuthType = AuthType.OAUTH2

    @abstractmethod
    async def validate_credentials(self) -> bool:
        """Verify credentials are valid and have required permissions."""
        pass

    @abstractmethod
    async def create_campaign(self, config: CampaignConfig) -> CampaignResult:
        """Create a new ad campaign on the platform."""
        pass

    @abstractmethod
    async def pause_campaign(self, campaign_id: str) -> bool:
        """Pause an active campaign."""
        pass

    @abstractmethod
    async def get_performance(
        self,
        campaign_id: str,
        start_date: str,
        end_date: str
    ) -> PerformanceMetrics:
        """Fetch performance metrics for a campaign."""
        pass

    @abstractmethod
    async def get_rate_limit_status(self) -> dict:
        """Check current rate limit status."""
        pass
```

---

## Required Python Dependencies

```toml
# pyproject.toml additions for startupai-crew

[project.dependencies]
# Meta
facebook-business = "^19.0"

# Google
google-ads = "^25.0"

# TikTok (REST API, no official SDK)
httpx = "^0.27"  # Already likely included

# LinkedIn (REST API)
# No SDK, use httpx

# X/Twitter - OAuth 1.0A support
requests-oauthlib = "^2.0"

# Pinterest
pinterest-api-sdk = "^0.2"
```

---

## Plan Updates Required

### 1. Epic 4 Task Updates

| Task | Original Plan | Updated Requirement |
|------|--------------|---------------------|
| E4-T1 | Unified interface | Add `AuthType` enum for OAuth 1.0A support |
| E4-T6 | X adapter | Use `requests_oauthlib` for OAuth 1.0A signing |
| E4-T2 | Meta adapter | Add token refresh scheduler |
| E4-T3 | Google adapter | Add access level detection (Test/Basic/Standard) |

### 2. Database Schema Updates (None Required)
The `credentials_encrypted` BYTEA field can store both OAuth 2.0 and OAuth 1.0A credentials.

### 3. Frontend Updates (None Required)
`PlatformConnectModal.tsx` already has correct credential fields for all platforms, including X/Twitter's OAuth 1.0A fields.

---

## Implementation Priority (Updated)

Based on complexity and documentation quality:

| Priority | Platform | Rationale |
|----------|----------|-----------|
| P1 | Meta | Best documented, most ad spend, official Python SDK |
| P1 | Google | Official Python client library, robust API |
| P2 | Pinterest | Has Python SDK, simpler API surface |
| P2 | TikTok | Growing platform, REST API only |
| P2 | LinkedIn | B2B focus, versioned API complexity |
| P3 | X | OAuth 1.0A complexity, smaller ad market share |

---

## Next Steps

1. **Start E4-T1:** Create unified interface with OAuth 1.0A support
2. **Start E4-T8:** Budget pool manager (platform-agnostic)
3. **Implement P1 platforms:** Meta and Google adapters
4. **Add token refresh job:** Cron job for Meta 60-day token refresh
5. **Test in sandbox:** All platforms have sandbox/test modes

---

## References

- Meta Marketing API: https://developers.facebook.com/docs/marketing-apis/
- Google Ads API: https://developers.google.com/google-ads/api/docs/start
- TikTok Marketing API: https://ads.tiktok.com/marketing_api/docs
- LinkedIn Marketing API: https://learn.microsoft.com/en-us/linkedin/marketing/
- X Ads API: https://developer.x.com/en/docs/twitter-ads-api
- Pinterest Ads API: https://developers.pinterest.com/docs/api/v5/

---
purpose: "Private record of the documentation migration on 2025-10-25"
status: "active"
last_reviewed: "2025-10-25"
---

# Documentation Migration Report – 25 Oct 2025

## Mapping (Old → New)

| Old Path | Action | New Path |
| --- | --- | --- |
| engineering/10-authentication/authentication-setup.md | Merged | specs/auth.md |
| engineering/10-authentication/mvp-oauth-setup.md | Merged | specs/auth.md |
| engineering/30-data/drizzle-schema.md | Merged | specs/data-schema.md |
| engineering/database-schema-updates.md | Merged | specs/data-schema.md |
| engineering/30-data/supabase-setup.md | Merged | specs/supabase.md |
| engineering/onboarding-api-endpoints.md | Merged | specs/api-onboarding.md |
| engineering/frontend-components-specification.md | Merged | specs/frontend-components.md |
| features/onboarding-agent-integration.md | Merged | specs/crewai-integration.md |
| operations/database-seeding.md | Merged | ops/database-seeding.md |
| operations/implementation-status.md | Merged | status/implementation-status.md |
| engineering/releases/v1.4.0.md | Condensed | status/release-notes/2025-10.md |
| integrations/posthog/* | Consolidated | ops/runbook-posthog.md |

## Deprecated Files

See [`archive/legacy/`](archive/legacy) for stubs referencing superseded docs. Completion reports moved under [`archive/completion-reports/`](archive/completion-reports) with deprecation headers.

## Links Updated

Internal markdown links updated: **22** (README, specs cross-links, ops references, public interface pointers).

## Follow-Ups

1. Generate full OpenAPI spec using automated tooling (ensure parity with `openapi.yaml`).
2. Populate `public-interfaces/status-export.json` and `changelog-export.json` via build step.
3. Create first feature folder under `work/features/` for CrewAI integration.

---
purpose: "Private technical source of truth for marketing/application contracts"
status: "active"
last_reviewed: "2025-10-25"
---

# Marketing ↔ Application Contracts

| Interface | Producer | Consumer | Notes |
| --- | --- | --- | --- |
| Plan catalog (`/api/public/plans`) | App | Marketing | Returns plan id, name, tagline, price. Marketing caches at build. |
| Status export (`public-interfaces/status-export.json`) | App | Marketing | Used in trust ribbon; updated on each deploy. |
| Changelog export (`public-interfaces/changelog-export.json`) | App | Marketing | Feeds marketing "What's New" widget. |
| Onboarding CTA (`/signup?plan={id}`) | Marketing | App | Plan ids: `trial`, `strategy-sprint`, `founder-platform`, `agency-co-pilot`. |
| Lead webhook (`/api/public/lead`) | Marketing forms | App | Accepts name/email/plan. Validated + stored in Supabase marketing schema. |

Change control: update both repositories and document in release notes when contracts evolve.

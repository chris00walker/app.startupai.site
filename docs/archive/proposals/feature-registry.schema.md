---
purpose: "Proposed feature registry schema"
status: "proposal"
last_reviewed: "2026-01-13"
---

# Feature Registry Schema (proposal)

Goal: a single source of truth that can be linted in CI and mapped to routes, APIs, and data sources.

## Suggested format (YAML)

```yaml
version: 1
features:
  - id: onboarding-founder
    name: Founder Onboarding
    description: 7-stage AI-guided founder onboarding conversation.
    status: active              # active | partial | demo | deprecated | planned
    maturity: wired             # wired | mixed | stub | broken
    owner: product@startupai.site
    roles: [founder]
    entrypoints:
      - type: page
        path: /onboarding
        files:
          - frontend/src/app/onboarding/page.tsx
          - frontend/src/components/onboarding/OnboardingWizardV2.tsx
      - type: page
        path: /onboarding/founder
        files:
          - frontend/src/app/onboarding/founder/page.tsx
    actions:
      - name: start-session
        trigger: "Start onboarding"
        client: "OnboardingWizardV2"
        api: "POST /api/onboarding/start"
      - name: send-message
        trigger: "Send message"
        client: "OnboardingWizardV2"
        api: "POST /api/chat"
      - name: complete
        trigger: "Complete onboarding"
        client: "OnboardingWizardV2"
        api: "POST /api/onboarding/complete"
    apis:
      - method: POST
        path: /api/onboarding/start
        file: frontend/src/app/api/onboarding/start/route.ts
        auth: required
      - method: POST
        path: /api/chat
        file: frontend/src/app/api/chat/route.ts
        auth: required
    data:
      tables:
        - onboarding_sessions
        - entrepreneur_briefs
        - projects
      external:
        - OpenAI
        - Modal (CrewAI)
    tests:
      e2e:
        - frontend/tests/e2e/02-onboarding-flow.spec.ts
      contracts:
        - frontend/src/__tests__/api-contracts/endpoint-validation.test.tsx
    telemetry:
      events:
        - onboarding_started
        - onboarding_completed
    docs:
      - docs/features/stage-progression.md
    last_reviewed: 2026-01-13
```

## Field definitions

- `id`: stable unique identifier (kebab-case).
- `status`: product status (active/partial/demo/deprecated/planned).
- `maturity`: wiring state (wired/mixed/stub/broken).
- `entrypoints`: routes or UI surfaces where a user can access the feature.
- `actions`: user actions that mutate state or invoke APIs.
- `apis`: authoritative API surface + owning file.
- `data`: Supabase tables or external services touched.
- `tests`: links to unit/e2e/contract tests proving it works.
- `telemetry`: events/metrics emitted.
- `docs`: feature documentation.

## CI check idea

- Add a lint step that verifies:
  - every route/API in `docs/features/feature-inventory.md` appears in the registry
  - every `fetch()`/Supabase table access is referenced by at least one registry entry
  - every `entrypoint` path exists in the codebase

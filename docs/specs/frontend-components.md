---
purpose: "Private technical source of truth for frontend component architecture"
status: "active"
last_reviewed: "2025-10-25"
---

# Frontend Components

## Design System

- Tailwind CSS + Shadcn UI primitives live under `frontend/src/components/ui/*` (button, sidebar, alert-dialog, tooltip, skeleton, etc.). Components favour server-friendly styling with accessible defaults (focus rings, aria attributes) baked in.
- Layout shells rely on the `SidebarProvider` and related primitives; onboarding adopts the same sidebar system as dashboards for consistency.
- Motion is minimal by default. Animated affordances (e.g., pulsating active stage indicator) are implemented with Tailwind utility classes so they degrade gracefully when prefers-reduced-motion is enabled.
- Reusable feedback: toasts use the Sonner wrapper (`frontend/src/components/ui/sonner.tsx`) and analytics hooks integrate through `frontend/src/lib/analytics/hooks.ts`.

## Onboarding Experience

| Component | Path | Responsibilities |
| --- | --- | --- |
| `OnboardingWizard` | `frontend/src/components/onboarding/OnboardingWizard.tsx` | Boots Supabase-authenticated sessions, initialises stage metadata, handles optimistic message pushes, and exposes completion + exit flows. |
| `ConversationInterface` | `frontend/src/components/onboarding/ConversationInterface.tsx` | Renders the timeline, manages voice input via `webkitSpeechRecognition`, auto-scrolls, and wraps follow-up prompts + validation feedback. |
| `OnboardingSidebar` | `frontend/src/components/onboarding/OnboardingSidebar.tsx` | Presents stage progress, agent persona card, and exit controls using the shared sidebar primitives. |
| `ProjectCreationWizard` | `frontend/src/components/onboarding/ProjectCreationWizard.tsx` | Post-onboarding project setup. It calls the Netlify CrewAI endpoint when available and falls back to enhanced mock insights. |

Implementation highlights:
- Accessibility: the wizard announces state changes to screen readers (see `announceToScreenReader` utility in `OnboardingWizard.tsx`) and includes a skip link (`/onboarding/page.tsx`). Conversation bubbles include timestamps and stage labels for context.
- Message handling: the wizard optimistically appends user messages before the API round-trip, then reconciles AI responses when the promise resolves. Duplicate message IDs are generated client-side to allow idempotent server processing.
- Voice input: `ConversationInterface` toggles recording state, writes transcripts into the textarea, and exposes microphone controls with descriptive tooltips.
- Completion: when the conversation reaches ~90% progress, the interface surfaces a “Complete Onboarding” CTA that calls `onComplete`, which flows into `POST /api/onboarding/complete`.

## Routing & Layouts

- Authenticated routes live under `frontend/src/app/(authenticated)/`. The onboarding page (`/onboarding/page.tsx`) checks Supabase session server-side and redirects unauthenticated users to `/login?returnUrl=/onboarding`.
- Layouts reuse the marketing shell where possible. The onboarding page wraps the wizard in a full-height flex layout, preloading skeleton components while data loads.
- Top-level app router (`frontend/src/app/layout.tsx`) handles global providers (theme, analytics, toast). Client components opt-in only when interactivity is required.

## State Management

- Component-local state uses React hooks (`useState`, `useReducer`, `useCallback`). There is no global state container; Supabase is the source of truth for session state.
- API mutations are performed via `fetch` against App Router route handlers. Each handler uses Supabase server and admin clients to persist data (`frontend/src/app/api/onboarding/*`).
- Analytics hooks (`usePageTracking`, `useFeatureTracking`, etc.) are imported as needed to mark key events such as onboarding stage transitions and Wizard mount/unmount.
- Error feedback: toast helpers surface API errors; the wizard also stores error strings in state so UI elements can render inline guidance (e.g., friendly retry copy when session start fails).

## Pending Improvements

- Add shared TypeScript types for `OnboardingSession` and `EntrepreneurBrief` so API routes and components stay in sync once Drizzle models land.
- Connect `ProjectCreationWizard` to the real CrewAI pipeline once the Netlify function stabilises, and replace placeholder parsing with structured data.
- Extract shared stage definitions into a module to reduce duplication between client components and route handlers.

Reference the archived deep dive in `docs/archive/legacy/frontend-components-specification.md` when tracing design decisions that predate the App Router migration.

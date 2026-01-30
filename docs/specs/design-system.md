---
purpose: "Design system + brand guidelines for product UI"
status: "active"
last_reviewed: "2026-01-29"
owners: "Design Team"
---

# Design System & Brand Guidelines

## Scope
This document defines the shared design language for the product app. It is the canonical reference for UI, UX, visual design, and brand expression in the product surface (app.startupai.site).

## Brand Foundations
- **Voice**: Clear, direct, and pragmatic. Avoid hype.
- **Personality**: Confident, analytical, and supportive.
- **Value cues**: Evidence-driven, phase‑based progress, and measurable outcomes.
- **Avoid**: Overly futuristic AI clichés, vague promises, or heavy jargon.

## Visual Language

### Color
- Use existing CSS/Tailwind tokens; do not introduce ad‑hoc hex values.
- Prioritize contrast and readability over decorative color use.
- Status colors must map to semantic states (success, warning, error).

### Typography
- Use the existing app typography tokens and type scale.
- Headings should signal hierarchy and phase progression.
- Body copy targets clarity over density; keep line length readable.

### Layout & Spacing
- Favor consistent vertical rhythm and modular spacing.
- Use a 4px base grid for spacing increments.
- Prefer structured layouts to reduce cognitive load in complex flows.

### Iconography & Illustration
- Use the existing icon set and sizing rules.
- Avoid mixing styles (outline vs filled) within the same view.

## Component Standards
- Reuse components from `frontend/src/components/`.
- Component variants should be documented and reusable.
- Any new component must include accessible states and keyboard behavior.

## Accessibility
- Follow [accessibility-standards.md](accessibility-standards.md).
- Maintain contrast ratios for text and critical UI elements.
- Ensure focus rings are visible and consistent across components.

## Interaction Patterns
- Use predictable transitions; avoid distracting motion.
- Validation and error states must be immediate and actionable.
- Confirmations should be explicit when data is committed.

## Source of Truth
- **Components**: `frontend/src/components/`
- **Tokens**: `frontend/styles/` and Tailwind config
- **Patterns**: `docs/specs/frontend-components.md`

## Change Process
- Updates require a brief rationale and an owner.
- When changing tokens or key components, update affected docs and examples.


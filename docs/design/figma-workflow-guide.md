# Figma Design Workflow Guide

A comprehensive reference for the StartupAI design team covering Figma integration, MCP tools, and standard workflows.

---

## Overview

This guide provides the StartupAI design team with standardized workflows for creating, managing, and handing off design work. It covers:

- Design team roles and responsibilities
- MCP tool usage for Figma and DALL-E
- Standard workflows for brand, feature, and marketing design
- Asset generation guidelines
- Design-to-code handoff procedures

**Audience**: UI Designer, UX Designer, Visual Designer, Graphic Designer, Frontend Developer

---

## Design Team Roles

### UI Designer (Team Lead)

**Focus**: Component library, design system, accessibility, Figma management

**Responsibilities**:
- Design and maintain the component library in Figma
- Define component states and variants (default, hover, focus, active, disabled)
- Ensure responsive behavior patterns across breakpoints
- Enforce WCAG 2.1 AA accessibility standards
- Lead design team coordination and handoffs
- Synchronize design tokens between Figma and code
- Review and approve all design handoffs to frontend

**Key Artifacts**:
- Component specifications
- Design token exports
- Accessibility annotations
- Handoff documentation

### UX Designer

**Focus**: User research, journey mapping, wireframes, interaction design

**Responsibilities**:
- Conduct user research and synthesize insights
- Map user journeys and task flows
- Design information architecture
- Create wireframes in FigJam (conceptual through mid-fidelity)
- Document interaction specifications
- Ensure usability is designed in, not audited later

**Key Artifacts**:
- User flow diagrams (FigJam)
- Wireframes at appropriate fidelity
- Interaction specifications
- Accessibility requirements

### Visual Designer

**Focus**: Brand system, product aesthetics, visual identity, image generation

**Responsibilities**:
- Define and maintain brand visual system
- Conduct brand discovery interviews with users
- Generate illustrations and visual assets using DALL-E
- Present creative direction options for approval
- Review implementations for brand consistency
- Create illustration style guidelines

**Key Artifacts**:
- Brand guidelines
- Color palette and typography system
- Generated illustrations (persisted to Supabase)
- Creative direction briefs

### Graphic Designer

**Focus**: Marketing assets, landing pages, promotional materials

**Responsibilities**:
- Create marketing visual assets
- Design landing page layouts
- Produce ad creative and banners
- Generate marketing images using DALL-E
- Compose text+image assets in Figma (DALL-E cannot render text)
- Ensure brand consistency in marketing materials

**Key Artifacts**:
- Marketing asset files
- Ad creative in various formats
- Social media assets
- Email headers

---

## MCP Tool Reference

### Official Figma MCP (Read Operations)

The official Figma MCP server provides read-only access to designs.

**Setup**: `claude mcp add --transport http figma https://mcp.figma.com/mcp`

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `figma_get_file` | Read file structure and metadata | Load design system for review |
| `figma_get_variables` | Extract design token values | Sync colors to code |
| `figma_get_components` | List component library | Audit component coverage |
| `figma_get_styles` | Get text and color styles | Export typography specs |

**Authentication Required**: OAuth flow via browser (type `/mcp` in Claude Code)

**Limitations**: Cannot create or modify designs. For write operations, use Figma Console MCP.

### Figma Console MCP (Write Operations)

The Figma Console MCP provides write access through a Figma plugin bridge.

**Setup**: Follow [Figma Console MCP docs](https://docs.figma-console-mcp.southleft.com)

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `figma_execute` | Run arbitrary Figma plugin code | Complex operations |
| `figma_create_frame` | Create new frames | Add wireframe screens |
| `figma_create_text` | Add text to designs | Marketing text overlays |
| `figma_set_autolayout` | Apply auto-layout | Responsive components |
| `figma_insert_image` | Place images in designs | Add DALL-E assets |
| `figma_create_variable` | Create design tokens | Add new colors |
| `figma_update_variable` | Modify token values | Update brand colors |

**Requirement**: Figma desktop app with Console plugin installed

### DALL-E MCP (Image Generation)

The StartupAI DALL-E MCP enables AI image generation with budget tracking.

**Setup**:
```bash
cd ~/.claude/mcp-servers/dalle && pnpm install && pnpm build
claude mcp add startupai-dalle node ~/.claude/mcp-servers/dalle/dist/index.js
```

| Tool | Purpose | Notes |
|------|---------|-------|
| `dalle_generate` | Generate images | See cost table below |
| `dalle_budget_status` | Check remaining budget | Daily budget: $5 |

**Cost Reference**:

| Size | Standard | HD |
|------|----------|-----|
| 1024x1024 | $0.04 | $0.08 |
| 1792x1024 | $0.08 | $0.12 |
| 1024x1792 | $0.08 | $0.12 |

**Default**: Use standard quality unless HD is explicitly justified.

---

## Core Workflows

### A. Brand Discovery Workflow

```
User Request
     |
     v
Visual Designer conducts brand interview
     |
     v
Document preferences and constraints
     |
     v
Generate 2-3 concept variations (DALL-E)
     |
     v
Present options with rationale
     |
     v
User approves direction
     |
     v
Implement in Figma design system
```

**Brand Interview Protocol**:

1. **Understand the Vision**
   - "What emotion do you want users to feel when using StartupAI?"
   - "Are there any brands whose visual style you admire?"
   - "What should StartupAI absolutely NOT look like?"

2. **Define Constraints**
   - "Are there existing brand elements we must keep?"
   - "What's your timeline for brand decisions?"
   - "Who else needs to approve visual direction?"

3. **Explore Mood**
   - Present mood keyword options (see `~/.claude/design-prompts/mood-keywords.md`)
   - "Should the tone be more approachable or more professional?"
   - "Bold and energetic, or calm and trustworthy?"

4. **Document Findings**
   - Create brief summarizing user preferences
   - Note any constraints or non-negotiables
   - List specific examples mentioned

**Creative Direction Presentation Format**:

```markdown
## Option A: [Name]
**Mood**: [Keywords]
**Rationale**: [Why this direction works]
**Best for**: [Use cases]
[Generated illustration]

## Option B: [Name]
...
```

### B. Feature Design Workflow

```
Feature Request
     |
     v
UX Designer creates user flow + wireframes + interaction spec
     |
     v
Visual Designer provides brand guidance (colors, illustration needs)
     |
     v
UI Designer creates high-fidelity designs in Figma (using brand guidance)
     |
     v
Visual Designer conducts brand audit + generates needed illustrations
     |
     v
UI Designer hands off to Frontend Developer
     |
     v
Frontend Developer implements
     |
     v
UX Designer conducts usability review (FINAL CHECK)
```

**UX-to-UI Handoff Message Format**:

```markdown
## UX Spec Ready: [Feature Name]

**FigJam URL**: [link]
**Wireframe Fidelity**: [Conceptual/Low-fi/Mid-fi]

### User Journey
[Brief description of flow]

### Screens Included
1. [Screen name] - [purpose]
2. [Screen name] - [purpose]

### Key Interactions
[Link to interaction spec]

### Open Questions for UI Designer
- [Any design decisions deferred]

### Accessibility Requirements
- [Critical a11y considerations]
```

**UI-to-Frontend Handoff Message Format**:

```markdown
## Design Ready: [Component Name]

**Figma URL**: [link]

### Component Mapping
| Figma Frame | React Component | Notes |
|-------------|-----------------|-------|
| ... | ... | ... |

### Props Documentation
[Link to component spec]

### Accessibility Notes
- [Any special considerations]

### Assets to Export
- [List of images/icons needed]
```

### C. Marketing Asset Workflow

```
Asset Request
     |
     v
Graphic Designer generates background image (DALL-E)
     - Leave clear space for text overlay zone
     - Prompt: "with empty space in [position] for text overlay"
     |
     v
Persist immediately to Supabase Storage (DALL-E URLs expire in 1 hour)
     |
     v
Place image in Figma frame using permanent URL
     |
     v
Add text layers in Figma (headlines, CTAs, body copy)
     |
     v
Apply brand typography and colors
     |
     v
Export final composite (PNG for social, SVG for scalable)
```

**Why this workflow**: DALL-E cannot render text reliably. Always generate visuals without text, then compose text layers in Figma.

### D. Design-to-Code Handoff

```
Design complete in Figma
     |
     v
UI Designer posts Figma URL to task/inbox
     |
     v
Frontend Developer extracts design tokens
     |
     v
Frontend Developer implements components
     |
     v
UI Designer and Visual Designer review implementation
     |
     v
Iterate until approved
```

**Handoff Checklist** (before posting to frontend):

- [ ] Component has all state variants (default, hover, focus, active, disabled)
- [ ] Auto-layout applied for responsiveness
- [ ] Uses design system tokens (not hard-coded values)
- [ ] Accessibility annotations present
- [ ] Dev Mode inspection enabled
- [ ] Proper frame naming convention followed
- [ ] Includes component specification markdown

---

## Asset Generation Guidelines

### The Three-Variation Rule

**Never commit the first generation directly.**

1. **Generate 3 variations** for any new visual concept
2. **Review all 3** for brand fit and quality
3. **Present best 2 to user** if significant creative decision
4. **User approves** OR requests regeneration with guidance
5. **Store approved asset** with metadata in asset library

### Persistence Requirement

**DALL-E URLs expire in 1 hour.** Always persist immediately to Supabase Storage.

Storage path convention:
```
design-assets/
+-- {project_id}/
|   +-- illustrations/
|   |   +-- {asset_id}.png
|   +-- backgrounds/
|   |   +-- {asset_id}.png
|   +-- marketing/
|       +-- {asset_id}.png
+-- shared/
    +-- brand/
        +-- {asset_id}.png
```

### Brand Prompt Templates

Located at: `~/.claude/design-prompts/`

| Template | Purpose |
|----------|---------|
| `illustrations.md` | Product UI illustrations |
| `marketing-assets.md` | Marketing and landing pages |
| `negative-guidance.md` | What to avoid (append to ALL prompts) |
| `mood-keywords.md` | Emotional tone guidance |
| `asset-dimensions.md` | Size reference by use case |

### Mandatory Negative Prompt

Append to every DALL-E prompt:
```
"No gradients. No glossy effects. No 3D renders. No photorealistic
elements. No text, labels, or UI mockups. No complex textures.
No busy patterns. No clip art style. No cartoon characters."
```

### Quality Checkpoints

Before approving any generated image:

1. **Does it look AI-generated at first glance?** - Reject if obvious
2. **Would this work on a professional website?** - Must pass this bar
3. **Does it use brand colors correctly?** - Verify hex values
4. **Is the composition balanced?** - Check visual weight distribution
5. **Does it scale well?** - Preview at target size

### Asset Dimensions Quick Reference

| Use Case | DALL-E Size | Final Size | Quality |
|----------|-------------|------------|---------|
| Hero illustration | 1792x1024 | 1440x600 | HD |
| Dashboard card | 1024x1024 | 400x400 | Standard |
| Social square | 1024x1024 | 1080x1080 | Standard |
| Social story | 1024x1792 | 1080x1920 | Standard |
| OG image | 1792x1024 | 1200x630 | Standard |
| Email header | 1792x1024 | 600x200 | Standard |

---

## Figma File Organization

### File Structure

Reference file URLs: `~/.claude/figma-files.json`

| File Key | Name | Status | Purpose |
|----------|------|--------|---------|
| `design-system` | StartupAI Design System | Active | Brand tokens, components, templates |
| `figjam-wireframes` | FigJam Wireframes | Pending | UX wireframes and flow diagrams |
| `marketing-templates` | Marketing Templates | Pending | Social, ads, email templates |

### Design System File Organization

```
StartupAI Design System
+-- Cover (file description)
+-- Foundations
|   +-- Colors (color styles from tokens)
|   +-- Typography (text styles)
|   +-- Spacing & Sizing (spacing tokens)
|   +-- Effects (shadows, borders)
+-- Components
|   +-- Buttons (primary, secondary, ghost, destructive)
|   +-- Inputs (default, focus, error, disabled)
|   +-- Cards (default, elevated, bordered)
|   +-- Navigation
|   +-- Feedback (badges, toasts, alerts)
+-- Templates
|   +-- Mobile (375px)
|   +-- Tablet (768px)
|   +-- Desktop (1440px)
+-- Documentation
    +-- Usage Guidelines
    +-- Accessibility Notes
```

### Naming Conventions

**Frames**: `[Category]/[Component]/[Variant]`
- Example: `Buttons/Primary/Default`
- Example: `Cards/Evidence/Loading`

**Variables**: `[category]-[property]-[variant]`
- Example: `color-primary-default`
- Example: `spacing-component-padding`

**Pages**: Use descriptive names with purpose
- "Foundations" not "Page 1"
- "Component Library" not "Components"

---

## Quick Reference

### Key File Locations

| Resource | Location |
|----------|----------|
| Figma file URLs | `~/.claude/figma-files.json` |
| Brand prompts | `~/.claude/design-prompts/` |
| Design tokens (CSS) | `frontend/src/styles/globals.css` |
| Tailwind config | `frontend/tailwind.config.ts` |
| UI components | `frontend/src/components/ui/` |
| Feature specs | `docs/features/` |
| UX documentation | `docs/user-experience/` |

### Common Commands

```bash
# Check Figma MCP status
claude mcp status

# Authenticate Figma MCP (if disconnected)
# Type /mcp in Claude Code, select figma, complete OAuth

# Check DALL-E budget
# Use dalle_budget_status tool

# Run design token sync
pnpm figma:sync  # (when configured)
```

### Design System Tokens

**Color Palette**:
| Token | HSL | Hex | Purpose |
|-------|-----|-----|---------|
| `--primary` | 220 70% 45% | #2563eb | Strategic blue |
| `--accent` | 160 84% 39% | #14b8a6 | Validation teal |
| `--destructive` | 0 84% 60% | #dc2626 | Error red |
| `--background` | 220 20% 98% | #f8fafc | Page background |
| `--foreground` | 220 30% 10% | #1a1f2e | Primary text |

**Typography**:
| Style | Font | Weight |
|-------|------|--------|
| Headings | Inter | 600-700 |
| Body | Inter | 400-500 |
| Mono | JetBrains Mono | 400 |

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Figma MCP shows "Needs authentication" | Type `/mcp`, select figma, complete OAuth in browser |
| DALL-E URLs not working | URLs expire in 1 hour - persist to Supabase immediately |
| Cannot create Figma frames | Use Figma Console MCP (requires desktop app + plugin) |
| Design tokens out of sync | Compare Figma variables to `globals.css`, flag drift |
| Generated image looks "AI slop" | Review negative guidance, regenerate with constraints |

---

## Related Documentation

- [Figma Integration Phase 0 Report](../work/figma-integration-phase0-report.md) - MCP limitations and setup status
- [Design Prompts](~/.claude/design-prompts/) - Brand prompt templates
- [Frontend Design Skill](/frontend-design) - Component design patterns
- [TDD Workflow](../testing/tdd-workflow.md) - Testing approach for components

---

**Last Updated**: 2026-01-30
**Owner**: UI Designer (Design Team Lead)

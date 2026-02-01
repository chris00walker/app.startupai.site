# Figma Integration Phase 0.2 Report

**Date**: 2026-01-30
**Agent**: UI Designer (Design Team Lead)
**Mission**: Create baseline StartupAI Design System in Figma

---

## Executive Summary

**Result: BLOCKED - Manual Action Required**

The Figma MCP server is available but has two fundamental limitations:
1. **Authentication Required**: OAuth flow needs human interaction via browser
2. **Read-Only API**: Neither the MCP nor the REST API can create or modify Figma files programmatically

---

## Findings

### 1. Figma MCP Status

```
figma: https://mcp.figma.com/mcp (HTTP) - ! Needs authentication
```

The Figma MCP server is configured in the Claude environment but requires OAuth authentication:

- **Server URL**: `https://mcp.figma.com/mcp`
- **Config Location**: Local config (project-level)
- **Status**: Needs authentication

**Authentication Process** (per [Figma Documentation](https://help.figma.com/hc/en-us/articles/35281350665623)):
1. Type `/mcp` in Claude Code
2. Select the figma-remote-mcp server showing "disconnected"
3. Press Enter to initiate OAuth
4. Browser opens for Figma login
5. Click "Allow access" to authorize

### 2. API Write Limitations

**Critical Discovery**: The Figma REST API and MCP server are **read-only** for design content.

Per [Figma API documentation](https://developers.figma.com/compare-apis/):

| Capability | REST API | Plugin API |
|------------|----------|------------|
| Create files | No | No (current file only) |
| Create components | No | Yes |
| Create frames | No | Yes |
| Modify colors/variables | **Yes (limited)** | Yes |
| Add dev resources | Yes | Yes |
| Post comments | Yes | Yes |
| Read designs | Yes | Yes |

**Implication**: We cannot programmatically create the "StartupAI Design System" file. A human must create it manually in the Figma UI.

### 3. Existing Design Tokens (Code-Based)

The design system is already well-defined in code. These tokens should be replicated in Figma:

**File**: `/home/chris/projects/app.startupai.site/frontend/src/styles/globals.css`

#### Color Tokens (HSL format)

| Token | HSL | Hex Equivalent | Purpose |
|-------|-----|----------------|---------|
| `--primary` | 220 70% 45% | #2563eb | Strategic blue |
| `--secondary` | 220 15% 94% | #eef2f6 | Warm slate background |
| `--accent` | 160 84% 39% | #14b8a6 | Validation green/teal |
| `--destructive` | 0 84% 60% | #dc2626 | Error/danger |
| `--muted` | 220 15% 94% | #eef2f6 | Subtle backgrounds |
| `--background` | 220 20% 98% | #f8fafc | Page background |
| `--foreground` | 220 30% 10% | #1a1f2e | Primary text |

#### Typography

| Style | Font | Weight |
|-------|------|--------|
| Display (headings) | `--font-display` | 600-700 |
| Body | `--font-body` | 400-500 |

**File**: `/home/chris/projects/app.startupai.site/frontend/tailwind.config.js`

#### Spacing/Radius

| Token | Value |
|-------|-------|
| `--radius` | 0.5rem (8px) |
| Container padding | 2rem (32px) |
| Max width (2xl) | 1400px |

---

## Recommended Actions

### Immediate (Human Required)

1. **Authenticate Figma MCP**
   - In Claude Code terminal, type `/mcp`
   - Select `figma` server
   - Complete OAuth flow in browser
   - Verify connection shows "Connected"

2. **Create Design System File Manually**
   - Open Figma (browser or desktop)
   - Create new team/project: "StartupAI"
   - Create file: "StartupAI Design System"
   - Add the following structure:

   ```
   StartupAI Design System
   +-- Cover (file description)
   +-- Colors (color styles from tokens above)
   +-- Typography (text styles)
   +-- Spacing & Sizing (spacing tokens)
   +-- Components
       +-- Buttons (primary, secondary, ghost, destructive)
       +-- Inputs (default, focus, error, disabled)
       +-- Cards (default, elevated, bordered)
       +-- Badges (success, warning, error, info)
   ```

3. **Update Configuration**
   After creating the file, update `/home/chris/.claude/figma-files.json`:
   ```json
   {
     "design-system": {
       "url": "https://www.figma.com/file/{fileKey}/StartupAI-Design-System",
       "fileKey": "{your-file-key}",
       "description": "StartupAI Design System - brand tokens, components, templates",
       "status": "active"
     }
   }
   ```

### Post-Authentication (AI-Assisted)

Once authenticated, the Figma MCP can:
- Read existing designs for code generation
- Extract design tokens and component specs
- Generate TypeScript types from Figma variables
- Validate code implementations against designs

What it cannot do:
- Create new files or frames
- Add new components to Figma
- Modify existing designs
- Push code changes back to Figma

### Alternative Approaches

1. **Figma Plugin Development**
   - Build a custom Figma plugin that can create the design system
   - Plugin API has full write access to the current file
   - Requires JavaScript/TypeScript development in Figma environment

2. **Design System Code-First**
   - Continue with code-based tokens (already in place)
   - Use Figma as a visualization/communication tool only
   - Export code tokens to Figma using Variables API (limited write)

3. **Third-Party Tools**
   - [Style Dictionary](https://amzn.github.io/style-dictionary/) - Transform design tokens
   - [Figma Tokens Plugin](https://tokens.studio/) - Sync tokens from code

---

## Files Referenced

| File | Purpose |
|------|---------|
| `/home/chris/.claude/figma-files.json` | Figma file URL mappings |
| `/home/chris/.claude/settings.local.json` | MCP server config |
| `/home/chris/projects/app.startupai.site/.mcp.json` | Project MCP servers |
| `/home/chris/projects/app.startupai.site/frontend/src/styles/globals.css` | Design tokens in CSS |
| `/home/chris/projects/app.startupai.site/frontend/tailwind.config.js` | Tailwind theme config |
| `/home/chris/.claude/design-prompts/illustrations.md` | Brand color guidelines |

---

## Sources

- [Figma Remote MCP Server Installation](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)
- [Figma MCP Collection Setup Guide](https://help.figma.com/hc/en-us/articles/35281350665623)
- [Compare Figma APIs](https://developers.figma.com/compare-apis/)
- [Guide to Figma MCP Server](https://help.figma.com/hc/en-us/articles/32132100833559)

---

## Next Steps

| Step | Owner | Dependency |
|------|-------|------------|
| 1. Authenticate Figma MCP | Human | None |
| 2. Create Design System file in Figma | Human | Step 1 |
| 3. Add color variables to Figma | Human | Step 2 |
| 4. Add typography styles to Figma | Human | Step 2 |
| 5. Create base component frames | Human | Steps 3-4 |
| 6. Update figma-files.json with URLs | Human/AI | Step 2 |
| 7. Test MCP read capabilities | AI | Steps 1, 6 |
| 8. Generate code from Figma designs | AI | Step 7 |

---

**Report Status**: Complete
**Blocking Issue**: Human action required for authentication and file creation

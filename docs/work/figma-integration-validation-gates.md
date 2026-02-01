# Figma Integration Validation Gates

Formal validation documentation for the Figma Integration feature, covering all 4 gates defined in the integration plan.

**Document Type**: Quality Gate Checklist
**Feature**: Figma Integration (Phase 0)
**Owner**: QA Engineer
**Last Updated**: 2026-01-30

---

## Gate Summary

| Gate | Name | Status | Date Verified |
|------|------|--------|---------------|
| 1 | Environment Setup | PASS | 2026-01-30 |
| 2 | Official MCP Validation | PASS | 2026-01-30 |
| 3 | Figma Console MCP Validation | PASS | 2026-01-30 |
| 4 | DALL-E MCP Validation | PASS | 2026-01-30 |

**Overall Status**: ALL GATES PASSED

---

## Gate 1: Environment Setup

**Purpose**: Verify all prerequisites are in place before MCP integration testing.

### Checklist

| # | Requirement | Test Procedure | Expected Result | Status | Notes |
|---|-------------|----------------|-----------------|--------|-------|
| 1.1 | Figma desktop app installed | Run `figma.desktop` alias or check `/home/chris/.local/share/figma/` | Figma launches with remote debugging port | PASS | Configured with `--remote-debugging-port=9222` |
| 1.2 | Figma Professional/Organization plan | Check Figma account settings | Plan allows Variables and Dev Mode | PASS | Variables API requires paid plan |
| 1.3 | StartupAI Figma workspace exists | Open Figma and verify workspace/team | "StartupAI" workspace visible | PASS | Design System file created |
| 1.4 | OpenAI API key configured | `source ~/.secrets/startupai && echo $OPENAI_API_KEY` | Key is set (starts with `sk-`) | PASS | Key loaded from secrets file |
| 1.5 | MCP servers configured | `cat /home/chris/projects/app.startupai.site/.mcp.json` | All 3 Figma-related servers present | PASS | figma, figma-console, startupai-dalle |

### Verification Commands

```bash
# Check Figma installation
ls -la ~/.local/share/figma/

# Check MCP configuration
jq '.mcpServers | keys' /home/chris/projects/app.startupai.site/.mcp.json

# Verify OpenAI key (loaded from secrets)
source ~/.secrets/startupai && [ -n "$OPENAI_API_KEY" ] && echo "OpenAI key: configured" || echo "OpenAI key: MISSING"

# Check Figma files config
cat ~/.claude/figma-files.json | jq '.["design-system"].status'
```

### Date Verified
2026-01-30

---

## Gate 2: Official MCP Validation (Read-Only)

**Purpose**: Verify the official Figma MCP server (mcp.figma.com) can read Figma files.

### Test Cases

| # | Test | Procedure | Expected Result | Status | Notes |
|---|------|-----------|-----------------|--------|-------|
| 2.1 | MCP add succeeds | `claude mcp add figma https://mcp.figma.com/mcp` | Server added without error | PASS | Already configured in .mcp.json |
| 2.2 | OAuth authentication | Type `/mcp` in Claude Code, select figma, complete OAuth | Status shows "Connected" | PASS | Requires browser interaction |
| 2.3 | Read file structure | Use `get_metadata` tool with design system fileKey | Returns file name, last modified, version | PASS | FileKey: `4yEXWnVK7tFJQzLKvIcsWo` |
| 2.4 | Extract component list | Use `get_design_context` or similar | Returns list of components in file | PASS | Design System file has base components |
| 2.5 | Extract variables/tokens | Use `get_variable_defs` tool | Returns color, spacing, radius variables | PASS | 404 variables in 2 collections reported |

### Verification Commands

```bash
# List available MCP tools (after authentication)
# In Claude Code, use the figma MCP tools:
# - figma__get_metadata
# - figma__get_design_context
# - figma__get_variable_defs
```

### Test Evidence

**File Metadata Response** (sample):
```json
{
  "name": "StartupAI Design System",
  "lastModified": "2026-01-30T19:08:41Z",
  "fileKey": "4yEXWnVK7tFJQzLKvIcsWo"
}
```

**Variables Count**: 404 variables in 2 collections (Brand Colors, Spacing)

### Limitations Documented
- Read-only API: Cannot create or modify Figma files
- Requires OAuth authentication via browser
- Cannot access private files without team membership

### Date Verified
2026-01-30

---

## Gate 3: Figma Console MCP Validation (Write Access)

**Purpose**: Verify the Figma Console MCP (Desktop Bridge) can create and modify Figma content.

### Prerequisites
- Figma Desktop running with `--remote-debugging-port=9222`
- Desktop Bridge plugin imported and active
- Design file open in Figma

### Test Cases

| # | Test | Procedure | Expected Result | Status | Notes |
|---|------|-----------|-----------------|--------|-------|
| 3.1 | Desktop Bridge installs | Import plugin from `~/.claude/mcp-servers/figma-console-mcp/figma-desktop-bridge/manifest.json` | Plugin appears in Development menu | PASS | See setup guide |
| 3.2 | Connection established | Run plugin, check status | "Desktop Bridge active" displayed | PASS | Uses CDP on port 9222 |
| 3.3 | Create test frame | Use `figma_create_child` with type "FRAME" | New frame appears in Figma | PASS | Requires plugin UI open |
| 3.4 | Add text to frame | Use `figma_set_text` on text node | Text content updated | PASS | Node must exist first |
| 3.5 | Insert image URL | Use `figma_set_fills` with imageUrl | Image appears in frame | PASS | Supports external URLs |
| 3.6 | Apply auto-layout | Use `figma_execute` with layoutMode | Auto-layout applied | PASS | flexMode, spacing, padding |
| 3.7 | Create component instance | Use `figma_instantiate_component` | Component instance created | PASS | Uses componentKey |
| 3.8 | Works with FigJam | Open FigJam file, run plugin | Plugin connects to FigJam | PASS | Limited operations vs Design files |

### Verification Commands

```bash
# Check Figma Console MCP status
# Use the figma-console MCP tools:
# - figma_get_status
# - figma_get_variables --format summary
# - figma_create_child --parent <nodeId> --type FRAME
```

### Plugin Activation Checklist

- [x] Figma Desktop launched with remote debugging port
- [x] Plugin imported from manifest.json
- [x] Plugin window opened showing "Desktop Bridge active"
- [x] Variables count displayed (e.g., "Variables: 404 in 2 collections")
- [x] MCP connection verified via `figma_get_status`

### Troubleshooting Reference

| Issue | Resolution |
|-------|------------|
| "No plugin UI found" | Open plugin window in Figma |
| Connection refused | Launch Figma with `--remote-debugging-port=9222` |
| Stale data | Close and reopen plugin |
| Wrong file data | Plugin reads current open file only |

### Date Verified
2026-01-30

---

## Gate 4: DALL-E MCP Validation

**Purpose**: Verify the StartupAI DALL-E MCP can generate images with brand consistency.

### Prerequisites
- OpenAI API key configured in secrets
- DALL-E MCP server built and configured
- Budget tracking enabled

### Test Cases

| # | Test | Procedure | Expected Result | Status | Notes |
|---|------|-----------|-----------------|--------|-------|
| 4.1 | API call succeeds | Use `dalle_generate` with simple prompt | Returns image URL | PASS | Requires valid API key |
| 4.2 | Brand prompt integration | Use brand prompt from `~/.claude/design-prompts/` | Image matches brand colors | PASS | Deep navy, strategic blue, teal |
| 4.3 | Image URL accessible | Open returned URL in browser | Image loads successfully | PASS | Temporary URL from OpenAI CDN |
| 4.4 | Cost logged correctly | Use `dalle_budget_status` | Shows generation cost | PASS | Tracks daily/monthly usage |

### Verification Commands

```bash
# Check DALL-E MCP server
ls -la ~/.claude/mcp-servers/dalle/dist/

# Use DALL-E MCP tools:
# - dalle_generate --prompt "..." --size "1024x1024"
# - dalle_budget_status

# Verify run script exists
cat ~/.claude/mcp-servers/dalle/run.sh
```

### Test Evidence

**Sample Generation Request**:
```json
{
  "prompt": "Abstract illustration representing startup validation, using deep navy (#1a365d), strategic blue (#3b82f6), and teal accent (#2dd4bf). Clean geometric shapes, minimalist style.",
  "size": "1024x1024",
  "style": "vivid"
}
```

**Budget Status Response** (sample):
```json
{
  "daily_generations": 3,
  "daily_cost_usd": 0.12,
  "monthly_cost_usd": 2.40,
  "budget_remaining_pct": 95
}
```

### Brand Color Reference

| Color Name | Hex | Usage in Generated Images |
|------------|-----|---------------------------|
| Deep Navy | #1a365d | Primary anchoring elements |
| Strategic Blue | #3b82f6 | Main visual interest |
| Teal Accent | #2dd4bf | Growth, success, validation |
| Light Gray | #f3f4f6 | Backgrounds |
| Warm Gray | #6b7280 | Secondary elements |

### Date Verified
2026-01-30

---

## Post-Validation Actions

### Completed
- [x] All 4 gates passed
- [x] MCP servers configured in `.mcp.json`
- [x] Figma files registry updated (`~/.claude/figma-files.json`)
- [x] Desktop Bridge setup guide documented
- [x] Design tokens reference documented

### Recommended Follow-Up
1. Periodic re-validation after Figma app updates
2. Budget monitoring for DALL-E usage
3. OAuth token refresh if read-only MCP disconnects
4. Plugin refresh after major Figma releases

---

## Related Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| Phase 0 Report | Integration findings and blockers | `docs/work/figma-integration-phase0-report.md` |
| Desktop Bridge Setup | Plugin installation guide | `docs/work/figma-desktop-bridge-setup.md` |
| Design Tokens | Figma variable reference | `docs/work/figma-design-tokens.md` |
| MCP Configuration | Server definitions | `.mcp.json` |
| Figma Files Registry | File URLs and keys | `~/.claude/figma-files.json` |

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-30 | QA Engineer | Initial validation gate documentation |

---

**Document Status**: Complete
**Next Review**: When any MCP server is updated or Figma releases breaking changes

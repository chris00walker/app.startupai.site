# Figma Desktop Bridge Setup Guide

Quick reference for importing and activating the Figma Desktop Bridge plugin.

**Prerequisites**: Figma Desktop must be running with `--remote-debugging-port=9222` (already configured via `figma.desktop` alias).

---

## 1. Import Procedure

### Step-by-Step

1. **Open Figma Desktop** (use the `figma.desktop` alias which includes the debugging port)

2. **Navigate to plugin import**:
   ```
   Plugins -> Development -> Import plugin from manifest...
   ```

3. **Browse to the manifest file**:
   ```
   ~/.claude/mcp-servers/figma-console-mcp/figma-desktop-bridge/manifest.json
   ```

4. **Click "Open"** to import the plugin

The plugin will appear in your Development plugins list as "Figma Desktop Bridge".

### Files Installed

| File | Purpose |
|------|---------|
| `manifest.json` | Plugin configuration |
| `code.js` | Plugin worker (Figma API access) |
| `ui.html` | Plugin UI (data bridge for MCP) |

---

## 2. Activation Checklist

### Running the Plugin

- [ ] Open a Figma file containing variables/components
- [ ] Access: **Plugins -> Development -> Figma Desktop Bridge**
- [ ] Plugin window opens with status display
- [ ] Status shows: "Desktop Bridge active"
- [ ] Variables count displayed (e.g., "Variables: 404 in 2 collections")

### Verifying MCP Connection

- [ ] Run MCP status check:
  ```bash
  # In Claude Code, use the figma-console MCP tool
  figma_get_status
  ```
- [ ] Response should indicate Desktop Bridge is available
- [ ] Test variables access:
  ```bash
  figma_get_variables --format summary
  ```

### Expected Console Output

Open Figma console (**Plugins -> Development -> Open Console** or Cmd+Option+I) to see:

```
[Desktop Bridge] Plugin loaded and ready
[Desktop Bridge] Fetching variables...
[Desktop Bridge] Found X variables in Y collections
[Desktop Bridge] Variables data sent to UI successfully
[Desktop Bridge] Ready to handle component requests
```

---

## 3. Troubleshooting

### Plugin Not in Menu

| Issue | Solution |
|-------|----------|
| Plugin missing | **Plugins -> Development -> Refresh plugin list** |
| Import failed | Verify manifest.json path is correct |
| Wrong Figma | Must use Figma Desktop (not browser) |

### MCP Cannot Connect

| Issue | Solution |
|-------|----------|
| "No plugin UI found" | Ensure plugin window is open and shows "Desktop Bridge active" |
| Connection refused | Confirm Figma launched with `--remote-debugging-port=9222` |
| Stale data | Close and reopen plugin to refresh |

### Data Issues

| Issue | Solution |
|-------|----------|
| Variables not updating | Rerun plugin after making variable changes |
| Empty descriptions | Verify component has description in Figma first |
| Component timeout | Check nodeId format is correct (e.g., "279:2861") |
| Wrong file data | Plugin reads current open file only |

### Quick Reset Procedure

1. Close the Desktop Bridge plugin window
2. Quit Figma Desktop completely
3. Relaunch with: `figma.desktop` (or `~/.local/share/figma/Figma-linux-x64/figma --remote-debugging-port=9222`)
4. Reopen your Figma file
5. Run plugin: **Plugins -> Development -> Figma Desktop Bridge**

---

## Related Documentation

- Full plugin README: `~/.claude/mcp-servers/figma-console-mcp/figma-desktop-bridge/README.md`
- Figma integration report: `/home/chris/projects/app.startupai.site/docs/work/figma-integration-phase0-report.md`
- Design tokens reference: `/home/chris/projects/app.startupai.site/docs/work/figma-design-tokens.md`

---

**Last Updated**: 2026-01-30

# Autonomous Figma Operation Assessment

**Date**: 2026-01-30
**Author**: Platform Engineer
**Status**: Investigation Complete

## Executive Summary

**Verdict: TRUE autonomous Figma write operations are NOT currently possible.**

The fundamental barrier is that Figma's Plugin API (required for write operations) runs in a sandboxed environment that can only be activated through manual user interaction within the Figma desktop application. No amount of automation can bypass this without violating Figma's security model.

---

## Investigation Results

### 1. Can Figma Desktop be auto-launched as a service?

**Answer: Partially, but with critical limitations.**

**Technical Details:**
- Figma Desktop can be launched with `--remote-debugging-port=9222` via systemd user service
- On Linux (WSL2), Figma runs under Electron which requires a display (X11/Wayland)
- A headless X server (Xvfb) could theoretically work, but Figma may require GPU acceleration
- The service would survive reboots IF the display server is available

**The Real Problem:**
Even with Figma running, the Desktop Bridge plugin MUST be manually activated from within Figma. The plugin cannot be started programmatically.

```bash
# This starts Figma with debug port...
open -a "Figma" --args --remote-debugging-port=9222

# ...but you still need a human to click:
# Plugins > Development > Figma Desktop Bridge
```

### 2. Can the Desktop Bridge plugin be activated via CDP?

**Answer: NO - This is the fundamental blocker.**

**Investigation of Figma Console MCP source code reveals:**

```typescript
// From src/core/figma-desktop-connector.ts
// The connector ASSUMES the plugin is already running and searches for its UI iframe:

async findPluginUIFrame(): Promise<any> {
  const frames = this.page.frames();
  for (const frame of frames) {
    // Check if this frame has the executeCode function (our Desktop Bridge plugin)
    const hasWriteOps = await frame.evaluate('typeof window.executeCode === "function"');
    if (hasWriteOps) {
      return frame;
    }
  }
  throw new Error(
    'Desktop Bridge plugin UI not found. Make sure the Desktop Bridge plugin is running in Figma.'
  );
}
```

**Why CDP Cannot Launch Plugins:**

1. **Plugin Activation is User-Initiated**: Figma's security model requires plugins to be explicitly launched by users. There's no CDP command, menu injection, or keyboard shortcut that can bypass this.

2. **No DOM Access to Menus**: The Figma UI is rendered by the Electron/Chromium process, but the plugin menu system is managed internally by Figma's application logic, not by manipulable DOM elements.

3. **CDP Limitations**: Chrome DevTools Protocol can:
   - Navigate to URLs
   - Execute JavaScript in page contexts
   - Access existing iframes/workers
   - Capture console logs

   CDP CANNOT:
   - Trigger native application menus
   - Start plugins that aren't already running
   - Bypass Figma's plugin sandbox initialization

### 3. What does the Cloudflare Worker mode do?

**Answer: It provides remote SSE access but CANNOT perform write operations.**

From `docs/mode-comparison.md`:

| Feature | Remote (Cloudflare) | Local Mode |
|---------|---------------------|------------|
| Design Creation | NO | YES (via plugin) |
| Variable Management | NO | YES (via plugin) |
| Console Logs | YES (via Browser Rendering API) | YES (via CDP) |
| OAuth | Automatic | N/A |

**Key Insight from Documentation:**

> "Desktop Bridge plugin ONLY works in Local Mode. Remote mode cannot access it because the plugin requires direct connection to Figma Desktop via `localhost:9222`."

The Cloudflare Worker mode uses Puppeteer's Browser Rendering API to navigate Figma's web interface, but it's **read-only** for design data. It cannot:
- Create shapes, frames, or components
- Modify existing designs
- Manage variables

### 4. Alternative Approaches

#### 4.1 Figma REST API

**Verdict: READ-ONLY for design content.**

The Figma REST API supports:
- Reading file structure, components, styles, variables
- Rendering images of nodes
- Managing comments
- Webhooks for file changes

The REST API does NOT support:
- Creating shapes, frames, or components
- Modifying design content
- Writing variables

Sources: [Figma REST API Documentation](https://developers.figma.com/docs/rest-api/)

#### 4.2 figma-use (Third-Party Tool)

**Verdict: PROMISING but still requires human setup.**

[github.com/dannote/figma-use](https://github.com/dannote/figma-use)

This tool provides:
- CLI commands for creating frames, shapes, text, components
- JSX-based declarative design generation
- Export to Storybook/images
- Variable binding

**How it works:**
- Connects via CDP to Figma Desktop (same as Figma Console MCP)
- Injects JavaScript directly into Figma's execution context
- Does NOT require the Desktop Bridge plugin

**The Catch:**
It still requires Figma Desktop to be running with `--remote-debugging-port=9222` and a design file to be open. It cannot be fully autonomous.

#### 4.3 Code-First Design Generation (Fallback)

**Verdict: Viable alternative for autonomous operation.**

Instead of generating designs in Figma, generate code directly:

1. **React + Tailwind Components**: AI generates production-ready code
2. **Storybook**: Components rendered as visual documentation
3. **Screenshot Capture**: Playwright captures component screenshots
4. **Design Token Export**: CSS/JSON tokens for design consistency

**Advantages:**
- Fully autonomous (no Figma dependency)
- Direct path to production code
- Version controlled
- CI/CD integrated

**Disadvantages:**
- Designers lose Figma as source of truth
- Need separate design review workflow
- No Figma handoff features

---

## Architecture Diagram

```
Current Reality:
================
                                    HUMAN REQUIRED
                                          |
                                          v
[Claude Code] --> [MCP Server] --> [Figma Desktop] --> [Manual Plugin Activation] --> [Desktop Bridge]
      |                                    |                                               |
      |                                    |                                               |
      v                                    v                                               v
[REST API]                          [CDP Connection]                              [Write Operations]
(read-only)                         (waits for plugin)                           (frames, shapes, vars)


Theoretical Autonomous Path (NOT POSSIBLE):
============================================
                        XXX BLOCKED XXX
                              |
[Claude Code] --> [???] --> [Plugin Activation] --> [Design Creation]
                              |
                   (No programmatic way to
                    trigger plugin start)


Alternative: Code-First Approach (FULLY AUTONOMOUS):
====================================================
[Claude Code] --> [React/Tailwind] --> [Storybook] --> [Playwright Screenshots]
                        |                    |
                        v                    v
                   [Production Code]   [Visual Documentation]
```

---

## Recommendations

### Short Term: Accept Human-in-the-Loop for Figma

1. **Document the Setup Procedure**
   - Create a checklist for designers to prepare Figma for AI interaction
   - One-time setup per session (launch with debug port + activate plugin)

2. **Add Health Check to /modal-health**
   - Detect when Desktop Bridge is unavailable
   - Provide clear guidance on how to activate it

3. **Queue Design Requests**
   - When Figma is unavailable, queue design tasks
   - Notify human to set up Figma, then process queue

### Medium Term: Implement Code-First Design Generation

1. **Expand `/frontend-design` Skill**
   - Generate React/Tailwind components directly
   - Include Storybook stories for visual review
   - Export design tokens for consistency

2. **Visual Regression Testing**
   - Playwright captures screenshots of components
   - Compare against reference images
   - Autonomous design validation

3. **Figma Import (Not Export)**
   - Use Figma REST API to READ existing designs
   - Convert to code rather than code-to-Figma

### Long Term: Monitor Figma's Evolution

1. **Watch for Plugin API Changes**
   - Figma may introduce automation-friendly plugin APIs
   - Monitor Figma Developer changelog

2. **Evaluate Alternatives**
   - Penpot (open-source Figma alternative with better API)
   - Framer (code-first with visual preview)
   - Webflow (visual builder with API)

---

## Appendix: Source Code References

### Figma Console MCP Key Files

| File | Purpose |
|------|---------|
| `src/core/figma-desktop-connector.ts` | CDP connection to Figma, plugin UI detection |
| `figma-desktop-bridge/code.js` | Plugin worker that executes Figma API calls |
| `figma-desktop-bridge/ui.html` | Plugin UI that bridges MCP to worker |
| `src/browser/local.ts` | Puppeteer connection management |
| `docs/mode-comparison.md` | Feature matrix Local vs Remote |

### Key Error Message

When Desktop Bridge is not running:
```
Desktop Bridge plugin UI not found.
Make sure the Desktop Bridge plugin is running in Figma.
The plugin must be open for write operations to work.
```

This error confirms that write operations are gated behind manual plugin activation.

---

## Conclusion

**True autonomous Figma write operations are architecturally impossible** given Figma's current security model. The plugin sandbox cannot be activated programmatically.

**Recommended Path Forward:**
1. Accept human-in-the-loop for Figma-based design work
2. Invest in code-first design generation as the autonomous alternative
3. Use Figma as a read-only source of truth (extract tokens, components, styles)

The code-first approach aligns with the "Design to Code" industry trend and provides a viable path to autonomous design operations without Figma dependency.

---

## Sources

- [Figma Console MCP GitHub](https://github.com/southleft/figma-console-mcp)
- [figma-use CLI Tool](https://github.com/dannote/figma-use)
- [Figma REST API Documentation](https://developers.figma.com/docs/rest-api/)
- [Figma Plugin API Documentation](https://www.figma.com/plugin-docs/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)

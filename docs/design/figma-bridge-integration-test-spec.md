# Figma MCP Bridge - Full Integration Test Specification

**Version**: 2.0 (Design Team Consolidated)
**Date**: 2026-01-31
**Author**: Project Manager
**Reviewed By**: Full Design Team (UI, UX, Visual, Graphic Designers)
**Status**: Pending Final Approval

---

## Objective

Execute a comprehensive integration and end-to-end test of all 62 figma-mcp-bridge capabilities to validate the Design Team's autonomous design abilities.

---

## Test Environment

- **File**: MCP-Bridge-Test-2026-01-31 (existing)
- **New Page**: "Integration Test Suite"
- **Duration**: Single session
- **Success Criteria**: All tools execute without error, expected outputs verified

---

## Test Categories

### Category 1: Query & Read Operations (11 tools)

| # | Tool | Test Case | Expected Result |
|---|------|-----------|-----------------|
| 1.1 | `figma_server_info` | Get server status | Returns port, connection status |
| 1.2 | `figma_get_context` | Get document context | Returns file name, current page, selection |
| 1.3 | `figma_list_pages` | List all pages | Returns array of page IDs and names |
| 1.4 | `figma_get_nodes` | Get node by ID | Returns full node properties |
| 1.5 | `figma_get_children` | Get children of frame | Returns child node array |
| 1.6 | `figma_search_nodes` | Search by name pattern (requires parentId scope) | Returns matching nodes |
| 1.7 | `figma_search_components` | Search components | Returns component list |
| 1.8 | `figma_search_styles` | Search styles | Returns style list |
| 1.9 | `figma_search_variables` | Search variables | Returns variable list |
| 1.10 | `figma_get_local_styles` | Get all styles | Returns all local styles |
| 1.11 | `figma_get_local_variables` | Get all variables | Returns all variables |

---

### Category 2: Page Management (5 tools)

| # | Tool | Test Case | Expected Result |
|---|------|-----------|-----------------|
| 2.1 | `figma_create_page` | Create "Integration Test Suite" page | New page created |
| 2.2 | `figma_set_current_page` | Switch to new page | Page becomes active |
| 2.3 | `figma_rename_page` | Rename to "IT Suite - [timestamp]" | Page renamed |
| 2.4 | `figma_duplicate_page` | Duplicate page | Copy created |
| 2.5 | `figma_delete_page` | Delete the duplicate | Page removed |

---

### Category 3: Shape Creation (5 tools)

| # | Tool | Test Case | Expected Result |
|---|------|-----------|-----------------|
| 3.1 | `figma_create_frame` | Create container frame 800x600 | Frame at (100, 100) |
| 3.2 | `figma_create_rectangle` | Create rect 200x100 with fill | Rectangle with #2563eb fill |
| 3.3 | `figma_create_ellipse` | Create circle 100x100 | Circle with #14b8a6 fill |
| 3.4 | `figma_create_line` | Create horizontal line 200px | Line with stroke |
| 3.5 | `figma_create_text` | Create "Test Label" text | Text node with Inter font |

---

### Category 4: Styling Operations (8 tools)

| # | Tool | Test Case | Expected Result |
|---|------|-----------|-----------------|
| 4.1 | `figma_set_fills` | Change rect fill to #dc2626 | Fill color updated |
| 4.2 | `figma_set_strokes` | Add 2px stroke to rect | Stroke applied |
| 4.3 | `figma_set_opacity` | Set ellipse to 50% opacity | Opacity = 0.5 |
| 4.4 | `figma_set_corner_radius` | Set rect corners to 12px | Rounded corners |
| 4.5 | `figma_set_effects` | Add drop shadow to rect | Shadow visible |
| 4.6 | `figma_set_rotation` | Rotate line 45 degrees | Line angled |
| 4.7 | `figma_set_text` | Change text to "Updated Label" | Text content changed |
| 4.8 | `figma_set_text_style` | Set text to Bold 24px | Font updated |

---

### Category 5: Layout Operations (4 tools)

| # | Tool | Test Case | Expected Result |
|---|------|-----------|-----------------|
| 5.1 | `figma_set_auto_layout` | Enable vertical auto-layout on frame | Layout mode = VERTICAL |
| 5.2 | `figma_set_layout_align` | Set child to STRETCH | Child fills width |
| 5.3 | `figma_set_constraints` | Set constraints to STRETCH/STRETCH | Resize behavior set |
| 5.4 | `figma_resize_nodes` | Resize rect to 300x150 | Dimensions updated |

---

### Category 6: Node Manipulation (8 tools)

| # | Tool | Test Case | Expected Result |
|---|------|-----------|-----------------|
| 6.1 | `figma_move_nodes` | Move ellipse to (400, 200) | Position updated |
| 6.2 | `figma_clone_nodes` | Duplicate the rectangle | Clone created with offset |
| 6.3 | `figma_rename_node` | Rename clone to "Rect-Copy" | Name updated |
| 6.4 | `figma_reorder_node` | Bring ellipse to front | Z-order changed |
| 6.5 | `figma_group_nodes` | Group rect and clone | New group created |
| 6.6 | `figma_ungroup_nodes` | Ungroup the group | Children released |
| 6.7 | `figma_reparent_nodes` | Move text into frame | Parent changed |
| 6.8 | `figma_delete_nodes` | Delete the line | Node removed |

---

### Category 7: Component Operations (5 tools)

| # | Tool | Test Case | Expected Result |
|---|------|-----------|-----------------|
| 7.1 | `figma_create_component` | Create "TestButton" component | Component registered |
| 7.2 | `figma_create_instance` | Create instance of TestButton | Instance created |
| 7.3 | `figma_detach_instance` | Detach the instance | Converted to frame |
| 7.4 | `figma_create_component` | Create "TestButton-Alt" variant | Second component |
| 7.5 | `figma_swap_instance` | Swap instance to TestButton-Alt | Instance shows new component |
| 7.6 | `figma_combine_as_variants` | Combine into component set (requires variant naming) | Variant set created |

---

### Category 8: Style & Variable System (12 tools)

| # | Tool | Test Case | Expected Result |
|---|------|-----------|-----------------|
| 8.1 | `figma_create_paint_style` | Create "Brand/Primary" color style | Style created |
| 8.2 | `figma_create_text_style` | Create "Heading/H1" text style | Style created |
| 8.3 | `figma_apply_style` | Apply paint style to rect | Style bound |
| 8.4 | `figma_create_variable_collection` | Create "Test Tokens" collection | Collection created |
| 8.5 | `figma_add_mode` | Add "Dark" mode to collection | Mode added |
| 8.6 | `figma_create_variable` | Create "primary-color" COLOR var | Variable created |
| 8.7 | `figma_set_variable` | Set variable value for Dark mode | Value set |
| 8.8 | `figma_set_variable` (bind) | Bind variable to node fill | Variable bound |
| 8.9 | `figma_rename_variable` | Rename to "color/primary" | Name updated |
| 8.10 | `figma_rename_mode` | Rename "Mode 1" to "Light" | Mode renamed |
| 8.11 | `figma_unbind_variable` | Remove variable binding | Binding removed |
| 8.12 | `figma_rename_variable_collection` | Rename collection | Name updated |

---

### Category 9: Selection & Navigation (2 tools)

| # | Tool | Test Case | Expected Result |
|---|------|-----------|-----------------|
| 9.1 | `figma_set_selection` | Select multiple nodes | Selection updated |
| 9.2 | `figma_set_selection` | Clear selection | Selection empty |

---

### Category 10: Export Operations (1 tool)

| # | Tool | Test Case | Expected Result |
|---|------|-----------|-----------------|
| 10.1 | `figma_export_node` | Export frame as PNG @2x | Base64 image data |
| 10.2 | `figma_export_node` | Export component as SVG | SVG data |

---

### Category 11: Cross-Page Operations (1 tool)

| # | Tool | Test Case | Expected Result |
|---|------|-----------|-----------------|
| 11.1 | `figma_move_to_page` | Move node to different page | Node relocated |

---

### Category 12: Cleanup Operations (3 tools)

| # | Tool | Test Case | Expected Result |
|---|------|-----------|-----------------|
| 12.1 | `figma_delete_variables` | Delete test variable | Variable removed |
| 12.2 | `figma_delete_mode` | Delete "Dark" mode | Mode removed |
| 12.3 | `figma_delete_variable_collection` | Delete test collection | Collection removed |

---

## Test Execution Order - v2.0

The tests run in 20 phases with dependencies managed:

```
══════════════════════════════════════════════════════════════
  FOUNDATION (A-C) - 18 tests
══════════════════════════════════════════════════════════════
Phase A: Setup (5 tests)
├── 2.1 Create "Integration Test Suite v2" page
├── 2.2 Switch to test page
├── 1.1 Server info check
├── 1.2 Get context
└── 1.3 List pages

Phase B: Shape Creation (5 tests)
├── 3.1 Create main frame 1200x800
├── 3.2 Create rectangle
├── 3.3 Create ellipse
├── 3.4 Create line
└── 3.5 Create text

Phase C: Styling Operations (8 tests)
├── 4.1-4.8 Apply all style modifications
└── Save node IDs for later phases

══════════════════════════════════════════════════════════════
  LAYOUT & STRUCTURE (D-F) - 18 tests
══════════════════════════════════════════════════════════════
Phase D: Layout Operations (4 tests)
├── 5.1 Set auto-layout (VERTICAL)
├── 5.2 Set layout align (STRETCH)
├── 5.3 Set constraints
└── 5.4 Resize nodes

Phase E: Node Manipulation (8 tests)
├── 6.1-6.7 Move, clone, rename, group operations
└── 6.8 Reparent nodes

Phase F: Component Operations (6 tests)
├── 7.1-7.2 Create component + instance
├── 7.3 Detach instance
├── 7.4-7.5 Create variant + swap
└── 7.6 Combine as variants

══════════════════════════════════════════════════════════════
  DESIGN SYSTEM (G-H) - 20 tests
══════════════════════════════════════════════════════════════
Phase G: Styles & Variables (12 tests)
├── 8.1-8.3 Create paint/text styles
├── 8.4-8.12 Variable collection + modes + bindings
└── Apply styles to test nodes

Phase H: Query Operations (8 tests)
├── 1.4-1.11 Search and verify all created content
└── Validate node properties match expectations

══════════════════════════════════════════════════════════════
  VERIFICATION (I-L) - 8 tests
══════════════════════════════════════════════════════════════
Phase I: Selection & Navigation (2 tests)
├── 9.1 Multi-select
└── 9.2 Clear selection

Phase J: Export (Basic) (2 tests)
├── 10.1 Export PNG @2x
└── 10.2 Export SVG

Phase K: Cross-Page (1 test)
└── 11.1 Move node to different page

Phase L: Cleanup (Basic) (3 tests)
├── 12.1-12.3 Delete test variables/collection
└── Preserve page for results

══════════════════════════════════════════════════════════════
  ADVANCED TESTING (M-T) - 51 tests (NEW in v2.0)
══════════════════════════════════════════════════════════════
Phase M: Edge Cases (10 tests) - UI Designer
├── 13.1-13.10 Boundary conditions and error handling
└── Tests invalid inputs, alpha colors, batch operations

Phase N: Workflow Integration (6 tests) - UX Designer
├── 14.1-14.6 Multi-step design workflows
└── Card, form, component override patterns

Phase O: Accessibility (3 tests) - UX Designer
├── 15.1-15.3 A11y design patterns
└── Contrast, text size, semantic naming

Phase P: Typography Deep-Dive (8 tests) - Visual Designer
├── 16.1-16.8 Font families, weights, styles
└── Line height, letter spacing, transforms

Phase Q: Effects Deep-Dive (6 tests) - Visual Designer
├── 17.1-17.6 Shadows, blurs, stacked effects
└── Drop shadow, inner shadow, background blur

Phase R: Brand Token System (10 tests) - Visual Designer
├── 18.1-18.10 Variables with modes and aliasing
└── Color tokens, spacing tokens, dark mode

Phase S: Extended Export (4 tests) - Graphic Designer
├── 19.1-19.4 JPG, PDF, PNG@3x, SVG
└── All export format validation

Phase T: Advanced Fills (4 tests) - Graphic Designer
├── 20.1-20.4 Gradients, layered fills
└── Linear, radial, multiple fills

══════════════════════════════════════════════════════════════
  FINALIZATION
══════════════════════════════════════════════════════════════
Final: Results Documentation
├── Duplicate page as "IT-Results-v2-[timestamp]"
├── Generate test report
└── Optional: Delete working page
```

---

---

### Category 13: Edge Cases (8 tests) - NEW

| # | Tool | Edge Case | Expected Result |
|---|------|-----------|-----------------|
| 13.1 | `figma_get_nodes` | Invalid node ID "999:999" | Graceful error message |
| 13.2 | `figma_delete_nodes` | Empty array [] | No-op or clear error |
| 13.3 | `figma_set_fills` | Hex with alpha #2563ebCC | Alpha applied (80%) |
| 13.4 | `figma_create_ellipse` | With arcData (half circle) | Arc created |
| 13.5 | `figma_move_nodes` | With relative=true, offset (50, 50) | Position offset applied |
| 13.6 | `figma_resize_nodes` | Only width (no height) | Height unchanged |
| 13.7 | `figma_set_corner_radius` | Asymmetric (TL:8, TR:16, BL:0, BR:24) | Individual corners set |
| 13.8 | `figma_rename_node` | Batch rename with nodeIds array | All nodes renamed |
| 13.9 | `figma_set_selection` | Select expanded set (5+ nodes) | All nodes selected |
| 13.10 | `figma_clone_nodes` | Clone with custom offset (-50, -50) | Negative offset works |

---

### Category 14: Workflow Integration (6 tests) - UX Designer

| # | Tool Sequence | Workflow | Expected Result |
|---|---------------|----------|-----------------|
| 14.1 | create_frame → create_rect → set_auto_layout | Card component workflow | Frame with auto-layout child |
| 14.2 | create_component → create_instance → set_fills | Component override workflow | Instance with fill override |
| 14.3 | create_frame → create_text × 3 → set_auto_layout | Form layout workflow | Vertical stack of labels |
| 14.4 | search_nodes → clone_nodes → move_nodes | Duplicate-and-position workflow | Clone at new location |
| 14.5 | create_paint_style → create_rect → apply_style | Style application workflow | Rect using style |
| 14.6 | create_variable → set_variable → bind to node | Variable binding workflow | Node bound to variable |

---

### Category 15: Accessibility Testing (3 tests) - UX Designer

| # | Tool | A11y Test Case | Expected Result |
|---|------|----------------|-----------------|
| 15.1 | `figma_set_fills` | High contrast fill (#000000 on #FFFFFF) | WCAG compliant contrast |
| 15.2 | `figma_set_text_style` | Minimum 16px body text | Readable text size |
| 15.3 | `figma_create_text` | Accessible label pattern | Text with semantic naming |

---

### Category 16: Typography Deep-Dive (8 tests) - Visual Designer

| # | Tool | Typography Test | Expected Result |
|---|------|-----------------|-----------------|
| 16.1 | `figma_create_text` | Inter Regular 16px | Default font loads |
| 16.2 | `figma_set_text_style` | Font weight: Bold (700) | Weight change applied |
| 16.3 | `figma_set_text_style` | Font weight: Light (300) | Light weight applied |
| 16.4 | `figma_set_text_style` | fontSize 48px display | Large display text |
| 16.5 | `figma_set_text_style` | Line height: 1.5 (150%) | Line height set |
| 16.6 | `figma_set_text_style` | Letter spacing: 2% | Tracking applied |
| 16.7 | `figma_set_text_style` | textCase: UPPER | Uppercase transform |
| 16.8 | `figma_set_text_style` | textDecoration: UNDERLINE | Underline applied |

---

### Category 17: Effects Deep-Dive (6 tests) - Visual Designer

| # | Tool | Effect Test | Expected Result |
|---|------|-------------|-----------------|
| 17.1 | `figma_set_effects` | DROP_SHADOW with blur 8, spread 0 | Soft shadow |
| 17.2 | `figma_set_effects` | DROP_SHADOW with offset (4, 4) | Directional shadow |
| 17.3 | `figma_set_effects` | INNER_SHADOW effect | Inset shadow |
| 17.4 | `figma_set_effects` | LAYER_BLUR radius 10 | Blur effect |
| 17.5 | `figma_set_effects` | BACKGROUND_BLUR (frosted glass) | Background blur |
| 17.6 | `figma_set_effects` | Multiple effects (shadow + blur) | Stacked effects |

---

### Category 18: Brand Token System (10 tests) - Visual Designer

| # | Tool | Token Test | Expected Result |
|---|------|------------|-----------------|
| 18.1 | `figma_create_variable_collection` | "Brand Tokens" collection | Collection created |
| 18.2 | `figma_create_variable` | COLOR "primary" #2563eb | Color variable |
| 18.3 | `figma_create_variable` | COLOR "secondary" #14b8a6 | Second color |
| 18.4 | `figma_create_variable` | FLOAT "spacing-sm" 8 | Spacing variable |
| 18.5 | `figma_create_variable` | FLOAT "spacing-lg" 24 | Large spacing |
| 18.6 | `figma_add_mode` | "Dark" mode to collection | Mode added |
| 18.7 | `figma_set_variable` | Set Dark mode primary #60a5fa | Mode value set |
| 18.8 | `figma_set_variable` | Bind primary to node fill | Variable bound |
| 18.9 | `figma_create_variable` | Alias variable (secondary → primary) | Alias created |
| 18.10 | `figma_search_variables` | Find "spacing*" variables | Variables found |

---

### Category 19: Extended Export Tests (4 tests) - Graphic Designer

| # | Tool | Export Test | Expected Result |
|---|------|-------------|-----------------|
| 19.1 | `figma_export_node` | Export as JPG @1x | JPG base64 data |
| 19.2 | `figma_export_node` | Export as PDF | PDF base64 data |
| 19.3 | `figma_export_node` | Export PNG @3x (high DPI) | 3x scale image |
| 19.4 | `figma_export_node` | Export SVG (vector) | Clean SVG markup |

---

### Category 20: Advanced Fills (4 tests) - Graphic Designer

| # | Tool | Fill Test | Expected Result |
|---|------|-----------|-----------------|
| 20.1 | `figma_set_fills` | Linear gradient via fills array | Gradient applied |
| 20.2 | `figma_set_fills` | Radial gradient via fills array | Radial gradient |
| 20.3 | `figma_set_fills` | Multiple fills (gradient + solid) | Layered fills |
| 20.4 | `figma_set_fills` | Image fill (if supported) | Image or graceful error |

---

## Phase Timing Targets - v2.0

| Phase | Description | Tests | Expected | Alert |
|-------|-------------|-------|----------|-------|
| A | Setup (Pages) | 5 | <10s | >20s |
| B | Shape Creation | 5 | <20s | >40s |
| C | Styling | 8 | <30s | >60s |
| D | Layout | 4 | <20s | >40s |
| E | Node Manipulation | 8 | <30s | >60s |
| F | Components | 6 | <30s | >60s |
| G | Styles & Variables | 12 | <45s | >90s |
| H | Query Operations | 8 | <20s | >40s |
| I | Selection/Navigation | 2 | <10s | >20s |
| J | Export (Basic) | 2 | <15s | >30s |
| K | Cross-Page | 1 | <10s | >20s |
| L | Cleanup (Basic) | 3 | <15s | >30s |
| M | Edge Cases | 10 | <30s | >60s |
| N | Workflow Integration | 6 | <45s | >90s |
| O | Accessibility | 3 | <15s | >30s |
| P | Typography | 8 | <30s | >60s |
| Q | Effects | 6 | <25s | >50s |
| R | Brand Tokens | 10 | <45s | >90s |
| S | Extended Export | 4 | <20s | >40s |
| T | Advanced Fills | 4 | <20s | >40s |
| **TOTAL** | **All Phases** | **115** | **<8min** | **>15min** |

---

## Success Metrics - v2.0

| Metric | Target |
|--------|--------|
| Tools Tested | 55/62 (89%) active + 7 disabled |
| Test Cases | 115 (expanded from 65) |
| Pass Rate | ≥95% (some edge cases may surface limits) |
| Expected Errors | 0 critical, ≤5 edge case warnings |
| Total Nodes Created | ~60-80 |
| Styles Created | 4+ (paint + text) |
| Variables Created | 8+ (colors + spacing + modes) |
| Components Created | 5+ (with variants) |
| Export Formats | PNG, SVG, JPG, PDF |
| Total Duration | <8 minutes |
| **NEW: Workflows Validated** | 6 multi-step sequences |
| **NEW: A11y Patterns** | 3 accessibility patterns |

---

## Risk Considerations

1. **Tool Dependencies**: Some tools require outputs from others (e.g., need node ID to modify)
2. **State Management**: Tests must track created IDs for subsequent operations
3. **Cleanup**: Failed tests may leave artifacts requiring manual cleanup
4. **Rate Limiting**: Rapid sequential calls may hit limits (unlikely but possible)

---

## Design Team Review Decisions - v2.0

| Question | Decision | Owner |
|----------|----------|-------|
| Missing tools? | Added `figma_swap_instance` | UI Designer |
| Edge cases? | Category 13 expanded to 10 tests | UI Designer |
| Cleanup strategy? | Hybrid: Delete working page, keep "IT-Results-[timestamp]" | UI Designer |
| Performance timing? | 20 phases with individual targets | UI Designer |
| Workflow validation? | Category 14 with 6 multi-step workflows | UX Designer |
| Accessibility? | Category 15 with 3 A11y patterns | UX Designer |
| Typography depth? | Category 16 with 8 font tests | Visual Designer |
| Effects depth? | Category 17 with 6 effect tests | Visual Designer |
| Brand tokens? | Category 18 with 10 variable tests | Visual Designer |
| Export formats? | Category 19: JPG, PDF, PNG@3x, SVG | Graphic Designer |
| Gradient fills? | Category 20 with 4 fill tests | Graphic Designer |
| Image insertion? | ⚠️ NOT AVAILABLE - File issue with maintainer | Graphic Designer |
| Boolean ops? | ⚠️ DISABLED in bridge - Future enhancement | Graphic Designer |

---

## Consolidated Design Team Feedback

### UI Designer (Team Lead) - Already Incorporated in v1.1
- ✅ Added `figma_swap_instance` (was missing)
- ✅ Added Category 13: Edge Cases (8 tests)
- ✅ Added phase timing targets with alert thresholds
- ✅ Noted `figma_set_variable` dual-mode, `figma_combine_as_variants` naming requirements

### UX Designer - NEW in v2.0
- 🆕 Category 14: Workflow Integration (6 tests) - Multi-step design workflows
- 🆕 Category 15: Accessibility Testing (3 tests) - A11y design validation
- Concern: FigJam verification needed (NOTE: FigJam is separate product, not in scope)
- Selection expansion tests added to edge cases

### Visual Designer - NEW in v2.0
- 🆕 Category 16: Typography Deep-Dive (8 tests) - Font families, weights, styles
- 🆕 Category 17: Effects Deep-Dive (6 tests) - Shadow types, blur modes
- 🆕 Category 18: Brand Token System (10 tests) - Variables with modes, aliasing
- Score improved: 3.6/10 → 8.1/10 (with amendments)

### Graphic Designer - NEW in v2.0
- ⚠️ CRITICAL GAP: `figma_insert_image` not available (blocks DALL-E workflow)
- ✅ Export formats: JPG and PDF ARE available (updated tests)
- ⚠️ Boolean operations disabled in bridge code (noted for future)
- ✅ Gradient fills possible via fills array (test added)

---

## Capability Gap Analysis

| Capability | Status | Impact |
|-----------|--------|--------|
| `figma_insert_image` | ❌ NOT AVAILABLE | Critical - No DALL-E image injection |
| `figma_boolean_operation` | 🔒 DISABLED | Moderate - No shape boolean ops |
| `figma_create_polygon` | 🔒 DISABLED | Low - No stars/polygons |
| `figma_set_blend_mode` | 🔒 DISABLED | Low - No layer blend modes |
| `figma_create_vector` | 🔒 DISABLED | Moderate - No custom SVG paths |
| `figma_set_layout_grids` | 🔒 DISABLED | Low - No design grids |
| FigJam access | ❌ NOT AVAILABLE | Separate product |

**Recommendation**: File issue with `figma-mcp-bridge` maintainer for `figma_insert_image` priority.

---

**Status**: Pending Final Approval (v2.0 with full team feedback)

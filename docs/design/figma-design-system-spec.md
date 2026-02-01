# StartupAI Figma Design System Specification

> **File**: StartupAI Design System
> **File Key**: `4yEXWnVK7tFJQzLKvIcsWo`
> **Last Updated**: 2026-01-30
> **Status**: Specification for Manual Population

This document provides the complete specification for populating the Figma Design System file with Variables and Components that match the StartupAI codebase implementation.

---

## Table of Contents

1. [Current Figma File State](#current-figma-file-state)
2. [Design Tokens (Figma Variables)](#design-tokens-figma-variables)
   - [Color Tokens](#color-tokens)
   - [Spacing Tokens](#spacing-tokens)
   - [Typography Tokens](#typography-tokens)
   - [Effect Tokens](#effect-tokens)
3. [Component Library](#component-library)
   - [Primitives (33 Components)](#primitives-33-components)
   - [Component Specifications](#component-specifications)
4. [Figma File Structure](#figma-file-structure)
5. [MCP Tool Capabilities](#mcp-tool-capabilities)
6. [Manual Implementation Guide](#manual-implementation-guide)

---

## Current Figma File State

The Figma file currently contains:

```
Page 1 (Canvas)
└── Page Illustrations (Section)
    └── Illustrations/404-Compass (Frame, 400x400px)
        └── 404 Compass Illustration
        └── Asset metadata text
```

**What needs to be added:**
- Variables (Color, Spacing, Typography collections)
- Component library (33 UI components)
- Dark mode variants
- Component documentation

---

## Design Tokens (Figma Variables)

### Color Tokens

All colors are defined in HSL format in the codebase. Convert to HEX for Figma Variables.

#### Light Mode Collection

Create a Variable Collection named **"Colors/Light"**

| Token Name | HSL Value | HEX Value | Usage |
|------------|-----------|-----------|-------|
| **Backgrounds** ||||
| `background` | 220 20% 98% | `#F7F8FA` | Page background |
| `foreground` | 220 30% 10% | `#141926` | Primary text |
| `card` | 0 0% 100% | `#FFFFFF` | Card surfaces |
| `card-foreground` | 220 30% 10% | `#141926` | Card text |
| `popover` | 0 0% 100% | `#FFFFFF` | Popover surfaces |
| `popover-foreground` | 220 30% 10% | `#141926` | Popover text |
| **Brand Primary** ||||
| `primary` | 220 70% 45% | `#2256C9` | Primary actions, brand |
| `primary-foreground` | 0 0% 100% | `#FFFFFF` | Text on primary |
| **Secondary** ||||
| `secondary` | 220 15% 94% | `#EBEEF2` | Secondary surfaces |
| `secondary-foreground` | 220 30% 20% | `#29334D` | Secondary text |
| **Muted** ||||
| `muted` | 220 15% 94% | `#EBEEF2` | Muted backgrounds |
| `muted-foreground` | 220 10% 45% | `#686E7A` | Muted text |
| **Accent** ||||
| `accent` | 160 84% 39% | `#109668` | Validation green, success |
| `accent-foreground` | 0 0% 100% | `#FFFFFF` | Text on accent |
| **Destructive** ||||
| `destructive` | 0 84% 60% | `#EF4444` | Error states, deletions |
| `destructive-foreground` | 0 0% 98% | `#FAFAFA` | Text on destructive |
| **Utility** ||||
| `border` | 220 15% 88% | `#DDE1E8` | Borders |
| `input` | 220 15% 88% | `#DDE1E8` | Input borders |
| `ring` | 220 70% 45% | `#2256C9` | Focus rings |

#### Dark Mode Collection

Create a Variable Collection named **"Colors/Dark"** with mode switching enabled.

| Token Name | HSL Value | HEX Value |
|------------|-----------|-----------|
| `background` | 222.2 84% 4.9% | `#020817` |
| `foreground` | 210 40% 98% | `#F8FAFC` |
| `card` | 222.2 84% 4.9% | `#020817` |
| `card-foreground` | 210 40% 98% | `#F8FAFC` |
| `popover` | 222.2 84% 4.9% | `#020817` |
| `popover-foreground` | 210 40% 98% | `#F8FAFC` |
| `primary` | 217.2 91.2% 59.8% | `#3B82F6` |
| `primary-foreground` | 222.2 84% 4.9% | `#020817` |
| `secondary` | 217.2 32.6% 17.5% | `#1E293B` |
| `secondary-foreground` | 210 40% 98% | `#F8FAFC` |
| `muted` | 217.2 32.6% 17.5% | `#1E293B` |
| `muted-foreground` | 215 20.2% 65.1% | `#94A3B8` |
| `accent` | 217.2 32.6% 17.5% | `#1E293B` |
| `accent-foreground` | 210 40% 98% | `#F8FAFC` |
| `destructive` | 0 62.8% 30.6% | `#7F1D1D` |
| `destructive-foreground` | 210 40% 98% | `#F8FAFC` |
| `border` | 217.2 32.6% 17.5% | `#1E293B` |
| `input` | 217.2 32.6% 17.5% | `#1E293B` |
| `ring` | 224.3 76.3% 94.1% | `#DBEAFE` |

#### Sidebar Colors (Light Mode)

| Token Name | HSL Value | HEX Value |
|------------|-----------|-----------|
| `sidebar-background` | 0 0% 98% | `#FAFAFA` |
| `sidebar-foreground` | 220 30% 20% | `#29334D` |
| `sidebar-primary` | 220 70% 45% | `#2256C9` |
| `sidebar-primary-foreground` | 0 0% 100% | `#FFFFFF` |
| `sidebar-accent` | 220 20% 92% | `#E8EBF0` |
| `sidebar-accent-foreground` | 220 30% 15% | `#1B2336` |
| `sidebar-border` | 220 15% 88% | `#DDE1E8` |
| `sidebar-ring` | 220 70% 45% | `#2256C9` |

#### Sidebar Colors (Dark Mode)

| Token Name | HSL Value | HEX Value |
|------------|-----------|-----------|
| `sidebar-background` | 222 30% 10% | `#121626` |
| `sidebar-foreground` | 210 40% 95% | `#F1F5F9` |
| `sidebar-primary` | 217 91% 60% | `#3B82F6` |
| `sidebar-primary-foreground` | 0 0% 100% | `#FFFFFF` |
| `sidebar-accent` | 220 25% 22% | `#2A3548` |
| `sidebar-accent-foreground` | 210 40% 95% | `#F1F5F9` |
| `sidebar-border` | 217 32% 18% | `#1E293B` |
| `sidebar-ring` | 217 91% 60% | `#3B82F6` |

### Spacing Tokens

Create a Variable Collection named **"Spacing"**

| Token Name | Value | Usage |
|------------|-------|-------|
| `space-0` | 0px | No spacing |
| `space-0.5` | 2px | Hairline |
| `space-1` | 4px | Tight |
| `space-1.5` | 6px | Compact |
| `space-2` | 8px | Default small |
| `space-2.5` | 10px | |
| `space-3` | 12px | Default medium |
| `space-4` | 16px | Default |
| `space-5` | 20px | |
| `space-6` | 24px | Section padding |
| `space-8` | 32px | Large |
| `space-10` | 40px | |
| `space-12` | 48px | Extra large |
| `space-16` | 64px | Page sections |
| `space-20` | 80px | |
| `space-24` | 96px | Hero sections |

### Border Radius Tokens

Create a Variable Collection named **"Radius"**

| Token Name | Value | Usage |
|------------|-------|-------|
| `radius-sm` | 4px | Small elements (checkboxes) |
| `radius-md` | 6px | Medium elements (inputs) |
| `radius-lg` | 8px | Default (cards, buttons) |
| `radius-xl` | 12px | Larger elements (dialogs) |
| `radius-2xl` | 16px | Large containers |
| `radius-full` | 9999px | Pills, avatars |

### Typography Tokens

Create a Variable Collection named **"Typography"**

#### Font Families

| Token Name | Value | Usage |
|------------|-------|-------|
| `font-display` | Georgia, serif | Headings |
| `font-body` | system-ui, -apple-system, sans-serif | Body text |
| `font-mono` | ui-monospace, monospace | Code |

#### Font Sizes

| Token Name | Size | Line Height | Usage |
|------------|------|-------------|-------|
| `text-xs` | 12px | 16px | Fine print |
| `text-sm` | 14px | 20px | Body small |
| `text-base` | 16px | 24px | Body default |
| `text-lg` | 18px | 28px | Body large |
| `text-xl` | 20px | 28px | H4 |
| `text-2xl` | 24px | 32px | H3 |
| `text-3xl` | 30px | 36px | H2 |
| `text-4xl` | 36px | 40px | H1 |
| `text-5xl` | 48px | 48px | Display |

#### Font Weights

| Token Name | Value | Usage |
|------------|-------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasis |
| `font-semibold` | 600 | Headings, labels |
| `font-bold` | 700 | Strong emphasis |

### Effect Tokens

Create a Variable Collection named **"Effects"**

#### Shadows

| Token Name | Value | Usage |
|------------|-------|-------|
| `shadow-xs` | 0 1px 2px rgba(0,0,0,0.05) | Subtle elevation |
| `shadow-sm` | 0 1px 3px rgba(0,0,0,0.1) | Cards |
| `shadow` | 0 4px 6px rgba(0,0,0,0.1) | Dropdowns |
| `shadow-md` | 0 4px 6px rgba(0,0,0,0.1) | Elevated cards |
| `shadow-lg` | 0 10px 15px rgba(0,0,0,0.1) | Modals |
| `shadow-xl` | 0 20px 25px rgba(0,0,0,0.1) | Popovers |

---

## Component Library

### Primitives (33 Components)

The codebase contains 33 UI components built on shadcn/ui and Radix primitives.

| # | Component | File | Priority |
|---|-----------|------|----------|
| 1 | Button | `button.tsx` | P0 |
| 2 | Input | `input.tsx` | P0 |
| 3 | Textarea | `textarea.tsx` | P0 |
| 4 | Card | `card.tsx` | P0 |
| 5 | Badge | `badge.tsx` | P0 |
| 6 | Alert | `alert.tsx` | P1 |
| 7 | Dialog | `dialog.tsx` | P1 |
| 8 | Dropdown Menu | `dropdown-menu.tsx` | P1 |
| 9 | Table | `table.tsx` | P1 |
| 10 | Tabs | `tabs.tsx` | P1 |
| 11 | Avatar | `avatar.tsx` | P1 |
| 12 | Progress | `progress.tsx` | P1 |
| 13 | Skeleton | `skeleton.tsx` | P2 |
| 14 | Tooltip | `tooltip.tsx` | P1 |
| 15 | Popover | `popover.tsx` | P1 |
| 16 | Select | `select.tsx` | P0 |
| 17 | Checkbox | `checkbox.tsx` | P0 |
| 18 | Radio Group | `radio-group.tsx` | P1 |
| 19 | Switch | `switch.tsx` | P1 |
| 20 | Slider | `slider.tsx` | P2 |
| 21 | Accordion | `accordion.tsx` | P2 |
| 22 | Sheet | `sheet.tsx` | P1 |
| 23 | Drawer | `drawer.tsx` | P2 |
| 24 | Breadcrumb | `breadcrumb.tsx` | P1 |
| 25 | Separator | `separator.tsx` | P2 |
| 26 | Label | `label.tsx` | P0 |
| 27 | Calendar | `calendar.tsx` | P2 |
| 28 | Scroll Area | `scroll-area.tsx` | P2 |
| 29 | Collapsible | `collapsible.tsx` | P2 |
| 30 | Alert Dialog | `alert-dialog.tsx` | P1 |
| 31 | Sidebar | `sidebar.tsx` | P1 |
| 32 | EmptyState | `EmptyState.tsx` | P1 |
| 33 | Sonner (Toast) | `sonner.tsx` | P2 |

### Component Specifications

#### 1. Button

**Variants:**

| Variant | Background | Text | Border | Hover |
|---------|------------|------|--------|-------|
| `default` | `primary` | `primary-foreground` | none | 90% opacity |
| `destructive` | `destructive` | `destructive-foreground` | none | 90% opacity |
| `outline` | transparent | `foreground` | `input` | `accent` bg |
| `secondary` | `secondary` | `secondary-foreground` | none | 80% opacity |
| `ghost` | transparent | `foreground` | none | `accent` bg |
| `link` | transparent | `primary` | none | underline |

**Sizes:**

| Size | Height | Padding X | Font Size | Radius |
|------|--------|-----------|-----------|--------|
| `sm` | 32px | 12px | 12px | 6px |
| `default` | 36px | 16px | 14px | 6px |
| `lg` | 40px | 32px | 14px | 6px |
| `icon` | 36px | 0 (square) | - | 6px |

**States:**
- Default
- Hover
- Focus (ring: `ring`, offset: 1px)
- Disabled (50% opacity, no pointer events)
- Loading (optional spinner)

**Figma Structure:**
```
Button (Component Set)
├── Variant=Default, Size=Default, State=Default
├── Variant=Default, Size=Default, State=Hover
├── Variant=Default, Size=Default, State=Focus
├── Variant=Default, Size=Default, State=Disabled
├── Variant=Default, Size=SM, State=Default
├── ... (all combinations)
└── Variant=Link, Size=LG, State=Disabled
```

---

#### 2. Input

**Specifications:**
- Height: 36px
- Padding: 12px horizontal, 4px vertical
- Border: 1px solid `input`
- Radius: 6px
- Font: 14px (desktop), 16px (mobile)
- Background: transparent
- Shadow: xs

**States:**

| State | Border | Shadow | Ring |
|-------|--------|--------|------|
| Default | `input` | xs | none |
| Focus | `ring` | xs | 2px `ring` |
| Error | `destructive` | xs | `destructive/20` |
| Disabled | `input` | none | none (50% opacity) |

**Figma Structure:**
```
Input (Component Set)
├── State=Default
├── State=Focus
├── State=Error
├── State=Disabled
├── State=Filled
└── State=Placeholder
```

---

#### 3. Card

**Specifications:**
- Background: `card`
- Border: 1px solid `border`
- Radius: 12px (xl)
- Shadow: sm

**Sub-components:**

| Part | Padding | Typography |
|------|---------|------------|
| CardHeader | 24px | - |
| CardTitle | - | semibold, leading-none |
| CardDescription | - | 14px, `muted-foreground` |
| CardContent | 24px (no top) | - |
| CardFooter | 24px (no top) | - |

**Figma Structure:**
```
Card (Component)
├── CardHeader (Auto Layout)
│   ├── CardTitle (Text)
│   └── CardDescription (Text)
├── CardContent (Auto Layout)
└── CardFooter (Auto Layout)
```

---

#### 4. Badge

**Variants:**

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| `default` | `primary` | `primary-foreground` | transparent |
| `secondary` | `secondary` | `secondary-foreground` | transparent |
| `destructive` | `destructive` | `destructive-foreground` | transparent |
| `outline` | transparent | `foreground` | `border` |

**Specifications:**
- Padding: 10px horizontal, 2px vertical
- Radius: 6px
- Font: 12px, semibold

---

#### 5. Alert

**Variants:**

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| `default` | `#EFF6FF` (blue-50) | `#1E40AF` (blue-800) | `#BFDBFE` (blue-200) |
| `destructive` | `#FEF2F2` (red-50) | `#991B1B` (red-800) | `#FECACA` (red-200) |

**Specifications:**
- Padding: 16px
- Radius: 8px
- Border: 1px solid

**Sub-components:**
- AlertTitle: font-medium, leading-none
- AlertDescription: 14px

---

#### 6. Select

**Trigger Specifications:**
- Height: 36px (default), 32px (sm)
- Padding: 12px horizontal
- Border: 1px solid `input`
- Radius: 6px
- Background: transparent
- Shadow: xs

**Content Specifications:**
- Background: `popover`
- Border: 1px solid `border`
- Radius: 6px
- Shadow: md
- Padding: 4px

**Item Specifications:**
- Padding: 6px vertical, 8px left, 32px right
- Radius: 4px
- Hover: `accent` background

---

#### 7. Checkbox

**Specifications:**
- Size: 16x16px
- Border: 1px solid `primary`
- Radius: 4px
- Checked: `primary` background, `primary-foreground` checkmark

**States:**
- Unchecked
- Checked (with Check icon, 16x16)
- Indeterminate
- Disabled (50% opacity)
- Focus (2px ring)

---

#### 8. Switch

**Specifications:**
- Track: 32x18px, rounded-full
- Thumb: 16x16px, rounded-full
- Unchecked: `input` track, `background` thumb
- Checked: `primary` track, `primary-foreground` thumb

---

#### 9. Tabs

**TabsList:**
- Background: `muted`
- Padding: 4px
- Radius: 6px
- Height: 40px

**TabsTrigger:**
- Padding: 12px horizontal, 6px vertical
- Font: 14px, medium
- Inactive: `muted-foreground`
- Active: `foreground`, `background` bg, shadow-sm
- Radius: 4px

---

#### 10. Dialog

**Overlay:**
- Background: `background/80`
- Backdrop blur: 4px

**Content:**
- Max width: 512px
- Padding: 24px
- Border: 1px solid `border`
- Radius: 8px
- Shadow: lg
- Close button: top-right, 16x16

---

#### 11. Table

**Specifications:**

| Part | Height | Padding | Border | Background |
|------|--------|---------|--------|------------|
| Header | - | - | bottom | - |
| Head | 40px | 8px | - | - |
| Row | - | - | bottom | hover: `muted/50` |
| Cell | - | 8px | - | - |
| Footer | - | - | top | `muted/50` |
| Caption | - | 16px top | - | `muted-foreground` |

---

#### 12. Progress

**Specifications:**
- Height: 8px
- Radius: full
- Background (track): `primary/20`
- Indicator: `primary`
- Animation: transition-all

---

#### 13. Avatar

**Specifications:**
- Sizes: 32x32, 40x40, 48x48, 64x64
- Radius: full
- Fallback: `muted` bg, `muted-foreground` text

---

#### 14. Skeleton

**Specifications:**
- Background: `muted`
- Animation: pulse (2s)
- Radius: 6px

---

#### 15. EmptyState

**Specifications:**
- Card with dashed border
- Padding: 40px vertical
- Centered content
- Icon: `muted-foreground`
- Title: 18px, semibold
- Description: 14px, `muted-foreground`
- Action slot below

---

## Figma File Structure

Recommended page structure for the Design System file:

```
StartupAI Design System
├── Cover (Page)
│   └── Cover frame with version info
│
├── Foundations (Page)
│   ├── Colors (Section)
│   │   ├── Light Mode Palette
│   │   └── Dark Mode Palette
│   ├── Typography (Section)
│   │   ├── Font Samples
│   │   └── Type Scale
│   ├── Spacing (Section)
│   │   └── Spacing Scale
│   └── Shadows (Section)
│       └── Shadow Examples
│
├── Components (Page)
│   ├── Buttons (Section)
│   ├── Inputs (Section)
│   ├── Cards (Section)
│   ├── Data Display (Section)
│   │   ├── Badge
│   │   ├── Table
│   │   └── Avatar
│   ├── Feedback (Section)
│   │   ├── Alert
│   │   ├── Progress
│   │   ├── Skeleton
│   │   └── Toast
│   ├── Overlays (Section)
│   │   ├── Dialog
│   │   ├── Popover
│   │   ├── Dropdown
│   │   └── Sheet
│   ├── Navigation (Section)
│   │   ├── Tabs
│   │   ├── Breadcrumb
│   │   └── Sidebar
│   └── Forms (Section)
│       ├── Select
│       ├── Checkbox
│       ├── Radio
│       ├── Switch
│       └── Slider
│
├── Patterns (Page)
│   ├── Forms
│   ├── Tables
│   └── Empty States
│
├── Page Illustrations (Page) [EXISTS]
│   └── Illustrations/404-Compass
│
└── Icons (Page)
    └── Lucide icon subset
```

---

## MCP Tool Capabilities

### Available Figma MCP Tools

| Tool | Capability | Read/Write |
|------|------------|------------|
| `get_screenshot` | Capture node as image | Read |
| `get_design_context` | Get design code/context | Read |
| `get_metadata` | Get node structure (XML) | Read |
| `get_variable_defs` | Get variable definitions | Read |
| `create_design_system_rules` | Generate design system guidance | Read |
| `get_code_connect_map` | Get code-to-design mappings | Read |
| `add_code_connect_map` | Map nodes to code components | Write |
| `generate_diagram` | Create FigJam diagrams | Write |

### Limitations

The standard Figma MCP (mcp.figma.com) provides **read-only** access. To create Variables and Components programmatically, you would need:

1. **Figma Console MCP** - Provides write access via `figma-console-mcp.southleft.com`
2. **Figma Plugin API** - Custom plugin with Tokens Studio integration
3. **Manual Creation** - Following this specification in Figma directly

### Recommended Approach

Since figma-console MCP may not be available:

1. **Create Variables manually** in Figma following the token tables above
2. **Build components manually** using the specifications
3. **Use Code Connect** to map completed components back to codebase:
   ```
   mcp__figma__add_code_connect_map({
     fileKey: "4yEXWnVK7tFJQzLKvIcsWo",
     nodeId: "<component-node-id>",
     componentName: "Button",
     source: "frontend/src/components/ui/button.tsx",
     label: "React"
   })
   ```

---

## Manual Implementation Guide

### Phase 1: Variables (2-3 hours)

1. Open Figma file `4yEXWnVK7tFJQzLKvIcsWo`
2. Open Variables panel (right sidebar or Shift+V)
3. Create collections in order:
   - Colors/Light
   - Colors/Dark (with mode switching)
   - Spacing
   - Radius
   - Typography

4. For each collection, add variables from the tables above
5. Enable "Publish with library" for each collection

### Phase 2: P0 Components (4-6 hours)

Build these first as they're most commonly used:

1. **Button** - 24 variants (6 variants x 4 sizes)
2. **Input** - 6 states
3. **Textarea** - 6 states
4. **Card** - Base + sub-components
5. **Badge** - 4 variants
6. **Select** - Trigger + Content
7. **Checkbox** - 4 states
8. **Label** - Single component

### Phase 3: P1 Components (6-8 hours)

1. Dialog, Alert Dialog
2. Dropdown Menu, Popover
3. Tabs
4. Table
5. Avatar, Progress
6. Tooltip
7. Sheet
8. Breadcrumb, Sidebar
9. Alert, Radio Group, Switch
10. EmptyState

### Phase 4: P2 Components (4-6 hours)

1. Skeleton
2. Slider
3. Accordion
4. Drawer
5. Calendar
6. Scroll Area
7. Collapsible
8. Separator
9. Sonner (Toast)

### Phase 5: Documentation

1. Add usage notes to each component
2. Create pattern examples
3. Document do's and don'ts
4. Add version info to cover page

---

## Validation Checklist

After completing the Figma population, verify:

- [ ] All color tokens match HEX values in this spec
- [ ] Light/Dark mode switching works correctly
- [ ] Spacing values use 4px base unit
- [ ] All 33 components are present
- [ ] Component variants match codebase exactly
- [ ] Focus states include ring effect
- [ ] Disabled states are 50% opacity
- [ ] Hover states are correctly defined
- [ ] Components use Variables (not raw colors)
- [ ] Auto Layout is used for all components
- [ ] Components are published to library

---

## References

**Codebase Files:**
- `/frontend/src/styles/globals.css` - CSS variables, animations
- `/frontend/tailwind.config.js` - Tailwind configuration
- `/frontend/src/components/ui/*.tsx` - All 33 components

**External:**
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS](https://tailwindcss.com)
- [Figma Variables Documentation](https://help.figma.com/hc/en-us/articles/15339657135383)

---

*Last generated: 2026-01-30 by Visual Designer Agent*

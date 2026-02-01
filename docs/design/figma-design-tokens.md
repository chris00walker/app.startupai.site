# StartupAI Design Tokens for Figma

Quick reference for manually creating the design system in Figma.

---

## Color Variables

Create these as Figma Variables (Collections > Create variable collection > "Brand Colors"):

### Semantic Colors

| Variable Name | HSL | Hex | RGB | Usage |
|--------------|-----|-----|-----|-------|
| `primary` | hsl(220, 70%, 45%) | #2563EB | rgb(37, 99, 235) | Buttons, links, active states |
| `primary-foreground` | hsl(0, 0%, 100%) | #FFFFFF | rgb(255, 255, 255) | Text on primary |
| `secondary` | hsl(220, 15%, 94%) | #EEF2F6 | rgb(238, 242, 246) | Secondary backgrounds |
| `secondary-foreground` | hsl(220, 30%, 20%) | #2B3544 | rgb(43, 53, 68) | Text on secondary |
| `accent` | hsl(160, 84%, 39%) | #14B8A6 | rgb(20, 184, 166) | Success, validation, CTAs |
| `accent-foreground` | hsl(0, 0%, 100%) | #FFFFFF | rgb(255, 255, 255) | Text on accent |
| `destructive` | hsl(0, 84%, 60%) | #DC2626 | rgb(220, 38, 38) | Errors, delete actions |
| `destructive-foreground` | hsl(0, 0%, 98%) | #FAFAFA | rgb(250, 250, 250) | Text on destructive |

### Surface Colors

| Variable Name | HSL | Hex | RGB | Usage |
|--------------|-----|-----|-----|-------|
| `background` | hsl(220, 20%, 98%) | #F8FAFC | rgb(248, 250, 252) | Page background |
| `foreground` | hsl(220, 30%, 10%) | #161B22 | rgb(22, 27, 34) | Primary text |
| `card` | hsl(0, 0%, 100%) | #FFFFFF | rgb(255, 255, 255) | Card backgrounds |
| `card-foreground` | hsl(220, 30%, 10%) | #161B22 | rgb(22, 27, 34) | Card text |
| `muted` | hsl(220, 15%, 94%) | #EEF2F6 | rgb(238, 242, 246) | Subtle backgrounds |
| `muted-foreground` | hsl(220, 10%, 45%) | #6B7280 | rgb(107, 114, 128) | Secondary text |

### Border Colors

| Variable Name | HSL | Hex | RGB | Usage |
|--------------|-----|-----|-----|-------|
| `border` | hsl(220, 15%, 88%) | #DFE4EA | rgb(223, 228, 234) | Borders, dividers |
| `input` | hsl(220, 15%, 88%) | #DFE4EA | rgb(223, 228, 234) | Input borders |
| `ring` | hsl(220, 70%, 45%) | #2563EB | rgb(37, 99, 235) | Focus rings |

---

## Typography Styles

Create these as Figma Text Styles:

### Headings (Display Font: Inter or System Serif)

| Style Name | Size | Weight | Line Height | Letter Spacing |
|------------|------|--------|-------------|----------------|
| `Heading/H1` | 36px | 700 (Bold) | 1.2 | -0.02em |
| `Heading/H2` | 30px | 700 (Bold) | 1.2 | -0.02em |
| `Heading/H3` | 24px | 600 (SemiBold) | 1.3 | -0.01em |
| `Heading/H4` | 20px | 600 (SemiBold) | 1.3 | -0.01em |
| `Heading/H5` | 18px | 600 (SemiBold) | 1.4 | 0 |
| `Heading/H6` | 16px | 600 (SemiBold) | 1.4 | 0 |

### Body (Body Font: Inter or System Sans)

| Style Name | Size | Weight | Line Height | Letter Spacing |
|------------|------|--------|-------------|----------------|
| `Body/Large` | 18px | 400 (Regular) | 1.6 | 0 |
| `Body/Default` | 16px | 400 (Regular) | 1.5 | 0 |
| `Body/Small` | 14px | 400 (Regular) | 1.5 | 0 |
| `Body/XSmall` | 12px | 400 (Regular) | 1.4 | 0 |

### Labels & UI Text

| Style Name | Size | Weight | Line Height | Letter Spacing |
|------------|------|--------|-------------|----------------|
| `Label/Default` | 14px | 500 (Medium) | 1.4 | 0.01em |
| `Label/Small` | 12px | 500 (Medium) | 1.3 | 0.02em |
| `Button/Default` | 14px | 500 (Medium) | 1 | 0.01em |
| `Button/Small` | 12px | 500 (Medium) | 1 | 0.02em |

---

## Spacing & Sizing

Create these as Figma Variables (Collection: "Spacing"):

| Variable Name | Value | Usage |
|--------------|-------|-------|
| `spacing-1` | 4px | Micro spacing |
| `spacing-2` | 8px | Tight spacing |
| `spacing-3` | 12px | Small gaps |
| `spacing-4` | 16px | Default padding |
| `spacing-5` | 20px | Section gaps |
| `spacing-6` | 24px | Large padding |
| `spacing-8` | 32px | Section spacing |
| `spacing-10` | 40px | Large sections |
| `spacing-12` | 48px | Page sections |
| `spacing-16` | 64px | Major sections |

---

## Border Radius

Create these as Figma Variables (Collection: "Radius"):

| Variable Name | Value | Usage |
|--------------|-------|-------|
| `radius-sm` | 4px | Small elements (badges) |
| `radius-md` | 6px | Default (inputs) |
| `radius-lg` | 8px | Cards, buttons |
| `radius-xl` | 12px | Large cards |
| `radius-2xl` | 16px | Modals |
| `radius-full` | 9999px | Pills, avatars |

---

## Shadows

Create these as Figma Effects:

| Effect Name | CSS Equivalent | Usage |
|-------------|---------------|-------|
| `Shadow/SM` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `Shadow/MD` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `Shadow/LG` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, popovers |
| `Shadow/XL` | `0 20px 25px rgba(0,0,0,0.15)` | Dialogs |
| `Shadow/Primary` | `0 4px 14px rgba(37,99,235,0.25)` | Primary button hover |
| `Shadow/Accent` | `0 4px 14px rgba(20,184,166,0.25)` | Accent button hover |

---

## Component Checklist

### Buttons

- [ ] Primary (filled blue)
- [ ] Secondary (filled gray)
- [ ] Outline (border only)
- [ ] Ghost (no fill, no border)
- [ ] Destructive (filled red)
- [ ] Link (text only)

**States for each**: Default, Hover, Active, Focused, Disabled, Loading

### Inputs

- [ ] Text Input
- [ ] Textarea
- [ ] Select
- [ ] Checkbox
- [ ] Radio
- [ ] Switch/Toggle

**States for each**: Default, Hover, Focused, Filled, Error, Disabled

### Cards

- [ ] Default Card
- [ ] Elevated Card (shadow)
- [ ] Bordered Card
- [ ] Interactive Card (hover state)

### Badges

- [ ] Default (gray)
- [ ] Primary (blue)
- [ ] Success (green)
- [ ] Warning (yellow)
- [ ] Error (red)
- [ ] Outline variants

### Navigation

- [ ] Sidebar Nav Item
- [ ] Tab
- [ ] Breadcrumb
- [ ] Pagination

---

## Brand Guidelines Reference

From `/home/chris/.claude/design-prompts/illustrations.md`:

| Brand Color | Hex | Use |
|-------------|-----|-----|
| Deep Navy | #1a365d | Primary anchoring elements |
| Strategic Blue | #3b82f6 | Main visual interest |
| Teal Accent | #2dd4bf | Growth, success, validation |
| Light Gray | #f3f4f6 | Backgrounds |
| Warm Gray | #6b7280 | Secondary elements |

---

**Created**: 2026-01-30
**Source**: Code analysis of globals.css and tailwind.config.js

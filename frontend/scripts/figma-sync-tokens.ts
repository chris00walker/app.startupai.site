#!/usr/bin/env tsx
/**
 * Figma Design Token Sync Script
 *
 * Syncs design tokens from Figma Variables to CSS custom properties in globals.css.
 *
 * Usage:
 *   pnpm figma:sync-tokens           # Check mode (default) - reports drift
 *   pnpm figma:sync-tokens --check   # Check mode - exits 1 if drift detected
 *   pnpm figma:sync-tokens --update  # Update mode - writes changes to globals.css
 *
 * Requires FIGMA_ACCESS_TOKEN environment variable.
 *
 * @story US-F09
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
  valuesByMode: Record<string, FigmaVariableValue>;
  description?: string;
}

interface FigmaVariableCollection {
  id: string;
  name: string;
  key: string;
  modes: Array<{ modeId: string; name: string }>;
  variableIds: string[];
}

type FigmaVariableValue =
  | { type: "VARIABLE_ALIAS"; id: string }
  | { r: number; g: number; b: number; a: number } // Color (RGBA 0-1)
  | number // Float
  | string // String
  | boolean; // Boolean

interface FigmaVariablesResponse {
  status: number;
  error: boolean;
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  };
}

interface CSSToken {
  name: string;
  value: string;
  mode: "light" | "dark";
}

interface TokenDiff {
  added: CSSToken[];
  removed: CSSToken[];
  changed: Array<{ name: string; mode: "light" | "dark"; oldValue: string; newValue: string }>;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const FIGMA_FILES_PATH = path.resolve(
  process.env.HOME || "~",
  ".claude/figma-files.json"
);
const GLOBALS_CSS_PATH = path.resolve(__dirname, "../src/styles/globals.css");

// Token name mappings: Figma variable name -> CSS custom property name
// Figma uses "/" separators, CSS uses "-"
const TOKEN_NAME_MAP: Record<string, string> = {
  // Semantic colors
  primary: "primary",
  "primary-foreground": "primary-foreground",
  secondary: "secondary",
  "secondary-foreground": "secondary-foreground",
  accent: "accent",
  "accent-foreground": "accent-foreground",
  destructive: "destructive",
  "destructive-foreground": "destructive-foreground",

  // Surface colors
  background: "background",
  foreground: "foreground",
  card: "card",
  "card-foreground": "card-foreground",
  popover: "popover",
  "popover-foreground": "popover-foreground",
  muted: "muted",
  "muted-foreground": "muted-foreground",

  // Border colors
  border: "border",
  input: "input",
  ring: "ring",

  // Spacing
  "spacing/1": "spacing-1",
  "spacing/2": "spacing-2",
  "spacing/3": "spacing-3",
  "spacing/4": "spacing-4",
  "spacing/5": "spacing-5",
  "spacing/6": "spacing-6",
  "spacing/8": "spacing-8",
  "spacing/10": "spacing-10",
  "spacing/12": "spacing-12",
  "spacing/16": "spacing-16",

  // Border radius
  "radius/sm": "radius-sm",
  "radius/md": "radius-md",
  "radius/lg": "radius-lg",
  "radius/xl": "radius-xl",
  "radius/2xl": "radius-2xl",
  "radius/full": "radius-full",

  // Sidebar variants (if present)
  "sidebar/background": "sidebar-background",
  "sidebar/foreground": "sidebar-foreground",
  "sidebar/primary": "sidebar-primary",
  "sidebar/primary-foreground": "sidebar-primary-foreground",
  "sidebar/accent": "sidebar-accent",
  "sidebar/accent-foreground": "sidebar-accent-foreground",
  "sidebar/border": "sidebar-border",
  "sidebar/ring": "sidebar-ring",
};

// Mode name mappings: Figma mode name -> CSS selector
const MODE_MAP: Record<string, "light" | "dark"> = {
  Light: "light",
  light: "light",
  Default: "light",
  default: "light",
  Dark: "dark",
  dark: "dark",
};

// ---------------------------------------------------------------------------
// Figma API
// ---------------------------------------------------------------------------

async function fetchFigmaVariables(
  fileKey: string,
  accessToken: string
): Promise<FigmaVariablesResponse> {
  const url = `https://api.figma.com/v1/files/${fileKey}/variables/local`;

  const response = await fetch(url, {
    headers: {
      "X-Figma-Token": accessToken,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    // Check for scope error
    if (response.status === 403 && text.includes("file_variables:read")) {
      throw new Error(
        `Figma API requires file_variables:read scope.\n` +
        `Your token is missing this scope. Please generate a new token with:\n` +
        `  - file_variables:read\n` +
        `  - file_content:read\n` +
        `Go to: Figma > Account Settings > Personal Access Tokens`
      );
    }
    throw new Error(`Figma API error (${response.status}): ${text}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Color Conversion
// ---------------------------------------------------------------------------

/**
 * Convert Figma RGBA (0-1) to HSL string for CSS
 * Returns format: "220 70% 45%" (without hsl() wrapper for Tailwind compatibility)
 */
function rgbaToHsl(r: number, g: number, b: number): string {
  // r, g, b are already in 0-1 range from Figma
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    // Achromatic
    return `0 0% ${Math.round(l * 100)}%`;
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// ---------------------------------------------------------------------------
// CSS Parsing
// ---------------------------------------------------------------------------

/**
 * Parse CSS custom properties from globals.css
 */
function parseCSSTokens(cssContent: string): { light: Map<string, string>; dark: Map<string, string> } {
  const light = new Map<string, string>();
  const dark = new Map<string, string>();

  // Match :root block
  const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
  if (rootMatch) {
    const props = rootMatch[1].matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi);
    for (const match of props) {
      light.set(match[1], match[2].trim());
    }
  }

  // Match .dark block
  const darkMatch = cssContent.match(/\.dark\s*\{([^}]+)\}/);
  if (darkMatch) {
    const props = darkMatch[1].matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi);
    for (const match of props) {
      dark.set(match[1], match[2].trim());
    }
  }

  return { light, dark };
}

/**
 * Update CSS content with new tokens
 */
function updateCSSTokens(
  cssContent: string,
  lightTokens: Map<string, string>,
  darkTokens: Map<string, string>
): string {
  let result = cssContent;

  // Update :root block
  const rootMatch = result.match(/(:root\s*\{)([^}]+)(\})/);
  if (rootMatch) {
    let rootContent = rootMatch[2];
    for (const [name, value] of lightTokens) {
      const regex = new RegExp(`(--${name}:)\\s*[^;]+;`, "g");
      if (regex.test(rootContent)) {
        rootContent = rootContent.replace(regex, `$1 ${value};`);
      }
    }
    result = result.replace(rootMatch[0], `${rootMatch[1]}${rootContent}${rootMatch[3]}`);
  }

  // Update .dark block
  const darkMatch = result.match(/(\.dark\s*\{)([^}]+)(\})/);
  if (darkMatch) {
    let darkContent = darkMatch[2];
    for (const [name, value] of darkTokens) {
      const regex = new RegExp(`(--${name}:)\\s*[^;]+;`, "g");
      if (regex.test(darkContent)) {
        darkContent = darkContent.replace(regex, `$1 ${value};`);
      }
    }
    result = result.replace(darkMatch[0], `${darkMatch[1]}${darkContent}${darkMatch[3]}`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Token Transformation
// ---------------------------------------------------------------------------

/**
 * Transform Figma variables to CSS tokens
 */
function transformFigmaVariables(
  data: FigmaVariablesResponse
): { light: Map<string, string>; dark: Map<string, string> } {
  const light = new Map<string, string>();
  const dark = new Map<string, string>();
  const { variables, variableCollections } = data.meta;

  for (const variable of Object.values(variables)) {
    const collection = variableCollections[variable.variableCollectionId];
    if (!collection) continue;

    // Normalize variable name (handle nested paths like "colors/primary")
    const normalizedName = variable.name.toLowerCase().replace(/\//g, "/");
    const cssName = TOKEN_NAME_MAP[normalizedName] || TOKEN_NAME_MAP[variable.name];

    if (!cssName) {
      // Skip unmapped variables
      continue;
    }

    for (const mode of collection.modes) {
      const modeKey = MODE_MAP[mode.name];
      if (!modeKey) continue;

      const value = variable.valuesByMode[mode.modeId];
      if (!value) continue;

      // Handle alias values (resolve to actual value)
      if (typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS") {
        // For aliases, we'd need to resolve them - skip for now
        continue;
      }

      let cssValue: string;

      switch (variable.resolvedType) {
        case "COLOR":
          if (typeof value === "object" && "r" in value) {
            cssValue = rgbaToHsl(value.r, value.g, value.b);
          } else {
            continue;
          }
          break;

        case "FLOAT":
          if (typeof value === "number") {
            // Assume pixels for spacing/radius
            cssValue = `${value}px`;
            // Special case: radius uses rem
            if (cssName.startsWith("radius")) {
              cssValue = `${value / 16}rem`;
            }
          } else {
            continue;
          }
          break;

        case "STRING":
          cssValue = String(value);
          break;

        default:
          continue;
      }

      if (modeKey === "light") {
        light.set(cssName, cssValue);
      } else {
        dark.set(cssName, cssValue);
      }
    }
  }

  return { light, dark };
}

// ---------------------------------------------------------------------------
// Diff Calculation
// ---------------------------------------------------------------------------

function calculateDiff(
  current: { light: Map<string, string>; dark: Map<string, string> },
  figma: { light: Map<string, string>; dark: Map<string, string> }
): TokenDiff {
  const diff: TokenDiff = {
    added: [],
    removed: [],
    changed: [],
  };

  // Check light mode
  for (const [name, value] of figma.light) {
    const currentValue = current.light.get(name);
    if (currentValue === undefined) {
      diff.added.push({ name, value, mode: "light" });
    } else if (normalizeValue(currentValue) !== normalizeValue(value)) {
      diff.changed.push({ name, mode: "light", oldValue: currentValue, newValue: value });
    }
  }

  for (const [name] of current.light) {
    if (figma.light.has(name) === false && TOKEN_NAME_MAP[name] !== undefined) {
      diff.removed.push({ name, value: current.light.get(name)!, mode: "light" });
    }
  }

  // Check dark mode
  for (const [name, value] of figma.dark) {
    const currentValue = current.dark.get(name);
    if (currentValue === undefined) {
      diff.added.push({ name, value, mode: "dark" });
    } else if (normalizeValue(currentValue) !== normalizeValue(value)) {
      diff.changed.push({ name, mode: "dark", oldValue: currentValue, newValue: value });
    }
  }

  for (const [name] of current.dark) {
    if (figma.dark.has(name) === false && TOKEN_NAME_MAP[name] !== undefined) {
      diff.removed.push({ name, value: current.dark.get(name)!, mode: "dark" });
    }
  }

  return diff;
}

/**
 * Normalize CSS values for comparison (handle whitespace, decimals)
 */
function normalizeValue(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(\d+)\.0+(%|px|rem|em)?/g, "$1$2");
}

// ---------------------------------------------------------------------------
// Output Formatting
// ---------------------------------------------------------------------------

function formatDiff(diff: TokenDiff): string {
  const lines: string[] = [];

  if (diff.added.length > 0) {
    lines.push("\n  Added (in Figma, not in CSS):");
    for (const token of diff.added) {
      lines.push(`    + --${token.name}: ${token.value} [${token.mode}]`);
    }
  }

  if (diff.removed.length > 0) {
    lines.push("\n  Removed (in CSS, not in Figma):");
    for (const token of diff.removed) {
      lines.push(`    - --${token.name}: ${token.value} [${token.mode}]`);
    }
  }

  if (diff.changed.length > 0) {
    lines.push("\n  Changed:");
    for (const change of diff.changed) {
      lines.push(`    ~ --${change.name} [${change.mode}]:`);
      lines.push(`        CSS:   ${change.oldValue}`);
      lines.push(`        Figma: ${change.newValue}`);
    }
  }

  return lines.join("\n");
}

function hasDrift(diff: TokenDiff): boolean {
  return diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const checkMode = args.includes("--check");
  const updateMode = args.includes("--update");

  console.log("Figma Design Token Sync");
  console.log("=======================\n");

  // Check for Figma access token
  const accessToken = process.env.FIGMA_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("Error: FIGMA_ACCESS_TOKEN environment variable is not set.\n");
    console.error("To get a Figma access token:");
    console.error("  1. Go to Figma > Account Settings > Personal Access Tokens");
    console.error("  2. Generate a new token with these scopes:");
    console.error("     - file_variables:read (required for Variables API)");
    console.error("     - file_content:read (for fallback file access)");
    console.error("  3. Set: export FIGMA_ACCESS_TOKEN='your-token'\n");
    process.exit(1);
  }

  // Load Figma file key
  if (!fs.existsSync(FIGMA_FILES_PATH)) {
    console.error(`Error: Figma files config not found at ${FIGMA_FILES_PATH}`);
    process.exit(1);
  }

  const figmaFiles = JSON.parse(fs.readFileSync(FIGMA_FILES_PATH, "utf-8"));
  const fileKey = figmaFiles["design-system"]?.fileKey;

  if (!fileKey) {
    console.error("Error: Design system file key not found in figma-files.json");
    console.error("Please update ~/.claude/figma-files.json with the design system file key.");
    process.exit(1);
  }

  console.log(`Figma file: ${figmaFiles["design-system"]?.url || fileKey}`);
  console.log(`CSS file: ${GLOBALS_CSS_PATH}\n`);

  // Fetch Figma variables
  console.log("Fetching Figma variables...");
  let figmaData: FigmaVariablesResponse;
  try {
    figmaData = await fetchFigmaVariables(fileKey, accessToken);
  } catch (error) {
    console.error(`Error fetching Figma variables: ${error}`);
    process.exit(1);
  }

  const variableCount = Object.keys(figmaData.meta.variables).length;
  const collectionCount = Object.keys(figmaData.meta.variableCollections).length;
  console.log(`  Found ${variableCount} variables in ${collectionCount} collections\n`);

  // Transform Figma variables
  const figmaTokens = transformFigmaVariables(figmaData);
  console.log(`  Mapped ${figmaTokens.light.size} light tokens, ${figmaTokens.dark.size} dark tokens\n`);

  // Parse current CSS
  if (!fs.existsSync(GLOBALS_CSS_PATH)) {
    console.error(`Error: globals.css not found at ${GLOBALS_CSS_PATH}`);
    process.exit(1);
  }

  const cssContent = fs.readFileSync(GLOBALS_CSS_PATH, "utf-8");
  const currentTokens = parseCSSTokens(cssContent);
  console.log(`  Current CSS has ${currentTokens.light.size} light tokens, ${currentTokens.dark.size} dark tokens\n`);

  // Calculate diff
  const diff = calculateDiff(currentTokens, figmaTokens);

  if (!hasDrift(diff)) {
    console.log("No drift detected. CSS tokens match Figma variables.");
    process.exit(0);
  }

  console.log("Token drift detected:");
  console.log(formatDiff(diff));
  console.log();

  if (updateMode) {
    // Apply updates
    const updatedCSS = updateCSSTokens(cssContent, figmaTokens.light, figmaTokens.dark);
    fs.writeFileSync(GLOBALS_CSS_PATH, updatedCSS, "utf-8");
    console.log(`Updated ${GLOBALS_CSS_PATH}`);
    console.log("Run 'pnpm figma:sync-tokens --check' to verify changes.\n");
    process.exit(0);
  }

  if (checkMode) {
    console.log("Drift detected. Run 'pnpm figma:sync-tokens --update' to apply changes.\n");
    process.exit(1);
  }

  // Default: just report
  console.log("Run with --update to apply changes, or --check to exit with error on drift.\n");
  process.exit(0);
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});

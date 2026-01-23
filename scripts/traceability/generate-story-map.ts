#!/usr/bin/env tsx
/**
 * Story-Code Map Generator
 *
 * Generates story-code-map.json from:
 * 1. Story definitions (stories/*.md)
 * 2. Code annotations (@story tags)
 * 3. Baseline mappings (journey-test-matrix.md, feature-inventory.md)
 * 4. Manual overrides (story-code-overrides.yaml)
 *
 * Usage:
 *   pnpm traceability:generate          # Generate full map
 *   pnpm traceability:generate --report gaps  # Show gap report only
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  PROJECT_ROOT,
  SCAN_DIRS,
  SCAN_EXTENSIONS,
  EXCLUDE_DIRS,
  STORY_SOURCES,
  STORY_ID_PATTERN,
  JOURNEY_TEST_MATRIX_PATH,
  FEATURE_INVENTORY_PATH,
  STORY_CODE_MAP_PATH,
  OVERRIDES_PATH,
  GAP_REPORT_PATH,
  ORPHAN_REPORT_PATH,
  OUTPUT_DIR,
  classifyFileType,
  getCategoryForStory,
} from './config';
import {
  applyAnnotationsToStories,
  parseAnnotationsFromContent,
  parseFeatureInventoryContent,
  parseJourneyTestMatrixContent,
  validateOverridesData,
} from './core';
import type {
  StoryCodeMap,
  StoryEntry,
  StoryDefinition,
  StoryOverrides,
  ParsedAnnotation,
  E2ETestReference,
} from './schema';

// =============================================================================
// Story Definition Parser
// =============================================================================

/**
 * Parse story definitions from markdown files
 */
function parseStoryDefinitions(): Map<string, StoryDefinition> {
  const stories = new Map<string, StoryDefinition>();

  for (const relativePath of STORY_SOURCES) {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`Warning: Story source not found: ${relativePath}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');

    // Pattern to match story headers: ### US-XXX: Title
    const storyPattern = /^###\s+(US-[A-Z]{1,3}\d{1,2}):\s*(.+)$/gm;
    let match;

    while ((match = storyPattern.exec(content)) !== null) {
      const [, id, title] = match;
      if (STORY_ID_PATTERN.test(id)) {
        stories.set(id, {
          id,
          title: title.trim(),
          source_file: relativePath,
        });
      }
    }
  }

  return stories;
}

// =============================================================================
// Code Annotation Parser
// =============================================================================

/**
 * Recursively find all files in a directory
 */
function findFiles(dir: string, extensions: readonly string[]): string[] {
  const files: string[] = [];
  const fullDir = path.join(PROJECT_ROOT, dir);

  if (!fs.existsSync(fullDir)) {
    return files;
  }

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(PROJECT_ROOT, fullPath);

      // Skip excluded directories
      if (entry.isDirectory()) {
        if (EXCLUDE_DIRS.some((ex) => entry.name === ex || relativePath.includes(ex))) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        if (extensions.some((ext) => entry.name.endsWith(ext))) {
          files.push(relativePath);
        }
      }
    }
  }

  walk(fullDir);
  return files;
}

/**
 * Parse @story annotations from a file
 */
function parseFileAnnotations(filePath: string): ParsedAnnotation[] {
  const fullPath = path.join(PROJECT_ROOT, filePath);

  if (!fs.existsSync(fullPath)) {
    return [];
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  return parseAnnotationsFromContent(content, filePath);
}

/**
 * Scan all source files for annotations
 */
function scanAllAnnotations(): ParsedAnnotation[] {
  const allAnnotations: ParsedAnnotation[] = [];

  for (const dir of SCAN_DIRS) {
    const files = findFiles(dir, SCAN_EXTENSIONS);
    for (const file of files) {
      const annotations = parseFileAnnotations(file);
      allAnnotations.push(...annotations);
    }
  }

  return allAnnotations;
}

// =============================================================================
// Override Parser
// =============================================================================

/**
 * Parse and validate overrides file
 */
function parseOverrides(): StoryOverrides {
  const fullPath = path.join(PROJECT_ROOT, OVERRIDES_PATH);

  if (!fs.existsSync(fullPath)) {
    console.warn(`Warning: Overrides file not found: ${OVERRIDES_PATH}`);
    return {};
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  let data: Record<string, Record<string, unknown>>;
  try {
    data = yaml.load(content) as Record<string, Record<string, unknown>>;
  } catch (err) {
    console.warn(`Warning: Invalid YAML in overrides file: ${OVERRIDES_PATH}`);
    return {};
  }

  const { overrides, warnings, rejected } = validateOverridesData(data);

  if (warnings.length > 0) {
    console.warn('Override validation warnings:');
    for (const w of warnings) {
      console.warn(`  - ${w}`);
    }
  }

  if (rejected.length > 0) {
    console.warn(`Overrides rejected for ${rejected.length} stories due to forbidden fields`);
  }

  return overrides;
}

// =============================================================================
// Baseline Parsers
// =============================================================================

/**
 * Load baseline story-to-test mappings from journey-test-matrix.md
 */
function loadJourneyTestMatrix(): Record<string, E2ETestReference[]> {
  const fullPath = path.join(PROJECT_ROOT, JOURNEY_TEST_MATRIX_PATH);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Warning: Journey-test matrix not found: ${JOURNEY_TEST_MATRIX_PATH}`);
    return {};
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  return parseJourneyTestMatrixContent(content);
}

/**
 * Load baseline story-to-file hints from feature-inventory.md
 */
function loadFeatureInventory(): Record<string, string[]> {
  const fullPath = path.join(PROJECT_ROOT, FEATURE_INVENTORY_PATH);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Warning: Feature inventory not found: ${FEATURE_INVENTORY_PATH}`);
    return {};
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  return parseFeatureInventoryContent(content);
}

// =============================================================================
// Map Builder
// =============================================================================

/**
 * Create empty story entry
 */
function createEmptyStoryEntry(title: string): StoryEntry {
  return {
    title,
    components: [],
    api_routes: [],
    pages: [],
    hooks: [],
    lib: [],
    e2e_tests: [],
    unit_tests: [],
    db_tables: [],
    implementation_status: 'gap',
  };
}

/**
 * Build reverse file index from final story entries
 */
function buildFilesIndex(stories: Record<string, StoryEntry>): Record<string, { stories: string[] }> {
  const files: Record<string, { stories: string[] }> = {};

  const addFile = (filePath: string, storyId: string) => {
    if (!files[filePath]) {
      files[filePath] = { stories: [] };
    }
    if (!files[filePath].stories.includes(storyId)) {
      files[filePath].stories.push(storyId);
    }
  };

  for (const [storyId, entry] of Object.entries(stories)) {
    for (const file of entry.components) addFile(file, storyId);
    for (const file of entry.api_routes) addFile(file, storyId);
    for (const file of entry.pages) addFile(file, storyId);
    for (const file of entry.hooks) addFile(file, storyId);
    for (const file of entry.lib) addFile(file, storyId);
    for (const file of entry.unit_tests) addFile(file, storyId);
    for (const test of entry.e2e_tests) {
      const testPath = test.file.includes('/')
        ? test.file
        : path.posix.join('frontend/tests/e2e', test.file);
      addFile(testPath, storyId);
    }
  }

  return files;
}

/**
 * Build the story-code map
 */
function buildStoryCodeMap(): StoryCodeMap {
  console.log('Parsing story definitions...');
  const storyDefs = parseStoryDefinitions();
  console.log(`  Found ${storyDefs.size} stories`);

  console.log('Parsing baseline test mappings...');
  const baselineTests = loadJourneyTestMatrix();
  console.log(`  Found ${Object.keys(baselineTests).length} story test mappings`);

  console.log('Parsing baseline feature hints...');
  const baselineFeatures = loadFeatureInventory();
  console.log(`  Found ${Object.keys(baselineFeatures).length} story file hints`);

  console.log('Scanning code for annotations...');
  const annotations = scanAllAnnotations();
  console.log(`  Found ${annotations.length} annotations`);

  console.log('Parsing overrides...');
  const overrides = parseOverrides();
  console.log(`  Found ${Object.keys(overrides).length} overrides`);

  // Initialize stories from definitions
  const stories: Record<string, StoryEntry> = {};
  for (const [id, def] of storyDefs.entries()) {
    stories[id] = createEmptyStoryEntry(def.title);
  }

  const validStoryIds = new Set(storyDefs.keys());
  const unknownBaselineStoryIds = new Set<string>();
  const missingBaselineTests = new Set<string>();
  const missingBaselineFiles = new Set<string>();

  // Apply baseline test mappings
  for (const [storyId, tests] of Object.entries(baselineTests)) {
    const entry = stories[storyId];
    if (!entry) {
      unknownBaselineStoryIds.add(storyId);
      continue;
    }

    for (const test of tests) {
      const testPath = test.file.includes('/')
        ? test.file
        : path.posix.join('frontend/tests/e2e', test.file);
      const fullTestPath = path.join(PROJECT_ROOT, testPath);
      if (!fs.existsSync(fullTestPath)) {
        missingBaselineTests.add(testPath);
        continue;
      }

      const exists = entry.e2e_tests.some(
        (ref) => ref.file === test.file && ref.test_name === test.test_name
      );
      if (!exists) {
        entry.e2e_tests.push(test);
      }
    }
  }

  // Apply baseline file hints
  for (const [storyId, files] of Object.entries(baselineFeatures)) {
    const entry = stories[storyId];
    if (!entry) {
      unknownBaselineStoryIds.add(storyId);
      continue;
    }

    for (const file of files) {
      const fullPath = path.join(PROJECT_ROOT, file);
      if (!fs.existsSync(fullPath)) {
        missingBaselineFiles.add(file);
        continue;
      }

      switch (classifyFileType(file)) {
        case 'component':
          if (!entry.components.includes(file)) entry.components.push(file);
          break;
        case 'api_route':
          if (!entry.api_routes.includes(file)) entry.api_routes.push(file);
          break;
        case 'page':
          if (!entry.pages.includes(file)) entry.pages.push(file);
          break;
        case 'hook':
          if (!entry.hooks.includes(file)) entry.hooks.push(file);
          break;
        case 'lib':
          if (!entry.lib.includes(file)) entry.lib.push(file);
          break;
        case 'unit_test':
          if (!entry.unit_tests.includes(file)) entry.unit_tests.push(file);
          break;
        case 'e2e_test': {
          const fileName = file.split('/').pop() || file;
          const testRef: E2ETestReference = { file: fileName };
          if (!entry.e2e_tests.some((t) => t.file === testRef.file)) {
            entry.e2e_tests.push(testRef);
          }
          break;
        }
      }
    }
  }

  if (unknownBaselineStoryIds.size > 0) {
    console.warn('\nWarning: Unknown story IDs found in baselines (skipped):');
    for (const id of unknownBaselineStoryIds) {
      console.warn(`  - ${id}`);
    }
  }

  if (missingBaselineTests.size > 0) {
    console.warn('\nWarning: Baseline test files not found (skipped):');
    for (const file of missingBaselineTests) {
      console.warn(`  - ${file}`);
    }
  }

  if (missingBaselineFiles.size > 0) {
    console.warn('\nWarning: Baseline feature files not found (skipped):');
    for (const file of missingBaselineFiles) {
      console.warn(`  - ${file}`);
    }
  }

  // Apply annotations (authoritative for code links)
  const { unknownStoryIds, annotatedFiles } = applyAnnotationsToStories(
    stories,
    annotations,
    validStoryIds
  );

  if (unknownStoryIds.size > 0) {
    console.warn('\nWarning: Unknown story IDs found in annotations (dropped):');
    for (const id of unknownStoryIds) {
      console.warn(`  - ${id}`);
    }
  }

  // Merge overrides
  for (const [storyId, override] of Object.entries(overrides)) {
    if (!stories[storyId]) {
      console.warn(`  Warning: Override for unknown story ${storyId} (skipped)`);
      continue;
    }

    const entry = stories[storyId];

    if (override.db_tables) {
      entry.db_tables = override.db_tables;
    }
    if (override.notes) {
      entry.notes = override.notes;
    }
    if (override.implementation_status) {
      entry.implementation_status = override.implementation_status;
    }
  }

  // Determine implementation status for stories without explicit override
  for (const [storyId, entry] of Object.entries(stories)) {
    // Skip if status was set by override
    const override = overrides[storyId];
    if (override?.implementation_status) {
      continue;
    }

    // Calculate status based on code links
    const hasCode =
      entry.components.length > 0 ||
      entry.api_routes.length > 0 ||
      entry.pages.length > 0;
    const hasTests = entry.e2e_tests.length > 0 || entry.unit_tests.length > 0;

    if (hasCode && hasTests) {
      entry.implementation_status = 'complete';
    } else if (hasCode) {
      entry.implementation_status = 'partial';
    } else if (hasTests) {
      entry.implementation_status = 'partial';
    } else {
      entry.implementation_status = 'gap';
    }
  }

  const files = buildFilesIndex(stories);

  const map: StoryCodeMap = {
    metadata: {
      generated_at: new Date().toISOString(),
      version: '1.0.0',
      story_count: storyDefs.size,
      annotated_file_count: annotatedFiles.size,
    },
    stories,
    files,
  };

  return map;
}

// =============================================================================
// Report Generators
// =============================================================================

/**
 * Generate gap report
 */
function generateGapReport(map: StoryCodeMap): string {
  const lines: string[] = [
    '# Story-Code Gap Report',
    '',
    `Generated: ${map.metadata.generated_at}`,
    '',
    '## Stories Without Implementations',
    '',
    '| Story ID | Title | Category |',
    '|----------|-------|----------|',
  ];

  const gaps: Array<{ id: string; entry: StoryEntry }> = [];

  for (const [id, entry] of Object.entries(map.stories)) {
    if (entry.implementation_status === 'gap') {
      gaps.push({ id, entry });
    }
  }

  // Sort by ID
  gaps.sort((a, b) => a.id.localeCompare(b.id));

  for (const { id, entry } of gaps) {
    const category = getCategoryForStory(id);
    lines.push(`| ${id} | ${entry.title} | ${category} |`);
  }

  lines.push('');
  lines.push(`**Total Gaps: ${gaps.length} / ${map.metadata.story_count}**`);
  lines.push('');

  // Group by category
  const byCategory = new Map<string, number>();
  for (const { id } of gaps) {
    const cat = getCategoryForStory(id);
    byCategory.set(cat, (byCategory.get(cat) || 0) + 1);
  }

  lines.push('## Gaps by Category');
  lines.push('');
  lines.push('| Category | Count |');
  lines.push('|----------|-------|');

  for (const [cat, count] of Array.from(byCategory.entries()).sort()) {
    lines.push(`| ${cat} | ${count} |`);
  }

  return lines.join('\n');
}

/**
 * Generate orphan report
 */
function generateOrphanReport(map: StoryCodeMap): string {
  const lines: string[] = [
    '# Orphan Files Report',
    '',
    `Generated: ${map.metadata.generated_at}`,
    '',
    '## Files Without Story Links',
    '',
    'These files in scanned directories have no `@story` annotation.',
    '',
    '| File | Type | Recommendation |',
    '|------|------|----------------|',
  ];

  // Find all scanned files
  const allFiles = new Set<string>();
  for (const dir of SCAN_DIRS) {
    const files = findFiles(dir, SCAN_EXTENSIONS);
    for (const file of files) {
      allFiles.add(file);
    }
  }

  // Find files without annotations
  const orphans: Array<{ file: string; type: string }> = [];
  for (const file of allFiles) {
    if (!map.files[file]) {
      const type = classifyFileType(file);
      orphans.push({ file, type });
    }
  }

  // Sort by type then file
  orphans.sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.file.localeCompare(b.file);
  });

  for (const { file, type } of orphans) {
    let recommendation = 'Add @story annotation or consider if needed';
    if (type === 'unit_test' || type === 'e2e_test') {
      recommendation = 'Link to tested story';
    } else if (file.includes('index.ts')) {
      recommendation = 'Export file - usually no annotation needed';
    } else if (file.includes('types') || file.includes('.d.ts')) {
      recommendation = 'Type definitions - usually no annotation needed';
    }

    lines.push(`| ${file} | ${type} | ${recommendation} |`);
  }

  lines.push('');
  lines.push(`**Total Orphans: ${orphans.length}**`);

  return lines.join('\n');
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const reportOnly = args.includes('--report');
  const reportType = args[args.indexOf('--report') + 1];

  console.log('='.repeat(60));
  console.log('Story-Code Map Generator');
  console.log('='.repeat(60));
  console.log('');

  // Ensure output directory exists
  const outputDir = path.join(PROJECT_ROOT, OUTPUT_DIR);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Build the map
  const map = buildStoryCodeMap();

  // Generate reports
  const gapReport = generateGapReport(map);
  const orphanReport = generateOrphanReport(map);

  // Handle report-only mode
  if (reportOnly) {
    if (reportType === 'gaps') {
      console.log('\n' + gapReport);
    } else if (reportType === 'orphans') {
      console.log('\n' + orphanReport);
    } else {
      console.log('\n' + gapReport);
      console.log('\n' + orphanReport);
    }
    return;
  }

  // Write outputs
  const mapPath = path.join(PROJECT_ROOT, STORY_CODE_MAP_PATH);
  fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
  console.log(`\nWritten: ${STORY_CODE_MAP_PATH}`);

  const gapPath = path.join(PROJECT_ROOT, GAP_REPORT_PATH);
  fs.writeFileSync(gapPath, gapReport);
  console.log(`Written: ${GAP_REPORT_PATH}`);

  const orphanPath = path.join(PROJECT_ROOT, ORPHAN_REPORT_PATH);
  fs.writeFileSync(orphanPath, orphanReport);
  console.log(`Written: ${ORPHAN_REPORT_PATH}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total Stories: ${map.metadata.story_count}`);
  console.log(`Annotated Files: ${map.metadata.annotated_file_count}`);

  const implemented = Object.values(map.stories).filter(
    (s) => s.implementation_status === 'complete'
  ).length;
  const partial = Object.values(map.stories).filter(
    (s) => s.implementation_status === 'partial'
  ).length;
  const gaps = Object.values(map.stories).filter(
    (s) => s.implementation_status === 'gap'
  ).length;

  console.log(`Complete: ${implemented}`);
  console.log(`Partial: ${partial}`);
  console.log(`Gaps: ${gaps}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

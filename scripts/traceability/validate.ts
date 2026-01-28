#!/usr/bin/env tsx
/**
 * Story-Code Traceability Validator
 *
 * Validates:
 * 1. Story IDs in annotations exist in story definitions
 * 2. Override file doesn't contain forbidden fields
 * 3. Story-code-map is up to date
 *
 * Usage:
 *   pnpm traceability:validate     # Run all validations
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
  JOURNEY_TEST_MATRIX_PATH,
  FEATURE_INVENTORY_PATH,
  ANNOTATION_PATTERN,
  STORY_ID_PATTERN,
  STORY_CODE_MAP_PATH,
  OVERRIDES_PATH,
  OVERRIDE_ALLOWED_FIELDS,
  OVERRIDE_FORBIDDEN_FIELDS,
} from './config';
import type { ValidationResult, ValidationIssue } from './schema';

// =============================================================================
// Validators
// =============================================================================

/**
 * Parse story IDs from markdown files
 */
function getValidStoryIds(): Set<string> {
  const storyIds = new Set<string>();

  for (const relativePath of STORY_SOURCES) {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const storyPattern = /^###\s+(US-[A-Z]{1,3}\d{1,2}):/gm;
    let match;

    while ((match = storyPattern.exec(content)) !== null) {
      if (STORY_ID_PATTERN.test(match[1])) {
        storyIds.add(match[1]);
      }
    }
  }

  return storyIds;
}

/**
 * Find all files in scan directories
 */
function findFiles(dir: string): string[] {
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

      if (entry.isDirectory()) {
        if (EXCLUDE_DIRS.some((ex) => entry.name === ex || relativePath.includes(ex))) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        if (SCAN_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
          files.push(relativePath);
        }
      }
    }
  }

  walk(fullDir);
  return files;
}

function warnMissingScanDirs(): void {
  const missing: string[] = [];
  for (const dir of SCAN_DIRS) {
    const fullPath = path.join(PROJECT_ROOT, dir);
    if (!fs.existsSync(fullPath)) {
      missing.push(dir);
    }
  }
  if (missing.length > 0) {
    console.warn('\nWarning: Scan directories not found (skipped):');
    for (const dir of missing) {
      console.warn(`  - ${dir}`);
    }
  }
}

/**
 * Validate annotations in source files
 */
function validateAnnotations(validStoryIds: Set<string>): {
  issues: ValidationIssue[];
  annotatedFiles: Set<string>;
  annotatedStoryIds: Set<string>;
  unknownStoryIds: Set<string>;
  latestAnnotatedMtime: number;
} {
  const issues: ValidationIssue[] = [];
  const annotatedFiles = new Set<string>();
  const annotatedStoryIds = new Set<string>();
  const unknownStoryIds = new Set<string>();
  let latestAnnotatedMtime = 0;

  const pattern = new RegExp(ANNOTATION_PATTERN.source, 'g');

  for (const dir of SCAN_DIRS) {
    const files = findFiles(dir);

    for (const file of files) {
      const fullPath = path.join(PROJECT_ROOT, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      let hasAnnotation = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        pattern.lastIndex = 0;

        let match;
        while ((match = pattern.exec(line)) !== null) {
          hasAnnotation = true;
          const storyIds = match[1].split(/\s*,\s*/).map((id) => id.trim());

          for (const storyId of storyIds) {
            if (!STORY_ID_PATTERN.test(storyId)) {
              issues.push({
                type: 'error',
                message: `Invalid story ID format: ${storyId}`,
                file,
                line: i + 1,
                story_id: storyId,
              });
            } else if (!validStoryIds.has(storyId)) {
              unknownStoryIds.add(storyId);
              issues.push({
                type: 'warning',
                message: `Unknown story ID: ${storyId} (not found in story definitions)`,
                file,
                line: i + 1,
                story_id: storyId,
              });
            } else {
              annotatedStoryIds.add(storyId);
            }
          }
        }
      }

      if (hasAnnotation) {
        annotatedFiles.add(file);
        const stats = fs.statSync(fullPath);
        if (stats.mtimeMs > latestAnnotatedMtime) {
          latestAnnotatedMtime = stats.mtimeMs;
        }
      }
    }
  }

  return { issues, annotatedFiles, annotatedStoryIds, unknownStoryIds, latestAnnotatedMtime };
}

/**
 * Validate overrides file
 */
function validateOverrides(validStoryIds: Set<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const fullPath = path.join(PROJECT_ROOT, OVERRIDES_PATH);

  if (!fs.existsSync(fullPath)) {
    issues.push({
      type: 'warning',
      message: `Overrides file not found: ${OVERRIDES_PATH}`,
    });
    return issues;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  let data: Record<string, Record<string, unknown>>;

  try {
    data = yaml.load(content) as Record<string, Record<string, unknown>>;
  } catch (e) {
    issues.push({
      type: 'error',
      message: `Invalid YAML in overrides file: ${e}`,
      file: OVERRIDES_PATH,
    });
    return issues;
  }

  if (!data || typeof data !== 'object') {
    return issues;
  }

  for (const [storyId, override] of Object.entries(data)) {
    // Validate story ID exists
    if (!validStoryIds.has(storyId)) {
      issues.push({
        type: 'warning',
        message: `Override for unknown story ID: ${storyId}`,
        file: OVERRIDES_PATH,
        story_id: storyId,
      });
    }

    if (typeof override !== 'object' || override === null) {
      continue;
    }

    const keys = Object.keys(override);

    // Check for forbidden fields
    for (const field of OVERRIDE_FORBIDDEN_FIELDS) {
      if (field in override) {
        issues.push({
          type: 'error',
          message: `Override for ${storyId} contains forbidden field '${field}' - must come from code annotations`,
          file: OVERRIDES_PATH,
          story_id: storyId,
        });
      }
    }

    // Check for unknown fields
    const unknown = keys.filter(
      (field) => !OVERRIDE_ALLOWED_FIELDS.includes(field as (typeof OVERRIDE_ALLOWED_FIELDS)[number])
    );
    if (unknown.length > 0) {
      issues.push({
        type: 'warning',
        message: `Override for ${storyId} contains unknown field(s): ${unknown.join(', ')} - ignored`,
        file: OVERRIDES_PATH,
        story_id: storyId,
      });
    }
  }

  return issues;
}

/**
 * Check if story-code-map exists and is recent
 */
function validateMapFreshness(latestInputMtime: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const fullPath = path.join(PROJECT_ROOT, STORY_CODE_MAP_PATH);

  if (!fs.existsSync(fullPath)) {
    issues.push({
      type: 'warning',
      message: `Story-code-map not found. Run: pnpm traceability:generate`,
    });
    return issues;
  }

  const stats = fs.statSync(fullPath);
  if (stats.mtimeMs < latestInputMtime) {
    issues.push({
      type: 'warning',
      message: `Story-code-map is older than its inputs. Consider regenerating.`,
    });
  }

  return issues;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Story-Code Traceability Validator');
  console.log('='.repeat(60));
  console.log('');

  // Get valid story IDs
  console.log('Loading story definitions...');
  const validStoryIds = getValidStoryIds();
  console.log(`  Found ${validStoryIds.size} valid story IDs`);
  console.log('');

  // Run validations
  const issues: ValidationIssue[] = [];

  console.log('Validating annotations...');
  warnMissingScanDirs();
  const annotationResult = validateAnnotations(validStoryIds);
  const annotationIssues = annotationResult.issues;
  issues.push(...annotationIssues);
  console.log(`  Found ${annotationIssues.length} issues`);

  console.log('Validating overrides...');
  const overrideIssues = validateOverrides(validStoryIds);
  issues.push(...overrideIssues);
  console.log(`  Found ${overrideIssues.length} issues`);

  console.log('Checking map freshness...');
  const inputFiles = [
    ...STORY_SOURCES,
    JOURNEY_TEST_MATRIX_PATH,
    FEATURE_INVENTORY_PATH,
    OVERRIDES_PATH,
  ]
    .map((p) => path.join(PROJECT_ROOT, p))
    .filter((p) => fs.existsSync(p));

  let latestInputMtime = 0;
  for (const file of inputFiles) {
    const stats = fs.statSync(file);
    if (stats.mtimeMs > latestInputMtime) {
      latestInputMtime = stats.mtimeMs;
    }
  }
  if (annotationResult.latestAnnotatedMtime > latestInputMtime) {
    latestInputMtime = annotationResult.latestAnnotatedMtime;
  }

  const freshnessIssues = validateMapFreshness(latestInputMtime);
  issues.push(...freshnessIssues);
  console.log(`  Found ${freshnessIssues.length} issues`);

  // Compute stats
  console.log('Computing statistics...');
  const stats: ValidationResult['stats'] = {
    stories_with_annotations: annotationResult.annotatedStoryIds.size,
    stories_without_annotations: validStoryIds.size - annotationResult.annotatedStoryIds.size,
    files_with_annotations: annotationResult.annotatedFiles.size,
    unknown_story_ids: annotationResult.unknownStoryIds.size,
  };

  // Build result
  const errors = issues.filter((i) => i.type === 'error');
  const warnings = issues.filter((i) => i.type === 'warning');

  const result: ValidationResult = {
    valid: errors.length === 0,
    issues,
    stats,
  };

  // Output results
  console.log('\n' + '='.repeat(60));
  console.log('Results');
  console.log('='.repeat(60));

  if (errors.length > 0) {
    console.log('\nErrors:');
    for (const issue of errors) {
      const location = issue.file ? ` (${issue.file}:${issue.line || '?'})` : '';
      console.log(`  ❌ ${issue.message}${location}`);
    }
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    for (const issue of warnings) {
      const location = issue.file ? ` (${issue.file}:${issue.line || '?'})` : '';
      console.log(`  ⚠️  ${issue.message}${location}`);
    }
  }

  console.log('\nStatistics:');
  console.log(`  Stories with annotations: ${stats.stories_with_annotations}/${validStoryIds.size}`);
  console.log(`  Stories without annotations: ${stats.stories_without_annotations}`);
  console.log(`  Files with annotations: ${stats.files_with_annotations}`);
  console.log(`  Unknown story IDs found: ${stats.unknown_story_ids}`);

  console.log('\n' + '='.repeat(60));
  if (result.valid) {
    console.log('✅ Validation passed');
  } else {
    console.log('❌ Validation failed');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

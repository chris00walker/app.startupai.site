/**
 * Story-Code Traceability System - Core Helpers
 *
 * Pure functions for parsing and merging traceability inputs.
 */

import { ANNOTATION_PATTERN, OVERRIDE_ALLOWED_FIELDS, OVERRIDE_FORBIDDEN_FIELDS, classifyFileType } from './config';
import type {
  E2ETestReference,
  ImplementationStatus,
  ParsedAnnotation,
  StoryEntry,
  StoryOverride,
  StoryOverrides,
} from './schema';

const STORY_ID_EXTRACT_PATTERN = /\bUS-[A-Z]{1,3}\d{1,2}\b/g;
const TEST_FILE_PATTERN = /([A-Za-z0-9._-]+\.spec\.ts)/g;
const FEATURE_FILE_PATTERN = /(frontend|backend)\/[^\s,)]+\.tsx?/g;

export function extractStoryIds(value: string): string[] {
  const ids = new Set<string>();
  const matches = value.match(STORY_ID_EXTRACT_PATTERN);
  if (!matches) {
    return [];
  }
  for (const id of matches) {
    ids.add(id);
  }
  return Array.from(ids);
}

export function parseAnnotationsFromContent(content: string, filePath: string): ParsedAnnotation[] {
  const annotations: ParsedAnnotation[] = [];
  const lines = content.split('\n');
  const pattern = new RegExp(ANNOTATION_PATTERN.source, 'g');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(line)) !== null) {
      const ids = match[1]
        .split(/\s*,\s*/)
        .map((id) => id.trim())
        .filter(Boolean);

      annotations.push({
        file: filePath,
        line: i + 1,
        story_ids: ids,
        file_type: classifyFileType(filePath),
      });
    }
  }

  return annotations;
}

function clearEntryType(entry: StoryEntry, fileType: ParsedAnnotation['file_type']) {
  switch (fileType) {
    case 'component':
      entry.components = [];
      break;
    case 'api_route':
      entry.api_routes = [];
      break;
    case 'page':
      entry.pages = [];
      break;
    case 'hook':
      entry.hooks = [];
      break;
    case 'lib':
      entry.lib = [];
      break;
    case 'e2e_test':
      entry.e2e_tests = [];
      break;
    case 'unit_test':
      entry.unit_tests = [];
      break;
  }
}

export function applyAnnotationsToStories(
  stories: Record<string, StoryEntry>,
  annotations: ParsedAnnotation[],
  validStoryIds: Set<string>
): { unknownStoryIds: Set<string>; annotatedFiles: Set<string> } {
  const unknownStoryIds = new Set<string>();
  const annotatedFiles = new Set<string>();
  const clearedTypes: Record<string, Set<ParsedAnnotation['file_type']>> = {};

  for (const annotation of annotations) {
    annotatedFiles.add(annotation.file);

    for (const storyId of annotation.story_ids) {
      if (!validStoryIds.has(storyId)) {
        unknownStoryIds.add(storyId);
        continue;
      }

      const entry = stories[storyId];
      if (!entry) {
        continue;
      }

      if (!clearedTypes[storyId]) {
        clearedTypes[storyId] = new Set();
      }

      if (!clearedTypes[storyId].has(annotation.file_type)) {
        clearEntryType(entry, annotation.file_type);
        clearedTypes[storyId].add(annotation.file_type);
      }

      switch (annotation.file_type) {
        case 'component':
          if (!entry.components.includes(annotation.file)) {
            entry.components.push(annotation.file);
          }
          break;
        case 'api_route':
          if (!entry.api_routes.includes(annotation.file)) {
            entry.api_routes.push(annotation.file);
          }
          break;
        case 'page':
          if (!entry.pages.includes(annotation.file)) {
            entry.pages.push(annotation.file);
          }
          break;
        case 'hook':
          if (!entry.hooks.includes(annotation.file)) {
            entry.hooks.push(annotation.file);
          }
          break;
        case 'lib':
          if (!entry.lib.includes(annotation.file)) {
            entry.lib.push(annotation.file);
          }
          break;
        case 'e2e_test': {
          const fileName = annotation.file.split('/').pop() || annotation.file;
          const testRef: E2ETestReference = { file: fileName };
          if (!entry.e2e_tests.some((t) => t.file === testRef.file)) {
            entry.e2e_tests.push(testRef);
          }
          break;
        }
        case 'unit_test':
          if (!entry.unit_tests.includes(annotation.file)) {
            entry.unit_tests.push(annotation.file);
          }
          break;
      }
    }
  }

  return { unknownStoryIds, annotatedFiles };
}

function parseMarkdownRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isSeparatorRow(line: string): boolean {
  return /^\|?[\s:-]+\|?$/.test(line.trim());
}

export function parseJourneyTestMatrixContent(content: string): Record<string, E2ETestReference[]> {
  const results: Record<string, E2ETestReference[]> = {};
  const lines = content.split('\n');

  let storyIdx = -1;
  let testIdx = -1;
  let descIdx = -1;
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) {
      inTable = false;
      continue;
    }

    const cells = parseMarkdownRow(line);
    if (cells.length === 0 || isSeparatorRow(line)) {
      continue;
    }

    if (cells.includes('User Story') && cells.includes('E2E Test File')) {
      storyIdx = cells.indexOf('User Story');
      testIdx = cells.indexOf('E2E Test File');
      descIdx = cells.indexOf('Test Description');
      inTable = true;
      continue;
    }

    if (!inTable || storyIdx < 0 || testIdx < 0) {
      continue;
    }

    const storyCell = cells[storyIdx] || '';
    const testCell = cells[testIdx] || '';
    const descCell = descIdx >= 0 ? cells[descIdx] || '' : '';

    const storyIds = extractStoryIds(storyCell);
    if (storyIds.length === 0) {
      continue;
    }

    const testMatches = testCell.match(TEST_FILE_PATTERN) || [];
    if (testMatches.length === 0) {
      continue;
    }

    const testName = descCell.replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '').trim();

    for (const storyId of storyIds) {
      if (!results[storyId]) {
        results[storyId] = [];
      }
      for (const testFile of testMatches) {
        const fileName = testFile.split('/').pop() || testFile;
        const testRef: E2ETestReference = testName ? { file: fileName, test_name: testName } : { file: fileName };
        const exists = results[storyId].some(
          (ref) => ref.file === testRef.file && ref.test_name === testRef.test_name
        );
        if (!exists) {
          results[storyId].push(testRef);
        }
      }
    }
  }

  return results;
}

export function parseFeatureInventoryContent(content: string): Record<string, string[]> {
  const results: Record<string, string[]> = {};
  const lines = content.split('\n');
  let currentStoryIds: string[] = [];
  let currentSectionFiles: string[] = [];

  const flushSection = () => {
    if (currentStoryIds.length === 0 || currentSectionFiles.length === 0) {
      return;
    }
    for (const storyId of currentStoryIds) {
      if (!results[storyId]) {
        results[storyId] = [];
      }
      for (const filePath of currentSectionFiles) {
        if (!results[storyId].includes(filePath)) {
          results[storyId].push(filePath);
        }
      }
    }
  };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flushSection();
      currentStoryIds = [];
      currentSectionFiles = [];
      continue;
    }

    const storyMatch = line.match(/^User Stories:\s*(.+)$/);
    if (storyMatch) {
      currentStoryIds = extractStoryIds(storyMatch[1]);
      continue;
    }

    const fileMatches = line.match(FEATURE_FILE_PATTERN) || [];
    if (fileMatches.length === 0) {
      continue;
    }

    for (const filePath of fileMatches) {
      if (!currentSectionFiles.includes(filePath)) {
        currentSectionFiles.push(filePath);
      }
    }
  }

  flushSection();

  return results;
}

export function validateOverridesData(
  data: Record<string, Record<string, unknown>> | null | undefined
): { overrides: StoryOverrides; warnings: string[]; rejected: string[] } {
  const overrides: StoryOverrides = {};
  const warnings: string[] = [];
  const rejected: string[] = [];

  if (!data || typeof data !== 'object') {
    return { overrides, warnings, rejected };
  }

  for (const [storyId, override] of Object.entries(data)) {
    if (!override || typeof override !== 'object') {
      continue;
    }

    const hasForbidden = OVERRIDE_FORBIDDEN_FIELDS.some((field) => field in override);
    if (hasForbidden) {
      for (const field of OVERRIDE_FORBIDDEN_FIELDS) {
        if (field in override) {
          warnings.push(
            `Override for ${storyId} contains forbidden field '${field}' - must come from code annotations`
          );
        }
      }
      rejected.push(storyId);
      continue;
    }

    const entry: StoryOverride = {};
    for (const field of OVERRIDE_ALLOWED_FIELDS) {
      if (field in override) {
        (entry as Record<string, unknown>)[field] = (override as Record<string, unknown>)[field];
      }
    }

    overrides[storyId] = entry as {
      db_tables?: string[];
      notes?: string;
      implementation_status?: ImplementationStatus;
    };
  }

  return { overrides, warnings, rejected };
}

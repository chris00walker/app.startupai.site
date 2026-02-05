/**
 * Narrative Edit Service
 *
 * Edit application with dot-notation field resolution,
 * edit history tracking, and edit merge for regeneration.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :4470-4511
 */

import type {
  PitchNarrativeContent,
  EditHistoryEntry,
  SlideKey,
} from './types';

/**
 * Apply a dot-notation field edit to narrative data.
 * e.g., "traction.evidence_summary" → navigate to traction.evidence_summary
 */
export function applyEdit(
  narrativeData: PitchNarrativeContent,
  field: string,
  newValue: unknown
): { updated: PitchNarrativeContent; oldValue: unknown; slide: SlideKey; fieldPath: string } {
  const parts = field.split('.');
  const slide = parts[0] as SlideKey;
  const fieldPath = parts.slice(1).join('.');

  // Deep clone to avoid mutation
  const updated = JSON.parse(JSON.stringify(narrativeData)) as PitchNarrativeContent;

  // Navigate to parent and set value
  let current: Record<string, unknown> = updated as unknown as Record<string, unknown>;
  const path = parts.slice(0, -1);
  const lastKey = parts[parts.length - 1];

  for (const key of path) {
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const oldValue = current[lastKey];
  current[lastKey] = newValue;

  return { updated, oldValue, slide, fieldPath };
}

/**
 * Build an EditHistoryEntry from an edit operation.
 */
export function buildEditEntry(
  slide: SlideKey,
  field: string,
  oldValue: unknown,
  newValue: unknown,
  editSource: 'founder' | 'regeneration' = 'founder'
): EditHistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    slide,
    field,
    old_value: oldValue,
    new_value: newValue,
    edit_source: editSource,
  };
}

/**
 * Get the set of slides that have been edited by the founder.
 * Filters edit_history by edit_source === 'founder'.
 */
export function getFounderEditedSlides(editHistory: EditHistoryEntry[]): Set<SlideKey> {
  const edited = new Set<SlideKey>();
  for (const entry of editHistory) {
    if (entry.edit_source === 'founder') {
      edited.add(entry.slide);
    }
  }
  return edited;
}

/**
 * Get the most recent founder edits for a specific slide.
 * Returns a map of field -> latest value.
 */
export function getSlideEdits(
  editHistory: EditHistoryEntry[],
  slide: SlideKey
): Map<string, unknown> {
  const edits = new Map<string, unknown>();
  // Process in chronological order so later edits overwrite earlier ones
  const slideEdits = editHistory
    .filter((e) => e.slide === slide && e.edit_source === 'founder')
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  for (const entry of slideEdits) {
    edits.set(entry.field, entry.new_value);
  }
  return edits;
}

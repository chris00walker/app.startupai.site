import { applyAnnotationsToStories } from '../core';
import type { ParsedAnnotation, StoryEntry } from '../schema';

describe('applyAnnotationsToStories', () => {
  test('overwrites baseline entries for annotated file types', () => {
    const stories: Record<string, StoryEntry> = {
      'US-F01': {
        title: 'Quick Start',
        components: ['frontend/src/components/onboarding/Baseline.tsx'],
        api_routes: [],
        pages: [],
        hooks: [],
        lib: [],
        e2e_tests: [{ file: '16-quick-start-founder.spec.ts' }],
        unit_tests: [],
        db_tables: [],
        implementation_status: 'gap',
      },
    };

    const annotations: ParsedAnnotation[] = [
      {
        file: 'frontend/src/components/onboarding/QuickStartForm.tsx',
        line: 10,
        story_ids: ['US-F01'],
        file_type: 'component',
      },
    ];

    const result = applyAnnotationsToStories(stories, annotations, new Set(['US-F01']));
    expect(result.unknownStoryIds.size).toBe(0);
    expect(stories['US-F01'].components).toEqual([
      'frontend/src/components/onboarding/QuickStartForm.tsx',
    ]);
    expect(stories['US-F01'].e2e_tests).toHaveLength(1);
  });
});

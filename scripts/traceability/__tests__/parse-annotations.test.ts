import { parseAnnotationsFromContent } from '../core';

describe('parseAnnotationsFromContent', () => {
  test('parses multiple @story tags with correct file type', () => {
    const content = [
      '/**',
      ' * @story US-F01, US-FT01',
      ' */',
      'export function QuickStartForm() {}',
      '// @story US-H01',
    ].join('\n');

    const annotations = parseAnnotationsFromContent(
      content,
      'frontend/src/components/onboarding/QuickStartForm.tsx'
    );

    expect(annotations).toHaveLength(2);
    expect(annotations[0].story_ids).toEqual(['US-F01', 'US-FT01']);
    expect(annotations[0].file_type).toBe('component');
    expect(annotations[1].story_ids).toEqual(['US-H01']);
  });
});

import { validateOverridesData } from '../core';

describe('validateOverridesData', () => {
  test('rejects overrides containing forbidden fields', () => {
    const data = {
      'US-F01': {
        db_tables: ['projects'],
        components: ['frontend/src/components/Bad.tsx'],
      },
      'US-F02': {
        notes: 'ok',
      },
    };

    const { overrides, warnings, rejected } = validateOverridesData(data);
    expect(Object.keys(overrides)).toHaveLength(1);
    expect(overrides['US-F02']).toBeTruthy();
    expect(rejected).toContain('US-F01');
    expect(warnings.length).toBeTruthy();
  });
});

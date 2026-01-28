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

  test('warns on unknown fields and ignores them', () => {
    const data = {
      'US-F03': {
        db_tables: ['projects'],
        migrations: ['supabase/migrations/001.sql'],
      },
    };

    const { overrides, warnings, rejected } = validateOverridesData(data);
    expect(Object.keys(overrides)).toHaveLength(1);
    expect(overrides['US-F03']).toBeTruthy();
    expect(rejected).toHaveLength(0);
    expect(warnings.length).toBeTruthy();
  });

  test('allows domain_candidate and domain_function fields', () => {
    const data = {
      'US-AD09': {
        db_tables: ['validation_runs'],
        domain_candidate: true,
        domain_function: 'calculate_fit_score',
      },
    };

    const { overrides, warnings, rejected } = validateOverridesData(data);
    expect(Object.keys(overrides)).toHaveLength(1);
    expect(overrides['US-AD09']).toBeTruthy();
    expect(overrides['US-AD09'].domain_candidate).toBe(true);
    expect(overrides['US-AD09'].domain_function).toBe('calculate_fit_score');
    expect(rejected).toHaveLength(0);
    expect(warnings).toHaveLength(0);
  });
});

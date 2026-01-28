/**
 * Warning-only ESLint configuration (flat config, ESLint 9)
 *
 * Wraps the base Next.js config and downgrades all rule severities to "warn".
 * Used for Stage 1/2 so linting surfaces issues without blocking CI.
 */

import baseConfig from './eslint.config.base.mjs';

const toWarn = (value) => {
  if (value === 0 || value === 'off') return value;
  if (Array.isArray(value)) {
    return ['warn', ...value.slice(1)];
  }
  return 'warn';
};

const warnify = (config) => {
  if (!config || typeof config !== 'object') return config;
  const rules = config.rules || {};
  const warnedRules = Object.fromEntries(
    Object.entries(rules).map(([name, value]) => [name, toWarn(value)])
  );
  return {
    ...config,
    rules: warnedRules,
  };
};

export default baseConfig.map(warnify);

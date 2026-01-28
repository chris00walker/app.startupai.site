/**
 * Base ESLint configuration (flat config, ESLint 9)
 *
 * Uses Next.js core web vitals rules as the strict baseline.
 * This file is intended for Stage 3 enforcement.
 */

import coreWebVitals from 'eslint-config-next/core-web-vitals';

const configArray = Array.isArray(coreWebVitals) ? coreWebVitals : [coreWebVitals];

export default configArray;

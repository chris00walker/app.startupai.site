/**
 * Database Seed Script
 *
 * Seeding is intentionally disabled to avoid synthetic data in the platform.
 * Use Supabase Studio or real onboarding flows to generate data.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function run() {
  console.log('Seeding disabled: no synthetic data will be created.');
  console.log('Use real onboarding flows or Supabase Studio to create data.');
}

run().catch((error) => {
  console.error('Seed script failed:', error);
  process.exit(1);
});

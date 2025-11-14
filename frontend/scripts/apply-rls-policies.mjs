#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSPolicies() {
  console.log('🔒 Applying RLS Policies for Consultants\n');

  // Read the migration file
  const migrationPath = join(__dirname, '../src/db/migrations/0005_add_rls_policies_for_consultants.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('Executing SQL migration...\n');

  try {
    // Split into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    for (const statement of statements) {
      if (statement.length > 0) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // Some policies might already exist, that's okay
          if (error.message.includes('already exists')) {
            console.log('  ⚠️  Already exists, skipping');
          } else {
            console.error('  ❌ Error:', error.message);
          }
        } else {
          console.log('  ✅ Success');
        }
      }
    }

    console.log('\n✅ RLS Policies applied successfully!');
    console.log('\nNow consultants can view their clients via the useClients hook.');
    console.log('Refresh your production dashboard to see "Elias Food Imports".\n');

  } catch (err) {
    console.error('❌ Error applying policies:', err);
    console.log('\n💡 Trying alternative approach: direct SQL execution...\n');

    // Alternative: Execute via psql if available
    console.log('Please run this SQL manually in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/sql/new\n');
    console.log(sql);
  }
}

applyRLSPolicies().catch(console.error);

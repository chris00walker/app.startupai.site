#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔒 Fixing RLS Policies\n');

const sqls = [
  `ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Users can view own profile" ON "user_profiles"`,
  `DROP POLICY IF EXISTS "Consultants can view their clients" ON "user_profiles"`,
  `DROP POLICY IF EXISTS "Users can update own profile" ON "user_profiles"`,
  `DROP POLICY IF EXISTS "Admins can view all profiles" ON "user_profiles"`,
  `CREATE POLICY "Users can view own profile" ON "user_profiles" FOR SELECT USING (auth.uid() = id)`,
  `CREATE POLICY "Consultants can view their clients" ON "user_profiles" FOR SELECT USING (consultant_id = auth.uid())`,
  `CREATE POLICY "Users can update own profile" ON "user_profiles" FOR UPDATE USING (auth.uid() = id)`,
  `CREATE POLICY "Admins can view all profiles" ON "user_profiles" FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))`
];

async function executeSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    // Use postgres endpoint instead
    const response2 = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/sql',
        'Prefer': 'return=minimal'
      },
      body: sql
    });

    return { ok: response2.ok, status: response2.status };
  }

  return { ok: true };
}

console.log('⚠️  This script cannot execute SQL directly.');
console.log('\n📋 Please execute this SQL in Supabase SQL Editor:');
console.log('🔗 https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/sql/new\n');
console.log('='.repeat(80));
sqls.forEach(sql => console.log(sql + ';'));
console.log('='.repeat(80));
console.log('\n✅ After running this SQL, refresh your dashboard!');
console.log('   You should see "Elias Food Imports" instead of demo data.\n');

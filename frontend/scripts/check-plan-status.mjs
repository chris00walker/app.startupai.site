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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPlanStatus() {
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const chrisUser = authUsers.users.find(u => u.email === 'chris00walker@gmail.com');

  if (!chrisUser) {
    console.log('User not found');
    return;
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, email, role, plan_status, subscription_status')
    .eq('id', chrisUser.id)
    .single();

  console.log('Current profile:');
  console.log(JSON.stringify(profile, null, 2));

  console.log('\n📋 Plan Status Analysis:');
  console.log(`plan_status: ${profile?.plan_status ?? 'NULL'}`);
  console.log(`subscription_status: ${profile?.subscription_status ?? 'NULL'}`);
  console.log(`\nResult: isTrialReadonly = ${!profile?.plan_status && !profile?.subscription_status ? 'TRUE ❌' : 'FALSE ✅'}`);

  if (!profile?.plan_status && !profile?.subscription_status) {
    console.log('\n🔧 FIX: Need to set plan_status to "active" for consultant');
  }
}

checkPlanStatus().catch(console.error);

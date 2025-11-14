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

async function fixFounderAccount() {
  console.log('🔧 Fixing founder account...\n');

  // Find chris00walker@proton.me
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const founderUser = authUsers.users.find(u => u.email === 'chris00walker@proton.me');

  if (!founderUser) {
    console.log('❌ Founder user not found');
    return;
  }

  console.log(`✅ Found user: ${founderUser.email}`);
  console.log(`   User ID: ${founderUser.id}\n`);

  // Check current profile
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', founderUser.id)
    .single();

  console.log('📋 Current profile:');
  console.log(`   Role: ${currentProfile?.role}`);
  console.log(`   Plan Status: ${currentProfile?.plan_status ?? 'null'}`);
  console.log(`   Subscription Status: ${currentProfile?.subscription_status ?? 'null'}`);
  console.log(`   Company: ${currentProfile?.company || 'none'}`);
  console.log('');

  // Update plan_status to active
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      plan_status: 'active',
      subscription_status: 'active',
      role: 'founder', // Ensure role is set
    })
    .eq('id', founderUser.id);

  if (updateError) {
    console.error('❌ Error updating profile:', updateError);
    return;
  }

  console.log('✅ Updated profile:');
  console.log('   plan_status: trialing → active');
  console.log('   subscription_status: trial → active');
  console.log('   role: founder (confirmed)');
  console.log('');

  console.log('✨ Fix complete! Refresh your browser to see changes.');
  console.log('   The "Trial mode" banner should now be gone.\n');
}

fixFounderAccount().catch(console.error);

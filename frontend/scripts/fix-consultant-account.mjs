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

async function fixConsultantAccount() {
  console.log('🔧 Fixing consultant account...\n');

  // Find chris00walker
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const chrisUser = authUsers.users.find(u => u.email === 'chris00walker@gmail.com');

  if (!chrisUser) {
    console.log('❌ User not found');
    return;
  }

  console.log(`✅ Found user: ${chrisUser.email}`);
  console.log(`   User ID: ${chrisUser.id}\n`);

  // Check current profile
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', chrisUser.id)
    .single();

  console.log('📋 Current profile:');
  console.log(`   Role: ${currentProfile?.role}`);
  console.log(`   Plan Status: ${currentProfile?.plan_status ?? 'null'}`);
  console.log(`   Subscription Status: ${currentProfile?.subscription_status ?? 'null'}`);
  console.log(`   Company: ${currentProfile?.company}`);
  console.log('');

  // Update plan_status to active
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      plan_status: 'active',
      subscription_status: 'active',
      role: 'consultant', // Ensure role is set
    })
    .eq('id', chrisUser.id);

  if (updateError) {
    console.error('❌ Error updating profile:', updateError);
    return;
  }

  console.log('✅ Updated profile:');
  console.log('   plan_status: trialing → active');
  console.log('   subscription_status: trial → active');
  console.log('   role: consultant (confirmed)');
  console.log('');

  // Verify clients
  const { data: clients } = await supabase
    .from('user_profiles')
    .select('id, email, company, full_name')
    .eq('consultant_id', chrisUser.id);

  console.log(`✅ Verified ${clients?.length || 0} client(s):`);
  clients?.forEach(client => {
    console.log(`   - ${client.company || client.full_name || client.email}`);
  });

  console.log('\n✨ Fix complete! Refresh your browser to see changes.');
}

fixConsultantAccount().catch(console.error);

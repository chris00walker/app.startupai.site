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

async function checkProductionAuth() {
  console.log('🔍 Checking Production Authentication Issues\n');
  console.log(`Database: ${supabaseUrl}\n`);

  // Find all chris walker accounts
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const chrisUsers = authUsers.users.filter(u =>
    u.email?.includes('chris') && u.email?.includes('walker')
  );

  console.log(`Found ${chrisUsers.length} chris*walker auth accounts:\n`);

  for (const authUser of chrisUsers) {
    console.log(`📧 ${authUser.email}`);
    console.log(`   Auth User ID: ${authUser.id}`);
    console.log(`   Created: ${authUser.created_at}`);
    console.log(`   Last Sign In: ${authUser.last_sign_in_at || 'Never'}`);

    // Check profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profile) {
      console.log(`   Profile:`);
      console.log(`     Company: ${profile.company || 'none'}`);
      console.log(`     Role: ${profile.role}`);
      console.log(`     Plan Status: ${profile.plan_status || 'null'}`);
      console.log(`     Subscription: ${profile.subscription_status || 'null'}`);
    } else {
      console.log(`   ❌ No user_profile found!`);
    }

    // Check for clients
    const { data: clients } = await supabase
      .from('user_profiles')
      .select('id, email, company, full_name')
      .eq('consultant_id', authUser.id);

    console.log(`   Clients: ${clients?.length || 0}`);
    if (clients && clients.length > 0) {
      clients.forEach(c => {
        console.log(`     ✅ ${c.company || c.full_name || c.email}`);
      });
    }
    console.log('');
  }

  // Check if there's a session issue
  console.log('💡 DIAGNOSIS:');
  console.log('If you see multiple chris*walker accounts, you might be logging');
  console.log('into the wrong one in production!');
  console.log('');
  console.log('The correct account should have:');
  console.log('  - email: chris00walker@gmail.com');
  console.log('  - role: consultant');
  console.log('  - plan_status: active');
  console.log('  - 1 client: Elias Food Imports');
}

checkProductionAuth().catch(console.error);

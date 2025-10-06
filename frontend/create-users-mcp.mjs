#!/usr/bin/env node

// Create test users using the correct service role key directly
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqxropalhxjeyvfcoyxg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeHJvcGFsaHhqZXl2ZmNveXhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE0OTk4MSwiZXhwIjoyMDc0NzI1OTgxfQ.AhCbVDcyGMdN1abKT1qYXO88oyZ7bbJ3br5AIT0ZppY';

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testUsers = [
  {
    email: 'founder@startupai.site',
    password: 'password123',
    role: 'founder',
    user_metadata: {
      full_name: 'Test Founder',
      role: 'founder'
    },
    app_metadata: {
      role: 'founder'
    }
  },
  {
    email: 'consultant@startupai.site',
    password: 'password123',
    role: 'consultant',
    user_metadata: {
      full_name: 'Test Consultant',
      role: 'consultant'
    },
    app_metadata: {
      role: 'consultant'
    }
  }
];

async function createUsersCorrectly() {
  console.log('🔧 Creating test users using Supabase Auth Admin API...\n');
  
  for (const testUser of testUsers) {
    try {
      console.log(`Creating ${testUser.email} (${testUser.role})...`);
      
      // Use the correct Admin API method
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true, // Skip email confirmation for test users
        user_metadata: testUser.user_metadata,
        app_metadata: testUser.app_metadata
      });
      
      if (authError) {
        console.log(`  ❌ Auth error: ${authError.message}`);
        continue;
      }
      
      console.log(`  ✅ Auth user created: ${authData.user.id}`);
      console.log(`  📧 Email confirmed: ${authData.user.email_confirmed_at ? 'Yes' : 'No'}`);
      
      // Now create the user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: testUser.email,
          full_name: testUser.user_metadata.full_name,
          company: testUser.role === 'founder' ? 'Test Company' : 'Consulting Firm',
          role: testUser.role,
          subscription_tier: testUser.role === 'founder' ? 'premium' : 'enterprise',
          subscription_status: 'active',
          plan_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (profileError) {
        console.log(`  ❌ Profile creation error: ${profileError.message}`);
      } else {
        console.log(`  ✅ Profile created with role: ${testUser.role}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error creating ${testUser.email}: ${error.message}`);
    }
    
    console.log(''); // Add spacing
  }
  
  // Verify the setup
  console.log('🔍 Verifying test user setup...\n');
  
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('email, role, plan_status, full_name')
    .in('email', testUsers.map(u => u.email));
    
  if (profileError) {
    console.log('❌ Could not verify profiles:', profileError.message);
  } else {
    console.log('✅ Test users in database:');
    console.table(profiles);
  }
  
  console.log('\n🎯 Test Credentials Created:');
  testUsers.forEach(user => {
    console.log(`- ${user.email} / ${user.password} (${user.role})`);
  });
  
  console.log('\n📝 Next Steps:');
  console.log('1. Test login flow: https://startupai-site.netlify.app/login');
  console.log('2. Use founder@startupai.site → should go to /founder-dashboard');
  console.log('3. Use consultant@startupai.site → should go to /dashboard');
}

createUsersCorrectly().catch(console.error);

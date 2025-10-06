#!/usr/bin/env node

// Script to create test users for authentication testing
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eqxropalhxjeyvfcoyxg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testUsers = [
  {
    email: 'founder@test.com',
    password: 'testpass123',
    role: 'founder',
    planStatus: 'active'
  },
  {
    email: 'consultant@test.com', 
    password: 'testpass123',
    role: 'consultant',
    planStatus: 'active'
  },
  {
    email: 'trial@test.com',
    password: 'testpass123', 
    role: 'trial',
    planStatus: 'trialing'
  }
];

async function createTestUsers() {
  console.log('🔧 Creating test users...\n');
  
  for (const testUser of testUsers) {
    try {
      console.log(`Creating ${testUser.email} (${testUser.role})...`);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          role: testUser.role
        },
        app_metadata: {
          role: testUser.role
        }
      });
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`  ⚠️  User already exists, updating profile...`);
          
          // Get existing user
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === testUser.email);
          
          if (existingUser) {
            // Update user profile
            const { error: profileError } = await supabase
              .from('user_profiles')
              .upsert({
                id: existingUser.id,
                email: testUser.email,
                role: testUser.role,
                plan_status: testUser.planStatus,
                subscription_status: testUser.planStatus,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (profileError) {
              console.error(`  ❌ Profile error:`, profileError);
            } else {
              console.log(`  ✅ Profile updated`);
            }
          }
        } else {
          console.error(`  ❌ Auth error:`, authError);
          continue;
        }
      } else {
        console.log(`  ✅ Auth user created: ${authData.user.id}`);
        
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: testUser.email,
            role: testUser.role,
            plan_status: testUser.planStatus,
            subscription_status: testUser.planStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (profileError) {
          console.error(`  ❌ Profile error:`, profileError);
        } else {
          console.log(`  ✅ Profile created`);
        }
      }
      
    } catch (error) {
      console.error(`  ❌ Error creating ${testUser.email}:`, error);
    }
  }
  
  console.log('\n🎯 Test users setup complete!');
  console.log('\nTest credentials:');
  testUsers.forEach(user => {
    console.log(`- ${user.email} / testpass123 (${user.role})`);
  });
}

createTestUsers();

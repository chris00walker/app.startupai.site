#!/usr/bin/env node

// Create test users using working anon key approach
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testUsers = [
  {
    email: 'founder@startupai.site',
    password: 'TestFounder123!',
    role: 'founder',
    planStatus: 'active',
    fullName: 'Test Founder',
    company: 'Founder Test Company'
  },
  {
    email: 'consultant@startupai.site', 
    password: 'TestConsultant123!',
    role: 'consultant',
    planStatus: 'active',
    fullName: 'Test Consultant',
    company: 'Consulting Test Firm'
  },
  {
    email: 'trial@startupai.site',
    password: 'TestTrial123!', 
    role: 'trial',
    planStatus: 'trialing',
    fullName: 'Test Trial User',
    company: 'Trial Test Company'
  }
];

async function createTestUsers() {
  console.log('🔧 Creating test users for authentication testing...\n');
  
  for (const testUser of testUsers) {
    try {
      console.log(`Creating ${testUser.email} (${testUser.role})...`);
      
      // Step 1: Create auth user via signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            full_name: testUser.fullName,
            company: testUser.company,
            role: testUser.role
          }
        }
      });
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`  ⚠️  User already exists: ${testUser.email}`);
          
          // Try to sign in to get user ID
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: testUser.password
          });
          
          if (signInError) {
            console.log(`  ❌ Could not sign in existing user: ${signInError.message}`);
            continue;
          }
          
          console.log(`  ✅ Signed in existing user: ${signInData.user.id}`);
          
          // Update their profile
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              id: signInData.user.id,
              email: testUser.email,
              full_name: testUser.fullName,
              company: testUser.company,
              role: testUser.role,
              plan_status: testUser.planStatus,
              subscription_status: testUser.planStatus,
              updated_at: new Date().toISOString()
            });
            
          if (profileError) {
            console.log(`  ❌ Profile update error: ${profileError.message}`);
          } else {
            console.log(`  ✅ Profile updated with role: ${testUser.role}`);
          }
          
          // Sign out
          await supabase.auth.signOut();
          
        } else {
          console.log(`  ❌ Auth error: ${authError.message}`);
          continue;
        }
      } else {
        console.log(`  ✅ Auth user created: ${authData.user.id}`);
        console.log(`  ⚠️  Email confirmation required: ${!authData.session}`);
        
        // For development, we'll create the profile anyway
        // In production, this would happen after email confirmation
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              email: testUser.email,
              full_name: testUser.fullName,
              company: testUser.company,
              role: testUser.role,
              plan_status: testUser.planStatus,
              subscription_status: testUser.planStatus,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (profileError) {
            console.log(`  ❌ Profile creation error: ${profileError.message}`);
            console.log(`  💡 This might be due to email confirmation requirement`);
          } else {
            console.log(`  ✅ Profile created with role: ${testUser.role}`);
          }
        }
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
  console.log('1. Test login flow: startupai-site.netlify.app/login');
  console.log('2. Use founder@startupai.site → should go to /founder-dashboard');
  console.log('3. Use consultant@startupai.site → should go to /dashboard');
  console.log('4. Check for double login prompts');
}

createTestUsers().catch(console.error);

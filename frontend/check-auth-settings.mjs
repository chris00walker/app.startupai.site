#!/usr/bin/env node

// Check current auth settings and user status
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Checking Authentication Settings and User Status...\n');

async function checkAuthSettings() {
  // Check if we can sign in with the test users (this will tell us if they're confirmed)
  const testUsers = [
    { email: 'founder@startupai.site', password: 'TestFounder123!', role: 'founder' },
    { email: 'consultant@startupai.site', password: 'TestConsultant123!', role: 'consultant' },
    { email: 'trial@startupai.site', password: 'TestTrial123!', role: 'trial' }
  ];
  
  for (const user of testUsers) {
    console.log(`Testing ${user.email}...`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          console.log(`  ❌ Email not confirmed - needs manual confirmation in Supabase dashboard`);
        } else if (error.message.includes('Invalid login credentials')) {
          console.log(`  ❌ User doesn't exist or wrong password`);
        } else {
          console.log(`  ❌ Sign in error: ${error.message}`);
        }
      } else {
        console.log(`  ✅ Sign in successful: ${data.user.id}`);
        console.log(`  📧 Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);
        
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, plan_status')
          .eq('id', data.user.id)
          .single();
          
        if (profileError) {
          console.log(`  ❌ No profile found: ${profileError.message}`);
          
          // Try to create profile now that user is signed in
          const { error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: user.email,
              full_name: `Test ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`,
              company: `${user.role} Test Company`,
              role: user.role,
              plan_status: user.role === 'trial' ? 'trialing' : 'active',
              subscription_status: user.role === 'trial' ? 'trialing' : 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (createError) {
            console.log(`  ❌ Profile creation failed: ${createError.message}`);
          } else {
            console.log(`  ✅ Profile created with role: ${user.role}`);
          }
        } else {
          console.log(`  ✅ Profile exists with role: ${profile.role}`);
        }
        
        // Sign out
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}`);
    }
    
    console.log(''); // Add spacing
  }
  
  // Final verification
  console.log('🔍 Final Profile Verification...\n');
  const { data: allProfiles, error: allError } = await supabase
    .from('user_profiles')
    .select('email, role, plan_status')
    .in('email', testUsers.map(u => u.email));
    
  if (allError) {
    console.log('❌ Could not fetch profiles:', allError.message);
  } else {
    console.log('✅ Current test user profiles:');
    console.table(allProfiles);
  }
}

checkAuthSettings().catch(console.error);

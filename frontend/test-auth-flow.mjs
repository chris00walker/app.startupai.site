#!/usr/bin/env node

// Test authentication flow and identify issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Authentication Flow...\n');

console.log('Environment Check:');
console.log('- Supabase URL:', supabaseUrl);
console.log('- Anon Key Length:', supabaseAnonKey?.length || 'MISSING');
console.log('- Service Key Length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthFlow() {
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('\n📡 Test 1: Supabase Connection');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else {
      console.log('✅ Connection successful, no active session (expected)');
    }

    // Test 2: Check if user_profiles table exists and is accessible
    console.log('\n📊 Test 2: Database Access (user_profiles table)');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .limit(1);
    
    if (profileError) {
      console.log('❌ Profile query error:', profileError.message);
      console.log('   This might indicate RLS issues or missing table');
    } else {
      console.log('✅ user_profiles table accessible');
      console.log('   Found profiles:', profiles?.length || 0);
    }

    // Test 3: Check OAuth configuration (this will show available providers)
    console.log('\n🔐 Test 3: OAuth Providers Check');
    
    // Try to initiate GitHub OAuth (this will show if it's configured)
    try {
      const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
          skipBrowserRedirect: true // Don't actually redirect
        }
      });
      
      if (oauthError) {
        console.log('❌ GitHub OAuth error:', oauthError.message);
        if (oauthError.message.includes('Provider not found')) {
          console.log('   → GitHub OAuth is not configured in Supabase');
        }
      } else {
        console.log('✅ GitHub OAuth configured (got auth URL)');
        console.log('   Auth URL exists:', !!oauthData?.url);
      }
    } catch (error) {
      console.log('❌ OAuth test failed:', error.message);
    }

    // Test 4: Check if we can create a user (this will test email auth)
    console.log('\n📧 Test 4: Email Authentication Test');
    const testEmail = 'test-' + Date.now() + '@example.com';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          test: true
        }
      }
    });
    
    if (signUpError) {
      console.log('❌ Email signup error:', signUpError.message);
      if (signUpError.message.includes('Signup is disabled')) {
        console.log('   → Email signup is disabled in Supabase settings');
      }
    } else {
      console.log('✅ Email authentication working');
      console.log('   User created:', !!signUpData?.user);
      console.log('   Confirmation required:', !signUpData?.session);
      
      // Clean up test user
      if (signUpData?.user) {
        console.log('   Cleaning up test user...');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function checkSpecificIssues() {
  console.log('\n🔍 Checking Specific Issues from User Report...\n');
  
  // Issue 1: Role routing
  console.log('Issue 1: Role-based routing');
  console.log('- Expected: founder@test.com → /founder-dashboard');
  console.log('- Expected: consultant@test.com → /dashboard');
  console.log('- Status: Need to create test users first');
  
  // Issue 2: GitHub OAuth
  console.log('\nIssue 2: GitHub OAuth not working');
  console.log('- Expected callback URL: https://eqxropalhxjeyvfcoyxg.supabase.co/auth/v1/callback');
  console.log('- Status: Testing above...');
  
  // Issue 3: Double login prompts
  console.log('\nIssue 3: Double login prompts');
  console.log('- Marketing site → Product site handoff');
  console.log('- Status: Need to test cross-site flow');
}

testAuthFlow().then(() => {
  checkSpecificIssues();
}).catch(console.error);

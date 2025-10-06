#!/usr/bin/env node

// Debug script to check authentication setup
const { createClient } = require('@supabase/supabase-js');

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

async function checkAuth() {
  console.log('🔍 Checking authentication setup...\n');
  
  try {
    // Check user profiles
    console.log('📊 User Profiles:');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, role, plan_status, subscription_status')
      .limit(10);
    
    if (profileError) {
      console.error('Error fetching profiles:', profileError);
    } else {
      console.table(profiles);
    }
    
    // Check auth users
    console.log('\n👥 Auth Users:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
    } else {
      const userSummary = authUsers.users.map(user => ({
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        role: user.app_metadata?.role,
        created: user.created_at
      }));
      console.table(userSummary);
    }
    
    // Check for test users
    console.log('\n🧪 Looking for test users...');
    const testEmails = ['founder@test.com', 'consultant@test.com', 'trial@test.com'];
    
    for (const email of testEmails) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();
      
      if (profile) {
        console.log(`✅ Found ${email}:`, {
          role: profile.role,
          planStatus: profile.plan_status,
          id: profile.id
        });
      } else {
        console.log(`❌ Missing ${email}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAuth();

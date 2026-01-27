#!/usr/bin/env tsx
/**
 * Create Admin Test User
 *
 * Creates an admin test user for E2E testing.
 * Requires SUPABASE_SERVICE_ROLE_KEY for admin operations.
 *
 * Usage:
 *   pnpm tsx scripts/create-admin-test-user.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Admin test user credentials - must match tests/e2e/helpers/auth.ts
const ADMIN_USER = {
  email: 'admin@startupai.test',
  password: 'AdminTest123!',
};

async function createAdminTestUser() {
  console.log('Creating admin test user...\n');

  const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === ADMIN_USER.email);

    if (existingUser) {
      console.log('Admin user already exists, updating profile...');

      // Update user_profiles to ensure admin role
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: existingUser.id,
          email: ADMIN_USER.email,
          role: 'admin',
          full_name: 'Admin Test User',
          subscription_tier: 'enterprise',
          subscription_status: 'active',
          plan_status: 'active',
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Failed to update user profile:', profileError.message);
        process.exit(1);
      }

      console.log('Admin user profile updated');
      console.log('\nUser Details:');
      console.log('  Email:', ADMIN_USER.email);
      console.log('  User ID:', existingUser.id);
      console.log('  Role: admin');
      return;
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_USER.email,
      password: ADMIN_USER.password,
      email_confirm: true, // Skip email confirmation for test user
    });

    if (createError) {
      console.error('Failed to create user:', createError.message);
      process.exit(1);
    }

    if (!newUser?.user) {
      console.error('No user created');
      process.exit(1);
    }

    console.log('Created auth user');

    // Create or update user_profiles entry with admin role
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: newUser.user.id,
        email: ADMIN_USER.email,
        role: 'admin',
        full_name: 'Admin Test User',
        subscription_tier: 'enterprise',
        subscription_status: 'active',
        plan_status: 'active',
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Failed to create user profile:', profileError.message);
      // Clean up auth user if profile creation failed
      await supabase.auth.admin.deleteUser(newUser.user.id);
      process.exit(1);
    }

    console.log('Created user profile with admin role');

    console.log('\nAdmin Test User Created Successfully!');
    console.log('\nUser Details:');
    console.log('  Email:', ADMIN_USER.email);
    console.log('  Password:', ADMIN_USER.password);
    console.log('  User ID:', newUser.user.id);
    console.log('  Role: admin');
    console.log('\nYou can now run admin E2E tests.');

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createAdminTestUser();

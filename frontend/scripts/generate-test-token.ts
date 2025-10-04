#!/usr/bin/env tsx
/**
 * Generate Test JWT Token
 * 
 * Creates a valid JWT token for E2E testing from Supabase auth.
 * 
 * Usage:
 *   pnpm tsx scripts/generate-test-token.ts
 *   pnpm tsx scripts/generate-test-token.ts --email test@example.com --password testpass123
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const emailIndex = args.indexOf('--email');
const passwordIndex = args.indexOf('--password');

const email = emailIndex >= 0 ? args[emailIndex + 1] : 'test@startupai.site';
const password = passwordIndex >= 0 ? args[passwordIndex + 1] : 'Test123456!';

async function generateToken() {
  console.log('🔐 Generating test JWT token...\n');
  
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  
  try {
    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Authentication failed:', error.message);
      console.log('\n💡 Tips:');
      console.log('  1. Make sure the user exists in Supabase Auth');
      console.log('  2. Verify email and password are correct');
      console.log('  3. Create a test user if needed:\n');
      console.log('     pnpm tsx scripts/create-test-user.ts\n');
      process.exit(1);
    }
    
    if (!data.session) {
      console.error('❌ No session created');
      process.exit(1);
    }
    
    console.log('✅ Successfully authenticated!');
    console.log('\nUser Details:');
    console.log('  Email:', data.user.email);
    console.log('  User ID:', data.user.id);
    console.log('  Created:', new Date(data.user.created_at).toLocaleString());
    
    console.log('\n📋 JWT Access Token:\n');
    console.log(data.session.access_token);
    
    console.log('\n\n🔧 Add to .env.test:');
    console.log(`TEST_JWT_TOKEN=${data.session.access_token}\n`);
    
    console.log('⏱️  Token expires:', new Date(data.session.expires_at! * 1000).toLocaleString());
    
    // Save to .env.test if it exists
    try {
      const fs = await import('fs/promises');
      const envTestPath = '.env.test';
      
      let envContent = '';
      try {
        envContent = await fs.readFile(envTestPath, 'utf-8');
      } catch {
        // File doesn't exist, create new
      }
      
      // Update or add TEST_JWT_TOKEN
      if (envContent.includes('TEST_JWT_TOKEN=')) {
        envContent = envContent.replace(
          /TEST_JWT_TOKEN=.*/,
          `TEST_JWT_TOKEN=${data.session.access_token}`
        );
      } else {
        envContent += `\nTEST_JWT_TOKEN=${data.session.access_token}\n`;
      }
      
      await fs.writeFile(envTestPath, envContent);
      console.log(`\n✅ Token saved to ${envTestPath}`);
    } catch (err) {
      console.log('\n⚠️  Could not save to .env.test (manual copy required)');
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

generateToken();

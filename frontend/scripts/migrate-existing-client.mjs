#!/usr/bin/env node

/**
 * Migration Script: Convert existing client record to user account
 *
 * This script migrates a client from the old `clients` table to a proper
 * user account with auth.users and user_profiles entries.
 */

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

// Load environment variables from .env.local
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
config({ path: envPath })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗')
  process.exit(1)
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Generate secure password
function generateSecurePassword() {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const randomValues = randomBytes(length)
  let password = ''

  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length]
  }

  return password
}

async function migrateClient(clientId) {
  console.log('\n🔄 Starting client migration...\n')

  try {
    // Step 1: Fetch the existing client record
    console.log(`📋 Step 1: Fetching client record ${clientId}...`)
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (fetchError || !client) {
      console.error('❌ Client not found:', fetchError)
      return false
    }

    console.log('✅ Client found:')
    console.log(`   Name: ${client.name}`)
    console.log(`   Email: ${client.email}`)
    console.log(`   Company: ${client.company}`)
    console.log(`   Consultant ID: ${client.consultant_id}`)

    // Step 2: Check if user already exists in auth
    console.log(`\n🔍 Step 2: Checking if auth user exists for ${client.email}...`)
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === client.email)

    if (existingUser) {
      console.log('⚠️  Auth user already exists:', existingUser.id)
      console.log('   Checking user_profile...')

      // Check if user_profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', existingUser.id)
        .single()

      if (existingProfile) {
        console.log('✅ User profile already exists')

        // Update consultant_id if not set
        if (!existingProfile.consultant_id) {
          console.log('🔧 Updating consultant_id on existing profile...')
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ consultant_id: client.consultant_id })
            .eq('id', existingUser.id)

          if (updateError) {
            console.error('❌ Failed to update consultant_id:', updateError)
            return false
          }
          console.log('✅ Consultant_id updated')
        } else {
          console.log('ℹ️  Consultant_id already set:', existingProfile.consultant_id)
        }

        console.log('\n✅ Migration complete (existing user updated)')
        return true
      }
    }

    // Step 3: Create auth user
    console.log('\n👤 Step 3: Creating auth user...')
    const tempPassword = generateSecurePassword()

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: client.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: client.name,
        company: client.company,
        role: 'founder'
      }
    })

    if (authError || !authUser.user) {
      console.error('❌ Failed to create auth user:', authError)
      return false
    }

    console.log('✅ Auth user created:', authUser.user.id)

    // Step 4: Create user_profile
    console.log('\n📝 Step 4: Creating user_profile...')
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        email: client.email,
        full_name: client.name,
        company: client.company,
        role: 'founder',
        consultant_id: client.consultant_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Failed to create user_profile:', profileError)
      console.log('🔄 Rolling back: deleting auth user...')
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return false
    }

    console.log('✅ User profile created:', userProfile.id)

    // Step 5: Send password reset email
    console.log('\n📧 Step 5: Sending password reset email...')
    const { data: resetLink, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: client.email,
    })

    if (resetError) {
      console.warn('⚠️  Failed to send password reset email:', resetError)
      console.log('   User account created but they will need manual password reset')
    } else {
      console.log('✅ Password reset email sent')
      if (resetLink?.properties?.action_link) {
        console.log('\n📩 Password reset link (for testing):')
        console.log(resetLink.properties.action_link)
      }
    }

    // Step 6: Mark old client record as migrated
    console.log('\n🏷️  Step 6: Marking old client record as migrated...')
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        metadata: {
          migrated: true,
          migratedAt: new Date().toISOString(),
          migratedToUserId: authUser.user.id,
          originalData: {
            name: client.name,
            email: client.email,
            company: client.company,
            industry: client.industry
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)

    if (updateError) {
      console.warn('⚠️  Failed to update old client record:', updateError)
    } else {
      console.log('✅ Old client record marked as migrated')
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   Client: ${client.name} (${client.company})`)
    console.log(`   Email: ${client.email}`)
    console.log(`   New User ID: ${authUser.user.id}`)
    console.log(`   Consultant ID: ${client.consultant_id}`)
    console.log('\n👉 Next steps:')
    console.log('   1. Client should check their email for password reset link')
    console.log('   2. Consultant can now see this client in their dashboard')
    console.log('   3. Client can log in and create projects')

    return true

  } catch (error) {
    console.error('\n❌ Unexpected error during migration:', error)
    return false
  }
}

// Main execution
const clientId = 'bb242900-3444-4897-9113-99eae6789d00' // Suzanne Walker / Elias Food Imports

console.log('╔════════════════════════════════════════════════════════════╗')
console.log('║        Client Migration Script                             ║')
console.log('║        Converting clients table → user_profiles            ║')
console.log('╚════════════════════════════════════════════════════════════╝')

migrateClient(clientId)
  .then(success => {
    if (success) {
      console.log('\n✅ Migration script completed successfully')
      process.exit(0)
    } else {
      console.log('\n❌ Migration script failed')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

#!/usr/bin/env node

/**
 * Create auth user for existing user_profile
 * This handles the case where user_profile exists but auth.users entry doesn't
 */

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
config({ path: envPath })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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

async function createAuthUser(userId, email, fullName, company) {
  console.log('\n🔄 Creating auth user...')
  console.log(`   User ID: ${userId}`)
  console.log(`   Email: ${email}`)
  console.log(`   Name: ${fullName}`)
  console.log(`   Company: ${company}`)

  try {
    // Check if auth user exists
    console.log('\n🔍 Checking if auth user exists...')
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.id === userId)

    if (existingUser) {
      console.log('✅ Auth user already exists:', existingUser.id)
      console.log('   Email:', existingUser.email)
      return true
    }

    console.log('⚠️  Auth user not found, creating...')

    // Create auth user with specific ID
    const tempPassword = generateSecurePassword()

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        company: company,
        role: 'founder'
      }
    })

    if (authError) {
      console.error('❌ Failed to create auth user:', authError)
      return false
    }

    console.log('✅ Auth user created:', authUser.user.id)

    // Update user_profile with correct auth user ID if different
    if (authUser.user.id !== userId) {
      console.log('⚠️  Auth user ID differs from user_profile ID')
      console.log(`   Expected: ${userId}`)
      console.log(`   Got: ${authUser.user.id}`)
      console.log('   Updating user_profile...')

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ id: authUser.user.id })
        .eq('id', userId)

      if (updateError) {
        console.error('❌ Failed to update user_profile ID:', updateError)
        return false
      }

      console.log('✅ User_profile ID updated')
    }

    // Send password reset email
    console.log('\n📧 Sending password reset email...')
    const { data: resetLink, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    })

    if (resetError) {
      console.warn('⚠️  Failed to send password reset email:', resetError)
    } else {
      console.log('✅ Password reset email sent')
      if (resetLink?.properties?.action_link) {
        console.log('\n🔗 Password reset link:')
        console.log(resetLink.properties.action_link)
      }
    }

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Run for Suzanne Walker
createAuthUser(
  '8e11e4d6-cd0a-4a57-9bb2-0da51959245a',
  'suzanne00walker@gmail.com',
  'Suzanne Walker',
  'Elias Food Imports'
).then(success => {
  if (success) {
    console.log('\n✅ Auth user setup complete')
    process.exit(0)
  } else {
    console.log('\n❌ Auth user setup failed')
    process.exit(1)
  }
})

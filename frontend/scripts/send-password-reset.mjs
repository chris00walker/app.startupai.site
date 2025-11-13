#!/usr/bin/env node

/**
 * Send password reset email to migrated client
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
config({ path: envPath })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function sendPasswordReset(email) {
  console.log(`\n📧 Sending password reset email to ${email}...`)

  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    })

    if (error) {
      console.error('❌ Failed to generate reset link:', error)
      return false
    }

    console.log('✅ Password reset email sent!')

    if (data?.properties?.action_link) {
      console.log('\n🔗 Password reset link (for testing):')
      console.log(data.properties.action_link)
      console.log('\n👉 The client should check their email inbox')
    }

    return true
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

sendPasswordReset('suzanne00walker@gmail.com')
  .then(success => process.exit(success ? 0 : 1))

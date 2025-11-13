import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { z } from 'zod'

const createClientSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  company: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  description: z.string().optional(),
  businessModel: z.string().optional(),
  targetMarket: z.string().optional(),
  currentChallenges: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  budget: z.union([z.number(), z.string()]).optional(),
  timeline: z.string().optional(),
  assignedConsultant: z.string().optional()
})

// Helper function to generate a secure random password
function generateSecurePassword(): string {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  const crypto = require('crypto')
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)

  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length]
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user (consultant)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error in POST /api/clients:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Creating client for consultant:', user.id, user.email)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createClientSchema.parse(body)

    // Create admin client with service role key for user creation
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate a temporary password for the client
    const temporaryPassword = generateSecurePassword()

    // Step 1: Create auth user
    const { data: authUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: validatedData.name,
        company: validatedData.company,
        role: 'founder' // Clients are founders working with a consultant
      }
    })

    if (authCreateError || !authUser.user) {
      console.error('Error creating auth user:', authCreateError)
      return NextResponse.json(
        { error: 'Failed to create client user account', details: authCreateError?.message },
        { status: 500 }
      )
    }

    console.log('Auth user created:', authUser.user.id)

    // Step 2: Create user_profile with consultant_id
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        email: validatedData.email,
        full_name: validatedData.name,
        company: validatedData.company,
        role: 'founder',
        consultant_id: user.id, // Link to consultant
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { error: 'Failed to create client profile', details: profileError.message },
        { status: 500 }
      )
    }

    console.log('Client user profile created:', userProfile.id)

    // Step 3: Send password reset email so client can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: validatedData.email,
    })

    if (resetError) {
      console.warn('Failed to send password reset email:', resetError)
      // Don't fail the request, just log the warning
    }

    return NextResponse.json({
      success: true,
      data: {
        client: {
          _id: userProfile.id,
          id: userProfile.id,
          name: userProfile.full_name,
          email: userProfile.email,
          company: userProfile.company,
          status: 'discovery'
        }
      },
      message: 'Client created successfully. A password reset email has been sent.'
    })

  } catch (error) {
    console.error('Error in client creation:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch all clients for the logged-in consultant
// Clients are user_profiles where consultant_id = consultant's user id
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user (consultant)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all client user_profiles for this consultant
    const { data: clients, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, company, role, consultant_id, created_at, updated_at')
      .eq('consultant_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching clients:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        clients: clients || []
      }
    })

  } catch (error) {
    console.error('Error in client fetch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

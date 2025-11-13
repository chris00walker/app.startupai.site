import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user (consultant)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error in POST /api/clients:', authError)
      return NextResponse.json(
        { error: 'Authentication error', details: authError.message },
        { status: 401 }
      )
    }

    if (!user) {
      console.error('No user found in POST /api/clients')
      return NextResponse.json(
        { error: 'Unauthorized - no user session found' },
        { status: 401 }
      )
    }

    console.log('Creating client for user:', user.id, user.email)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createClientSchema.parse(body)

    // Convert budget to number if it's a string
    const budget = validatedData.budget
      ? (typeof validatedData.budget === 'string' ? parseFloat(validatedData.budget) : validatedData.budget)
      : null

    // Create client in database
    const { data: client, error: createError } = await supabase
      .from('clients')
      .insert({
        name: validatedData.name,
        email: validatedData.email,
        company: validatedData.company,
        industry: validatedData.industry,
        description: validatedData.description || '',
        business_model: validatedData.businessModel || '',
        target_market: validatedData.targetMarket || '',
        current_challenges: validatedData.currentChallenges,
        goals: validatedData.goals,
        budget: budget,
        timeline: validatedData.timeline || '',
        assigned_consultant: validatedData.assignedConsultant || user.id,
        consultant_id: user.id, // Link client to the consultant who created it
        status: 'discovery', // Initial status
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          createdBy: user.email,
          createdViaForm: true
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating client in database:', createError)
      return NextResponse.json(
        { error: 'Failed to create client', details: createError.message },
        { status: 500 }
      )
    }

    console.log('Client created successfully:', client.id)

    return NextResponse.json({
      success: true,
      data: {
        client: {
          _id: client.id, // Return as _id for compatibility with existing code
          id: client.id,
          name: client.name,
          email: client.email,
          company: client.company,
          industry: client.industry,
          status: client.status
        }
      }
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
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all clients for this consultant
    const { data: clients, error: fetchError } = await supabase
      .from('clients')
      .select('*')
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

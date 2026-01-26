/**
 * Client Detail API
 *
 * @story US-C04
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch the client user_profile by ID
    // Clients are user_profiles with consultant_id set
    const { data: client, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, company, role, consultant_id, created_at, updated_at')
      .eq('id', id)
      .eq('consultant_id', user.id) // Ensure consultant can only access their own clients
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching client:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch client' },
        { status: 500 }
      )
    }

    // Transform user_profile to match expected frontend format
    return NextResponse.json({
      success: true,
      data: {
        client: {
          _id: client.id,
          id: client.id,
          name: client.full_name,
          email: client.email,
          company: client.company,
          industry: '', // Not stored in user_profiles
          description: '', // Not stored in user_profiles
          status: 'discovery', // Default status
          businessModel: '',
          targetMarket: '',
          currentChallenges: [],
          goals: [],
          budget: null,
          timeline: '',
          assignedConsultant: user.id,
          workflowStatus: {
            discovery: { status: 'not_started' },
            validation: { status: 'not_started' },
            scale: { status: 'not_started' }
          },
          createdAt: client.created_at,
          updatedAt: client.updated_at
        }
      }
    })

  } catch (error) {
    console.error('Error in GET /api/clients/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Fetch the client by ID
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('consultant_id', user.id) // Ensure user can only access their own clients
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

    // Transform database format to match expected frontend format
    return NextResponse.json({
      success: true,
      data: {
        client: {
          _id: client.id,
          id: client.id,
          name: client.name,
          email: client.email,
          company: client.company,
          industry: client.industry,
          description: client.description,
          status: client.status,
          businessModel: client.business_model,
          targetMarket: client.target_market,
          currentChallenges: client.current_challenges || [],
          goals: client.goals || [],
          budget: client.budget,
          timeline: client.timeline,
          assignedConsultant: client.assigned_consultant,
          workflowStatus: client.metadata?.workflowStatus || {
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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
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

    console.log(`Discovery workflow triggered for client ${id} by user ${user.email}`)

    // Update client metadata to mark discovery as in_progress
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        metadata: {
          workflowStatus: {
            discovery: { status: 'in_progress', startedAt: new Date().toISOString() },
            validation: { status: 'not_started' },
            scale: { status: 'not_started' }
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('consultant_id', user.id)

    if (updateError) {
      console.error('Error updating client workflow status:', updateError)
    }

    // TODO: Integrate with CrewAI or other AI services to run actual discovery workflow
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Discovery workflow started successfully',
      data: {
        workflowId: `discovery-${id}-${Date.now()}`,
        status: 'in_progress'
      }
    })

  } catch (error) {
    console.error('Error in POST /api/clients/[id]/discovery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

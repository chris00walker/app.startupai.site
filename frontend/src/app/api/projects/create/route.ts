import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Project description is required'),
  problemStatement: z.string().min(1, 'Problem statement is required'),
  targetMarket: z.string().min(1, 'Target market is required'),
  businessModel: z.string().min(1, 'Business model is required'),
  stage: z.enum(['DESIRABILITY', 'FEASIBILITY', 'VIABILITY', 'SCALE']).default('DESIRABILITY'),
  clientId: z.string().optional() // For consultants creating projects for clients
})

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    // Create project in database
    const { data: project, error: createError } = await supabase
      .from('projects')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        user_id: user.id,
        status: 'active',
        stage: validatedData.stage,
        gate_status: 'Pending',
        risk_budget_planned: 100,
        risk_budget_actual: 0,
        risk_budget_delta: 100,
        assigned_consultant: null,
        last_activity: new Date().toISOString(),
        next_gate_date: null,
        evidence_quality: 0,
        hypotheses_count: 0,
        experiments_count: 0,
        evidence_count: 0,
        // Store additional project data as metadata
        metadata: {
          problemStatement: validatedData.problemStatement,
          targetMarket: validatedData.targetMarket,
          businessModel: validatedData.businessModel,
          createdViaWizard: true,
          aiInsightsGenerated: true,
          ...(validatedData.clientId && { clientId: validatedData.clientId })
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating project:', createError)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    // TODO: Integrate with CrewAI backend to:
    // 1. Generate initial hypotheses based on project data
    // 2. Create recommended experiments
    // 3. Set up AI-powered validation framework
    // 4. Generate initial evidence collection plan
    
    // For now, we'll create some basic hypotheses
    const initialHypotheses = [
      {
        project_id: project.id,
        user_id: user.id,
        title: 'Primary Value Hypothesis',
        description: `Target customers will pay for ${validatedData.name} because it solves their core problem: ${validatedData.problemStatement}`,
        category: 'desirability',
        priority: 'high',
        status: 'active',
        confidence_level: 50,
        evidence_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        project_id: project.id,
        user_id: user.id,
        title: 'Market Size Hypothesis',
        description: `The target market (${validatedData.targetMarket}) is large enough to sustain our business model`,
        category: 'viability',
        priority: 'medium',
        status: 'active',
        confidence_level: 30,
        evidence_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    // Insert initial hypotheses (if hypotheses table exists)
    try {
      await supabase
        .from('hypotheses')
        .insert(initialHypotheses)
    } catch (hypothesesError) {
      console.warn('Could not create initial hypotheses:', hypothesesError)
      // Continue without failing - hypotheses table might not exist yet
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        stage: project.stage,
        status: project.status
      },
      clientId: validatedData.clientId
    })

  } catch (error) {
    console.error('Error in project creation:', error)
    
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

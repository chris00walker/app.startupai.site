import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface CompleteOnboardingRequest {
  sessionId: string;
  finalConfirmation: boolean;
  entrepreneurBrief: any; // EntrepreneurBrief
  userFeedback?: {
    conversationRating: number; // 1-5
    clarityRating: number; // 1-5
    helpfulnessRating: number; // 1-5
    comments?: string;
  };
}

interface CompleteOnboardingResponse {
  success: boolean;
  workflowId: string;
  workflowTriggered: boolean;
  estimatedCompletionTime: string;
  nextSteps: {
    step: string;
    description: string;
    estimatedTime: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  deliverables: {
    executiveSummary: string;
    strategicRecommendations: string[];
    validationPlan: any; // ValidationPlan
    businessModelCanvas: any; // BusinessModelCanvas
  };
  dashboardRedirect: string;
  projectCreated: {
    projectId: string;
    projectName: string;
    projectUrl: string;
  };
}

interface CompleteOnboardingError {
  success: false;
  error: {
    code: 'INVALID_REQUEST' | 'INVALID_SESSION' | 'WORKFLOW_TRIGGER_FAILED' | 'PROJECT_CREATION_FAILED' | 'PROCESSING_ERROR';
    message: string;
    retryable: boolean;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getOnboardingSession(sessionId: string) {
  try {
    const adminClient = createAdminClient();
    
    const { data: session, error } = await adminClient
      .from('onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

function generateWorkflowId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateProjectId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function createEntrepreneurBrief(sessionId: string, userId: string, briefData: any) {
  try {
    const adminClient = createAdminClient();
    
    // Calculate completeness and quality scores
    const completenessScore = calculateCompletenessScore(briefData);
    const clarityScore = calculateClarityScore(briefData);
    const consistencyScore = calculateConsistencyScore(briefData);
    const overallQualityScore = Math.round((completenessScore + clarityScore + consistencyScore) / 3);
    
    const { data, error } = await adminClient
      .from('entrepreneur_briefs')
      .insert({
        session_id: sessionId,
        user_id: userId,
        
        // Customer segments
        customer_segments: briefData.customer_segments || [],
        primary_customer_segment: briefData.primary_customer_segment || null,
        customer_segment_confidence: briefData.customer_segment_confidence || 7,
        
        // Problem definition
        problem_description: briefData.problem_description || '',
        problem_pain_level: briefData.problem_pain_level || 5,
        problem_frequency: briefData.problem_frequency || 'weekly',
        problem_impact: briefData.problem_impact || {},
        problem_evidence: briefData.problem_evidence || [],
        
        // Solution concept
        solution_description: briefData.solution_description || '',
        solution_mechanism: briefData.solution_mechanism || '',
        unique_value_proposition: briefData.unique_value_proposition || '',
        differentiation_factors: briefData.differentiation_factors || [],
        solution_confidence: briefData.solution_confidence || 7,
        
        // Competitive landscape
        competitors: briefData.competitors || [],
        competitive_alternatives: briefData.competitive_alternatives || [],
        switching_barriers: briefData.switching_barriers || [],
        competitive_advantages: briefData.competitive_advantages || [],
        
        // Resources and constraints
        budget_range: briefData.budget_range || '',
        budget_constraints: briefData.budget_constraints || {},
        available_channels: briefData.available_channels || [],
        existing_assets: briefData.existing_assets || [],
        team_capabilities: briefData.team_capabilities || [],
        time_constraints: briefData.time_constraints || {},
        
        // Business stage and goals
        business_stage: briefData.business_stage || 'idea',
        three_month_goals: briefData.three_month_goals || [],
        six_month_goals: briefData.six_month_goals || [],
        success_criteria: briefData.success_criteria || [],
        key_metrics: briefData.key_metrics || [],
        
        // Quality metrics
        completeness_score: completenessScore,
        clarity_score: clarityScore,
        consistency_score: consistencyScore,
        overall_quality_score: overallQualityScore,
        
        // AI analysis metadata
        ai_confidence_scores: briefData.ai_confidence_scores || {},
        validation_flags: briefData.validation_flags || [],
        recommended_next_steps: briefData.recommended_next_steps || [],
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating entrepreneur brief:', error);
      throw new Error('Failed to create entrepreneur brief');
    }
    
    return data;
  } catch (error) {
    console.error('Create brief error:', error);
    throw error;
  }
}

function calculateCompletenessScore(briefData: any): number {
  const requiredFields = [
    'problem_description',
    'solution_description',
    'business_stage',
    'customer_segments',
    'budget_range',
  ];
  
  let completedFields = 0;
  
  for (const field of requiredFields) {
    const value = briefData[field];
    if (value && (typeof value === 'string' ? value.length > 10 : Array.isArray(value) ? value.length > 0 : true)) {
      completedFields++;
    }
  }
  
  return Math.round((completedFields / requiredFields.length) * 100);
}

function calculateClarityScore(briefData: any): number {
  // Simple heuristic based on text length and detail
  const textFields = ['problem_description', 'solution_description', 'unique_value_proposition'];
  let totalScore = 0;
  let fieldCount = 0;
  
  for (const field of textFields) {
    const text = briefData[field];
    if (text && typeof text === 'string') {
      fieldCount++;
      if (text.length > 100) totalScore += 90;
      else if (text.length > 50) totalScore += 70;
      else if (text.length > 20) totalScore += 50;
      else totalScore += 30;
    }
  }
  
  return fieldCount > 0 ? Math.round(totalScore / fieldCount) : 60;
}

function calculateConsistencyScore(briefData: any): number {
  // Check for consistency between problem, solution, and customer segments
  let consistencyScore = 70; // Base score
  
  // Check if solution addresses the problem
  const problem = (briefData.problem_description || '').toLowerCase();
  const solution = (briefData.solution_description || '').toLowerCase();
  
  if (problem && solution) {
    // Simple keyword matching for consistency
    const problemWords = problem.split(' ').filter(w => w.length > 4);
    const solutionWords = solution.split(' ').filter(w => w.length > 4);
    const overlap = problemWords.filter(w => solutionWords.includes(w)).length;
    
    if (overlap > 0) consistencyScore += 20;
  }
  
  return Math.min(100, consistencyScore);
}

async function createProjectFromOnboarding(sessionId: string, userId: string, briefData: any) {
  try {
    const adminClient = createAdminClient();
    
    // Generate project name from brief data
    const projectName = briefData.unique_value_proposition || 
                       briefData.solution_description?.substring(0, 50) || 
                       `Project from ${new Date().toLocaleDateString()}`;
    
    const projectId = generateProjectId();
    
    const { data, error } = await adminClient
      .from('projects')
      .insert({
        id: projectId,
        user_id: userId,
        name: projectName.substring(0, 100), // Ensure it fits in the field
        description: briefData.problem_description || 'Project created from onboarding session',
        stage: briefData.business_stage || 'idea',
        onboarding_session_id: sessionId,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_quality_score: briefData.overall_quality_score || 70,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
    
    return data;
  } catch (error) {
    console.error('Create project error:', error);
    throw error;
  }
}

async function updateSessionComplete(sessionId: string, workflowId: string, userFeedback?: any) {
  try {
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from('onboarding_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        user_feedback: userFeedback || null,
        ai_context: {
          workflowId,
          completedAt: new Date().toISOString(),
        },
      })
      .eq('session_id', sessionId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating session to complete:', error);
      throw new Error('Failed to update session');
    }
    
    return data;
  } catch (error) {
    console.error('Update session complete error:', error);
    throw error;
  }
}

function generateStrategicAnalysis(briefData: any, session: any) {
  // Generate comprehensive strategic analysis based on collected data
  // This is a sophisticated analysis simulation
  // TODO: Replace with actual CrewAI strategic analysis workflow
  
  const businessStage = briefData.business_stage || 'idea';
  const hasCompetitors = briefData.competitors && briefData.competitors.length > 0;
  const hasBudget = briefData.budget_range && briefData.budget_range !== '';
  
  // Executive Summary
  const executiveSummary = `Based on our comprehensive conversation, your ${businessStage}-stage business concept shows strong potential. You've identified a clear problem in ${briefData.problem_description?.substring(0, 100) || 'your target market'} and proposed a ${briefData.solution_description?.substring(0, 100) || 'innovative solution'}. ${hasCompetitors ? 'The competitive landscape analysis reveals opportunities for differentiation.' : 'The limited competition suggests a potential market gap.'} ${hasBudget ? 'Your budget planning demonstrates realistic resource allocation.' : 'Consider developing a more detailed budget plan for implementation.'}`;
  
  // Strategic Recommendations
  const recommendations = [
    'Validate your problem hypothesis with 10-15 potential customers through structured interviews',
    'Create a minimum viable product (MVP) to test core assumptions with minimal investment',
    'Develop a detailed go-to-market strategy focusing on your primary customer segment',
    hasCompetitors ? 'Conduct deeper competitive analysis to identify unique positioning opportunities' : 'Research indirect competitors and alternative solutions customers currently use',
    'Establish key performance indicators (KPIs) to measure progress and validate assumptions',
    hasBudget ? 'Allocate 20% of budget for customer discovery and validation activities' : 'Secure initial funding or bootstrap resources for customer validation phase',
  ];
  
  // Validation Plan
  const validationPlan = {
    phase1: {
      name: 'Problem Validation',
      duration: '2-4 weeks',
      activities: [
        'Conduct 15 customer interviews',
        'Survey 50+ potential customers',
        'Analyze existing solutions and workarounds',
      ],
      successCriteria: '80% of interviewees confirm problem exists and would pay for solution',
    },
    phase2: {
      name: 'Solution Validation',
      duration: '4-6 weeks',
      activities: [
        'Build and test MVP with 10 early users',
        'Gather detailed feedback on solution approach',
        'Iterate based on user feedback',
      ],
      successCriteria: '70% of MVP users would recommend to others',
    },
    phase3: {
      name: 'Market Validation',
      duration: '6-8 weeks',
      activities: [
        'Launch beta version to 50+ users',
        'Test pricing and business model',
        'Validate go-to-market channels',
      ],
      successCriteria: 'Achieve product-market fit indicators and sustainable unit economics',
    },
  };
  
  // Business Model Canvas
  const businessModelCanvas = {
    keyPartners: briefData.existing_assets || ['To be identified through validation'],
    keyActivities: ['Product development', 'Customer acquisition', 'Customer support'],
    keyResources: briefData.team_capabilities || ['Founding team', 'Initial capital', 'Domain expertise'],
    valueProposition: briefData.unique_value_proposition || 'Solving customer problem efficiently',
    customerRelationships: ['Personal assistance', 'Self-service', 'Community'],
    channels: briefData.available_channels || ['Direct sales', 'Online marketing', 'Partnerships'],
    customerSegments: briefData.customer_segments || ['Primary target segment'],
    costStructure: ['Development costs', 'Marketing expenses', 'Operations'],
    revenueStreams: ['Product sales', 'Subscription fees', 'Service revenue'],
  };
  
  return {
    executiveSummary,
    strategicRecommendations: recommendations,
    validationPlan,
    businessModelCanvas,
  };
}

function generateNextSteps(briefData: any, businessStage: string) {
  const baseSteps = [
    {
      step: 'Customer Discovery',
      description: 'Conduct structured interviews with 15 potential customers to validate problem assumptions',
      estimatedTime: '2-3 weeks',
      priority: 'high' as const,
    },
    {
      step: 'Competitive Research',
      description: 'Complete comprehensive analysis of direct and indirect competitors',
      estimatedTime: '1 week',
      priority: 'medium' as const,
    },
    {
      step: 'MVP Development',
      description: 'Build minimum viable product to test core value proposition',
      estimatedTime: '4-6 weeks',
      priority: 'high' as const,
    },
  ];
  
  // Add stage-specific steps
  if (businessStage === 'idea') {
    baseSteps.unshift({
      step: 'Market Research',
      description: 'Validate market size and opportunity through secondary research',
      estimatedTime: '1 week',
      priority: 'high' as const,
    });
  }
  
  if (!briefData.budget_range) {
    baseSteps.push({
      step: 'Financial Planning',
      description: 'Develop detailed budget and funding strategy',
      estimatedTime: '1-2 weeks',
      priority: 'medium' as const,
    });
  }
  
  return baseSteps;
}

// ============================================================================
// Main API Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, finalConfirmation, entrepreneurBrief, userFeedback }: CompleteOnboardingRequest = body;
    
    // Validate required fields
    if (!sessionId || !finalConfirmation) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: sessionId and finalConfirmation',
          retryable: false,
        },
      } as CompleteOnboardingError, { status: 400 });
    }
    
    // Validate session
    const session = await getOnboardingSession(sessionId);
    if (!session || session.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: 'Session not found, expired, or already completed',
          retryable: false,
        },
      } as CompleteOnboardingError, { status: 404 });
    }
    
    // Merge session data with final brief
    const finalBriefData = {
      ...session.stage_data,
      ...entrepreneurBrief,
    };
    
    // Generate workflow ID
    const workflowId = generateWorkflowId();
    
    try {
      // Create entrepreneur brief in database
      const brief = await createEntrepreneurBrief(sessionId, session.user_id, finalBriefData);
      
      // Create project from onboarding
      const project = await createProjectFromOnboarding(sessionId, session.user_id, {
        ...finalBriefData,
        overall_quality_score: brief.overall_quality_score,
      });
      
      // Update session to completed
      await updateSessionComplete(sessionId, workflowId, userFeedback);
      
      // Generate strategic analysis
      const analysis = generateStrategicAnalysis(finalBriefData, session);
      
      // Generate next steps
      const nextSteps = generateNextSteps(finalBriefData, finalBriefData.business_stage || 'idea');
      
      // Prepare response
      const response: CompleteOnboardingResponse = {
        success: true,
        workflowId,
        workflowTriggered: true,
        estimatedCompletionTime: '15-20 minutes',
        nextSteps,
        deliverables: analysis,
        dashboardRedirect: `/project/${project.id}`,
        projectCreated: {
          projectId: project.id,
          projectName: project.name,
          projectUrl: `/project/${project.id}`,
        },
      };
      
      return NextResponse.json(response);
      
    } catch (error) {
      console.error('Error in completion workflow:', error);
      
      if (error instanceof Error && error.message.includes('create project')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'PROJECT_CREATION_FAILED',
            message: 'Failed to create project from onboarding session',
            retryable: true,
          },
        } as CompleteOnboardingError, { status: 500 });
      }
      
      return NextResponse.json({
        success: false,
        error: {
          code: 'WORKFLOW_TRIGGER_FAILED',
          message: 'Failed to complete onboarding workflow',
          retryable: true,
        },
      } as CompleteOnboardingError, { status: 500 });
    }
    
  } catch (error) {
    console.error('Onboarding completion error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Unable to complete onboarding. Please try again.',
        retryable: true,
      },
    } as CompleteOnboardingError, { status: 500 });
  }
}

// ============================================================================
// OPTIONS handler for CORS
// ============================================================================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

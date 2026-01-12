import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;
type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>;
type SupabaseClient = SupabaseAdminClient | SupabaseServerClient;

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
    analysisId: string;
    summary: string | null;
    insights: CrewInsight[];
    rawOutput?: string;
  };
  dashboardRedirect: string;
  projectCreated: {
    projectId: string;
    projectName: string;
    projectUrl: string;
  };
  analysisMetadata?: {
    evidenceCount?: number;
    evidenceCreated?: number;
    reportCreated?: boolean;
    error?: string;
    rateLimit?: {
      limit: number;
      remaining: number;
      windowSeconds: number;
    };
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

interface CrewInsight {
  id: string;
  headline: string;
  confidence?: string;
  support?: string;
}

interface CrewAnalyzeApiResponse {
  success: boolean;
  analysisId: string;
  summary?: string;
  insights?: CrewInsight[];
  rawOutput?: string;
  evidenceCount?: number;
  evidenceCreated?: number;
  reportCreated?: boolean;
  metadata?: {
    project_id?: string;
    user_id?: string;
    rate_limit?: {
      limit: number;
      remaining: number;
      window_seconds: number;
    };
  };
}

type RateLimitInfo = {
  limit: number;
  remaining: number;
  windowSeconds: number;
};

// ============================================================================
// Helper Functions
// ============================================================================

async function getOnboardingSession(client: SupabaseClient, sessionId: string, expectedUserId?: string) {
  try {
    const { data: session, error } = await client
      .from('onboarding_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    if (expectedUserId && session?.user_id && session.user_id !== expectedUserId) {
      console.warn(
        `[onboarding/complete] Session ownership mismatch. Expected ${expectedUserId}, got ${session.user_id}.`,
      );
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

async function createEntrepreneurBrief(
  client: SupabaseClient,
  sessionId: string,
  userId: string,
  briefData: any,
) {
  try {
    // Calculate completeness and quality scores
    const completenessScore = calculateCompletenessScore(briefData);
    const clarityScore = calculateClarityScore(briefData);
    const consistencyScore = calculateConsistencyScore(briefData);
    const overallQualityScore = Math.round((completenessScore + clarityScore + consistencyScore) / 3);
    
    const { data, error } = await client
      .from('entrepreneur_briefs')
      .upsert({
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
      }, { onConflict: 'session_id' })
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

function buildCrewAnalysisInputs(briefData: any) {
  const question = `What strategic actions should ${briefData.solution_description ? briefData.solution_description.slice(0, 80) : 'this startup'} prioritize to validate the problem "${briefData.problem_description || 'their core assumption'}"?`;

  const contextSections = [
    briefData.problem_description && `Problem: ${briefData.problem_description}`,
    Array.isArray(briefData.customer_segments) && briefData.customer_segments.length > 0 && `Customer Segments: ${briefData.customer_segments.join(', ')}`,
    briefData.solution_description && `Solution: ${briefData.solution_description}`,
    Array.isArray(briefData.unique_value_proposition) ? `Value Proposition: ${briefData.unique_value_proposition}` : briefData.unique_value_proposition && `Value Proposition: ${briefData.unique_value_proposition}`,
    briefData.business_stage && `Stage: ${briefData.business_stage}`,
    briefData.budget_range && `Budget: ${briefData.budget_range}`,
  ].filter(Boolean);

  return {
    strategicQuestion: question,
    projectContext: contextSections.join(' | '),
  };
}

/**
 * Build inputs for the CrewAI founder_validation flow.
 * Transforms entrepreneur brief data to the schema expected by the flow.
 *
 * NOTE: The CrewAI flow expects `entrepreneur_input` as a string description.
 * We build a comprehensive text summary from the structured brief data.
 */
function buildFounderValidationInputs(
  briefData: any,
  projectId: string,
  userId: string,
  sessionId: string
): Record<string, any> {
  // Build entrepreneur_input as a comprehensive text string for the CrewAI flow
  const businessIdea = briefData.solution_description || briefData.unique_value_proposition || '';
  const problemDesc = briefData.problem_description || '';
  const segments = (briefData.customer_segments || []).join(', ');
  const competitors = (briefData.competitors || []).join(', ');
  const differentiators = (briefData.differentiation_factors || []).join(', ');
  const goals = (briefData.three_month_goals || []).join(', ');

  // Construct a rich text description for the AI to analyze
  const entrepreneurInput = [
    `Business Idea: ${businessIdea}`,
    problemDesc ? `Problem: ${problemDesc}` : '',
    briefData.unique_value_proposition ? `Value Proposition: ${briefData.unique_value_proposition}` : '',
    segments ? `Target Customers: ${segments}` : '',
    briefData.primary_customer_segment ? `Primary Segment: ${briefData.primary_customer_segment}` : '',
    competitors ? `Competitors: ${competitors}` : '',
    differentiators ? `Differentiation: ${differentiators}` : '',
    briefData.budget_range ? `Budget: ${briefData.budget_range}` : '',
    briefData.business_stage ? `Stage: ${briefData.business_stage}` : '',
    goals ? `Goals: ${goals}` : '',
  ].filter(Boolean).join('\n');

  return {
    flow_type: 'founder_validation',
    project_id: projectId,
    user_id: userId,
    session_id: sessionId,
    // Primary input expected by CrewAI flow
    entrepreneur_input: entrepreneurInput,
    // Also include structured data for richer context (flow can use if available)
    entrepreneur_brief: {
      business_idea: businessIdea,
      problem_description: problemDesc,
      solution_description: briefData.solution_description || '',
      unique_value_proposition: briefData.unique_value_proposition || '',
      customer_segments: briefData.customer_segments || [],
      primary_customer_segment: briefData.primary_customer_segment || (briefData.customer_segments?.[0] ?? ''),
      business_stage: briefData.business_stage || 'idea',
      budget_range: briefData.budget_range || 'not specified',
      competitors: briefData.competitors || [],
      differentiation_factors: briefData.differentiation_factors || [],
      available_channels: briefData.available_channels || [],
      team_capabilities: briefData.team_capabilities || [],
      three_month_goals: briefData.three_month_goals || [],
      success_criteria: briefData.success_criteria || [],
      key_metrics: briefData.key_metrics || [],
    },
  };
}

async function createProjectFromOnboarding(
  client: SupabaseClient,
  sessionId: string,
  userId: string,
  briefData: any,
) {
  try {
    const projectName = (briefData.unique_value_proposition || briefData.solution_description || `Project ${new Date().toLocaleDateString()}`).slice(0, 100);
    const stageMap: Record<string, 'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY' | 'SCALE'> = {
      idea: 'DESIRABILITY',
      validation: 'DESIRABILITY',
      early_traction: 'FEASIBILITY',
      scaling: 'VIABILITY',
      growth: 'SCALE',
    };

    const stage = stageMap[briefData.business_stage as string] ?? 'DESIRABILITY';

    const metadata = {
      onboardingSessionId: sessionId,
      createdViaOnboarding: true,
      briefQualityScore: briefData.overall_quality_score,
      problemStatement: briefData.problem_description,
      targetMarket: briefData.customer_segments,
    };

    const { data, error } = await client
      .from('projects')
      .insert({
        user_id: userId,
        name: projectName,
        description: briefData.problem_description || 'Project created from onboarding session',
        stage,
        status: 'active',
        gate_status: 'Pending',
        metadata,
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

async function updateSessionComplete(
  client: SupabaseClient,
  sessionId: string,
  workflowId: string,
  userFeedback?: any,
  aiContext?: Record<string, any>,
) {
  try {
    const { data, error } = await client
      .from('onboarding_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        user_feedback: userFeedback || null,
        ai_context: {
          workflowId,
          completedAt: new Date().toISOString(),
          ...(aiContext || {}),
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

/**
 * @deprecated This mock fallback is no longer used.
 * Real analysis comes from CrewAI founder_validation flow via webhook.
 * Keeping for reference - can be removed in future cleanup.
 */
function generateStrategicAnalysis(briefData: any, session: any) {
  // Generate comprehensive strategic analysis based on collected data
  // This is a sophisticated analysis simulation
  // DEPRECATED: Real analysis now comes from CrewAI founder_validation flow
  
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

    const sessionClient = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    const { data: sessionInfo } = await sessionClient.auth.getSession();
    const accessToken = sessionInfo?.session?.access_token;

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SESSION',
            message: 'User session is required',
            retryable: false,
          },
        } as CompleteOnboardingError,
        { status: 401 },
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SESSION',
            message: 'Authentication token missing',
            retryable: false,
          },
        } as CompleteOnboardingError,
        { status: 401 },
      );
    }

    let supabaseClient: SupabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[onboarding/complete] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = sessionClient;
    }

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
    const session = await getOnboardingSession(supabaseClient, sessionId, user.id);
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
      ...(session.stage_data?.brief ?? session.stage_data ?? {}),
      ...entrepreneurBrief,
    };
    
    // Generate workflow ID (can be replaced by Crew analysis run id)
    let workflowId = generateWorkflowId();
    
    try {
      const brief = await createEntrepreneurBrief(supabaseClient, sessionId, session.user_id, finalBriefData);

      const project = await createProjectFromOnboarding(supabaseClient, sessionId, session.user_id, {
        ...finalBriefData,
        overall_quality_score: brief.overall_quality_score,
      });

      let analysisResult: CrewAnalyzeApiResponse | null = null;
      let crewError: string | null = null;
      let rateLimitInfo: RateLimitInfo | undefined;

      try {
        // Use Modal Serverless for founder validation (primary)
        // Falls back to CrewAI AMP if Modal not configured
        // Results will be persisted via webhook at /api/crewai/webhook
        const { createModalClient, isModalConfigured } = await import('@/lib/crewai/modal-client');

        if (isModalConfigured()) {
          // Modal Serverless (recommended - $0 idle costs)
          console.log('[onboarding/complete] Starting Modal founder_validation flow...');

          const modalClient = createModalClient();

          // Build inputs for founder validation flow
          const validationInputs = buildFounderValidationInputs(
            finalBriefData,
            project.id,
            session.user_id,
            sessionId
          );

          // Kick off the flow (fire and forget - don't wait for completion)
          // Results will be persisted via webhook at /api/crewai/webhook
          const response = await modalClient.kickoff({
            entrepreneur_input: validationInputs.entrepreneur_input,
            project_id: validationInputs.project_id,
            user_id: validationInputs.user_id,
            session_id: validationInputs.session_id,
          });

          workflowId = response.run_id;
          console.log('[onboarding/complete] Modal kickoff started:', workflowId);

          // Mark that we successfully triggered the workflow
          analysisResult = {
            success: true,
            analysisId: workflowId,
            summary: 'Your founder validation analysis is in progress. Results will appear on your dashboard within 3-5 minutes.',
            insights: [],
            metadata: {
              project_id: project.id,
              user_id: user.id,
            },
          };

          // Store run_id in project metadata for webhook correlation
          await supabaseClient
            .from('projects')
            .update({
              metadata: {
                ...(project.metadata || {}),
                pending_kickoff_id: workflowId,
                modal_run_id: workflowId,
                crewai_flow_type: 'founder_validation',
                kickoff_started_at: new Date().toISOString(),
              },
            })
            .eq('id', project.id);
        } else {
          // Fallback to CrewAI AMP (deprecated)
          const { createCrewAIClient } = await import('@/lib/crewai/amp-client');

          const crewaiUrl = process.env.CREWAI_API_URL;
          if (!crewaiUrl) {
            console.warn('[onboarding/complete] Neither MODAL nor CREWAI_API_URL configured, skipping AI analysis');
          } else {
            console.log('[onboarding/complete] Using fallback CrewAI AMP (Modal not configured)...');

            const crewClient = createCrewAIClient({
              apiUrl: crewaiUrl,
              apiToken: process.env.CREWAI_API_TOKEN,
            });

            const validationInputs = buildFounderValidationInputs(
              finalBriefData,
              project.id,
              session.user_id,
              sessionId
            );

            const response = await crewClient.kickoff({
              inputs: validationInputs,
            });

            workflowId = response.kickoff_id;
            console.log('[onboarding/complete] CrewAI AMP kickoff started:', workflowId);

            analysisResult = {
              success: true,
              analysisId: workflowId,
              summary: 'Your founder validation analysis is in progress. Results will appear on your dashboard within 3-5 minutes.',
              insights: [],
              metadata: {
                project_id: project.id,
                user_id: user.id,
              },
            };

            await supabaseClient
              .from('projects')
              .update({
                metadata: {
                  ...(project.metadata || {}),
                  pending_kickoff_id: workflowId,
                  crewai_flow_type: 'founder_validation',
                  kickoff_started_at: new Date().toISOString(),
                },
              })
              .eq('id', project.id);
          }
        }
      } catch (analysisErr) {
        crewError = analysisErr instanceof Error ? analysisErr.message : 'Validation kickoff failed';
        console.error('[onboarding/complete] Kickoff error:', crewError);
      }

      // No mock fallback - users will see "processing" state until webhook delivers real results
      const deliverableInsights: CrewInsight[] = analysisResult?.insights ?? [];
      const deliverableSummary = analysisResult?.summary ?? (
        crewError
          ? 'Unable to start analysis. Please refresh and try again.'
          : 'Your founder validation analysis is being prepared. Results will appear on your dashboard shortly.'
      );

      if (crewError) {
        console.error('[onboarding/complete] CrewAI analysis error:', crewError);
      }

      await updateSessionComplete(supabaseClient, sessionId, workflowId, userFeedback, {
        analysisId: analysisResult?.analysisId,
        crewError,
      });

      const nextSteps = generateNextSteps(finalBriefData, finalBriefData.business_stage || 'idea');

      const response: CompleteOnboardingResponse = {
        success: true,
        workflowId,
        workflowTriggered: Boolean(analysisResult),
        estimatedCompletionTime: analysisResult ? '5-10 minutes' : '15-20 minutes',
        nextSteps,
        deliverables: {
          analysisId: workflowId,
          summary: deliverableSummary,
          insights: deliverableInsights,
          rawOutput: analysisResult?.rawOutput,
        },
        dashboardRedirect: `/project/${project.id}/gate`,
        projectCreated: {
          projectId: project.id,
          projectName: project.name,
          projectUrl: `/project/${project.id}/gate`,
        },
        analysisMetadata: analysisResult
          ? {
              evidenceCount: analysisResult.evidenceCount,
              evidenceCreated: analysisResult.evidenceCreated,
              reportCreated: analysisResult.reportCreated,
              ...(rateLimitInfo ? { rateLimit: rateLimitInfo } : {}),
            }
          : crewError
            ? {
                error: crewError,
              }
            : undefined,
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

/**
 * AI Assistant Chat Endpoint
 *
 * Provides conversational AI for ongoing strategic support in dashboards.
 * Features:
 * - Streams responses using Vercel AI SDK
 * - Context-aware of projects, reports, and user role
 * - Tool calling for CrewAI dispatch, report summaries, project status
 * - Saves conversation history for continuity
 */

import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/admin';

// ============================================================================
// AI Model Selection
// ============================================================================

function getAIModel() {
  // Use OpenAI with explicit baseURL to bypass Netlify AI Gateway
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
  });

  const model = process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o-mini';
  console.log('[api/assistant/chat] Using OpenAI model:', model);
  return openai(model);
}

// ============================================================================
// System Prompts
// ============================================================================

const FOUNDER_SYSTEM_PROMPT = `You are a Strategic AI Assistant helping founders validate and grow their startups.

Your capabilities:
- Discuss CrewAI analysis reports and strategic insights
- Answer questions about validation progress and metrics
- Trigger new strategic analysis when needed (use triggerAnalysis tool)
- Provide guidance on experiments, evidence collection, and next steps
- Help founders understand their gate readiness and requirements

Context awareness:
- You have access to the founder's project status, reports, and evidence
- Use the getProjectStatus tool to check current metrics
- Use the getReportSummary tool to discuss specific analysis reports
- When founders ask strategic questions that need deep analysis, use triggerAnalysis tool

Guidelines:
- Be supportive and strategic in your guidance
- When suggesting experiments or validation steps, be specific and actionable
- If a question requires market research or competitive analysis, offer to trigger CrewAI
- Keep responses concise (2-4 sentences) unless detailed explanation is needed
- Always contextualize advice to their specific project and stage`;

const CONSULTANT_SYSTEM_PROMPT = `You are a Practice AI Assistant helping consultants serve their clients effectively.

Your capabilities:
- Analyze client projects and opportunities
- Generate strategic recommendations using CrewAI analysis
- Discuss client-specific findings and deliverables
- Help consultants prepare presentations and reports
- Manage workflow and prioritize client work

Context awareness:
- You have access to consultant practice info and client project data
- Can trigger analysis for each client separately
- Help consultants scale their strategic advisory services

Guidelines:
- Focus on helping consultants deliver value to their clients
- Suggest when to run analysis for client projects
- Help with client communication and deliverables
- Keep responses professional and consultant-focused`;

// ============================================================================
// AI Tools
// ============================================================================

const triggerAnalysisTool = tool({
  description: 'Trigger a new CrewAI strategic analysis. Use this when the user asks questions that require market research, competitive intelligence, or deep strategic analysis.',
  inputSchema: z.object({
    strategicQuestion: z.string().describe('The strategic question to analyze'),
    projectId: z.string().describe('The project ID to associate with this analysis'),
    additionalContext: z.string().optional().describe('Any additional context or constraints'),
    priority: z.enum(['low', 'medium', 'high']).default('medium').describe('Priority level for analysis'),
  }),
  execute: async ({ strategicQuestion, projectId, additionalContext, priority }) => {
    try {
      // This will be called by the AI when it determines analysis is needed
      // The actual API call happens after the tool returns
      return {
        status: 'queued',
        message: `Strategic analysis queued for: "${strategicQuestion}". This will take a few minutes. I'll let you know when the results are ready.`,
        analysisId: `pending-${Date.now()}`,
        estimatedTime: '3-5 minutes',
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to queue analysis: ${error.message}`,
      };
    }
  },
});

const getReportSummaryTool = tool({
  description: 'Retrieve and summarize a specific CrewAI analysis report. Use this when users want to discuss findings from a previous analysis.',
  inputSchema: z.object({
    reportId: z.string().describe('The ID of the report to summarize'),
    projectId: z.string().describe('The project ID this report belongs to'),
  }),
  execute: async ({ reportId, projectId }) => {
    try {
      // Query the reports table
      const supabase = createAdminClient();
      const { data: report, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .eq('project_id', projectId)
        .single();

      if (error || !report) {
        return {
          found: false,
          message: 'Report not found or access denied',
        };
      }

      return {
        found: true,
        reportType: report.report_type,
        summary: report.summary || 'No summary available',
        keyInsights: report.key_insights || [],
        recommendations: report.recommendations || [],
        createdAt: report.created_at,
      };
    } catch (error: any) {
      return {
        found: false,
        message: `Error retrieving report: ${error.message}`,
      };
    }
  },
});

const getProjectStatusTool = tool({
  description: 'Get current project status, metrics, and recent activity. Use this to provide context-aware guidance.',
  inputSchema: z.object({
    projectId: z.string().describe('The project ID to check status for'),
  }),
  execute: async ({ projectId }) => {
    try {
      const supabase = createAdminClient();

      // Get project info
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return {
          found: false,
          message: 'Project not found',
        };
      }

      // Get evidence count
      const { count: evidenceCount } = await supabase
        .from('evidence')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      // Get reports count
      const { count: reportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      // Get recent entrepreneur brief
      const { data: brief } = await supabase
        .from('entrepreneur_briefs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        found: true,
        projectName: project.name,
        stage: project.stage || 'validation',
        status: project.status || 'active',
        evidenceCount: evidenceCount || 0,
        reportsCount: reportsCount || 0,
        problemStatement: brief?.problem_statement || 'Not defined',
        targetCustomer: brief?.target_customer || 'Not defined',
        lastUpdated: project.updated_at,
      };
    } catch (error: any) {
      return {
        found: false,
        message: `Error retrieving project status: ${error.message}`,
      };
    }
  },
});

const assistantTools = {
  triggerAnalysis: triggerAnalysisTool,
  getReportSummary: getReportSummaryTool,
  getProjectStatus: getProjectStatusTool,
};

// ============================================================================
// Main POST Handler
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    console.log('[AssistantChat] Request received:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });

    const { messages, userId, userRole, projectId, clientId } = await req.json();

    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[AssistantChat] Authentication failed:', { authError, hasUser: !!user });
      return new Response('Unauthorized', { status: 401 });
    }

    if (user.id !== userId) {
      console.error('[AssistantChat] User ID mismatch:', { tokenUserId: user.id, requestUserId: userId });
      return new Response('Forbidden', { status: 403 });
    }

    console.log('[AssistantChat] User authenticated:', { userId: user.id, email: user.email, userRole, projectId, clientId });

    // Get admin client for database operations
    let supabaseClient;
    try {
      supabaseClient = createAdminClient();
    } catch (error) {
      console.warn('[AssistantChat] SUPABASE_SERVICE_ROLE_KEY unavailable, using user-scoped client.');
      supabaseClient = supabase;
    }

    // Build context for AI
    let contextMessage = '';
    if (projectId) {
      try {
        const { data: project } = await supabaseClient
          .from('projects')
          .select('name, stage, status')
          .eq('id', projectId)
          .single();

        if (project) {
          contextMessage = `\n\n[Current Project Context: ${project.name}, Stage: ${project.stage}, Status: ${project.status}]`;
        }
      } catch (error) {
        console.error('[AssistantChat] Failed to fetch project context:', error);
      }
    }

    // Select system prompt based on role
    const systemPrompt = userRole === 'founder' ? FOUNDER_SYSTEM_PROMPT : CONSULTANT_SYSTEM_PROMPT;

    console.log('[AssistantChat] Calling streamText with:', {
      systemPromptLength: (systemPrompt + contextMessage).length,
      messagesCount: messages.length,
      temperature: 0.7,
      userRole,
    });

    // Stream AI response with tools
    const result = streamText({
      model: getAIModel(),
      system: systemPrompt + contextMessage,
      messages,
      temperature: 0.7,
      tools: assistantTools,
      onFinish: async ({ text, toolCalls, toolResults }) => {
        try {
          console.log('[AssistantChat] onFinish triggered:', {
            toolCallsCount: toolCalls?.length || 0,
            toolResultsCount: toolResults?.length || 0,
          });

          // Process tool calls - specifically handle triggerAnalysis
          if (toolResults && toolResults.length > 0) {
            for (const result of toolResults) {
              const toolCall = toolCalls?.find((tc) => tc.toolCallId === result.toolCallId);
              if (!toolCall) continue;

              // If triggerAnalysis was called, dispatch actual CrewAI workflow
              if (toolCall.toolName === 'triggerAnalysis') {
                const { strategicQuestion, projectId: analysisProjectId, additionalContext, priority } = toolCall.input as any;

                console.log('[AssistantChat] Dispatching CrewAI analysis:', {
                  question: strategicQuestion,
                  projectId: analysisProjectId,
                });

                // Make actual call to /api/analyze endpoint
                try {
                  const analyzeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      strategic_question: strategicQuestion,
                      project_context: additionalContext || '',
                      project_id: analysisProjectId,
                      session_id: `assistant-${Date.now()}`,
                      user_id: userId,
                      priority_level: priority || 'medium',
                    }),
                  });

                  if (analyzeResponse.ok) {
                    const analyzeData = await analyzeResponse.json();
                    console.log('[AssistantChat] CrewAI analysis dispatched successfully:', analyzeData);
                  } else {
                    console.error('[AssistantChat] Failed to dispatch CrewAI analysis:', analyzeResponse.status);
                  }
                } catch (error) {
                  console.error('[AssistantChat] Error dispatching CrewAI:', error);
                }
              }
            }
          }

          // Save conversation to database
          // Table: assistant_conversations
          // We'll create this in a migration
          try {
            const conversationEntry = {
              user_id: userId,
              project_id: projectId,
              client_id: clientId,
              user_role: userRole,
              user_message: messages[messages.length - 1]?.content || '',
              assistant_message: text,
              tool_calls: toolCalls || [],
              created_at: new Date().toISOString(),
            };

            // Note: This will fail until we create the table, which is fine for now
            await supabaseClient.from('assistant_conversations').insert(conversationEntry);
          } catch (error) {
            console.warn('[AssistantChat] Failed to save conversation (table may not exist yet):', error);
          }
        } catch (error) {
          console.error('[AssistantChat] Error in onFinish:', error);
          // Don't throw - we still want to return the stream
        }
      },
    });

    console.log('[AssistantChat] Returning stream response to client');
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[AssistantChat] Stream error in toUIMessageStreamResponse:', {
          name: err.name,
          message: err.message,
          cause: err.cause,
          stack: err.stack,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
        });
        return `Error: ${err.message}`;
      },
    });
  } catch (error: any) {
    console.error('[AssistantChat] Top-level error:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      cause: error?.cause,
      status: error?.status,
      statusText: error?.statusText,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      fullError: error,
    });
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Copy Bank API Routes
 *
 * GET /api/copy-bank/[projectId] - Fetch Copy Bank for a project
 * POST /api/copy-bank/[projectId] - Generate Copy Bank from VPC data
 *
 * @story US-AP01
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import type {
  CopyBankHeadlines,
  CopyBankPrimaryTexts,
  CopyBankProduct,
  CopyBankCTAs,
} from '@/db/schema/copy-banks';

// ============================================================================
// COPY BANK SCHEMA FOR AI OUTPUT
// ============================================================================

const copyBankSchema = z.object({
  headlines: z.object({
    primary: z.string().max(40).describe('Main headline addressing the pain point'),
    benefit: z.string().max(40).describe('Benefit-focused headline'),
    question: z.string().max(40).describe('Question headline to engage curiosity'),
    social: z.string().max(40).describe('Social proof headline'),
    urgency: z.string().max(40).describe('Urgency/scarcity headline'),
  }),
  primary_texts: z.object({
    problem_solution: z.string().max(125).describe('Pain → Solution narrative'),
    benefit_focused: z.string().max(125).describe('Lead with gains'),
    social_proof: z.string().max(125).describe('Credibility focused'),
    feature_list: z.string().max(125).describe('Key capabilities'),
    urgency: z.string().max(125).describe('Scarcity/time-limited'),
  }),
  pains: z.array(z.string()).length(3).describe('Top 3 pain points as short phrases'),
  gains: z.array(z.string()).length(3).describe('Top 3 gains as short phrases'),
  product: z.object({
    name: z.string().describe('Product/service name'),
    category: z.string().describe('Product category (e.g., "automation tool")'),
    differentiator: z.string().describe('Key differentiator (e.g., "AI-powered")'),
  }),
  image_keywords: z.array(z.string()).length(5).describe('5 Unsplash search keywords'),
  ctas: z.object({
    primary: z.string().max(20).describe('Primary CTA (e.g., "Start Free Trial")'),
    secondary: z.string().max(20).describe('Secondary CTA (e.g., "See How It Works")'),
    urgency: z.string().max(20).describe('Urgency CTA (e.g., "Claim Your Spot")'),
    learn: z.string().max(20).describe('Learn more CTA'),
  }),
});

type CopyBankOutput = z.infer<typeof copyBankSchema>;

// ============================================================================
// AI MODEL SETUP
// ============================================================================

function getAIModel() {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
  });

  // Use gpt-4o-mini for cost efficiency (~$0.02 per generation)
  const model = process.env.COPY_BANK_MODEL || 'gpt-4o-mini';
  return openai(model);
}

// ============================================================================
// GET - Fetch Copy Bank for a project
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();
    const { projectId } = await params;

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch the latest Copy Bank for this project
    const { data: copyBank, error: fetchError } = await supabase
      .from('copy_banks')
      .select('*')
      .eq('project_id', projectId)
      .order('vpc_version', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not found)
      console.error('Error fetching Copy Bank:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch Copy Bank' }, { status: 500 });
    }

    if (!copyBank) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No Copy Bank exists for this project. POST to generate one.',
      });
    }

    return NextResponse.json({
      success: true,
      data: copyBank,
    });
  } catch (error) {
    console.error('Error in GET /api/copy-bank/[projectId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST - Generate Copy Bank from VPC data
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();
    const { projectId } = await params;

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse optional request body for segment key
    let segmentKey = 'default';
    try {
      const body = await request.json();
      if (body.segmentKey) {
        segmentKey = body.segmentKey;
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    // Fetch VPC data for this project
    const { data: vpc, error: vpcError } = await supabase
      .from('value_proposition_canvas')
      .select('*')
      .eq('project_id', projectId)
      .eq('segment_key', segmentKey)
      .single();

    if (vpcError && vpcError.code !== 'PGRST116') {
      console.error('Error fetching VPC:', vpcError);
      return NextResponse.json({ error: 'Failed to fetch VPC data' }, { status: 500 });
    }

    if (!vpc) {
      return NextResponse.json(
        {
          error: 'No VPC data found',
          message: 'Create a Value Proposition Canvas first before generating a Copy Bank.',
        },
        { status: 400 }
      );
    }

    // Build the prompt from VPC data
    const prompt = buildCopyBankPrompt(vpc, project.name);

    // Generate Copy Bank using structured output
    const startTime = Date.now();
    const { object: copyBankData, usage } = await generateObject({
      model: getAIModel(),
      schema: copyBankSchema,
      prompt,
    });

    const generationTime = Date.now() - startTime;

    // Calculate approximate cost (gpt-4o-mini: $0.15/1M input, $0.60/1M output)
    // Note: Usage properties vary by AI SDK version - use safe access
    const usageData = usage as { promptTokens?: number; completionTokens?: number } | undefined;
    const inputCost = ((usageData?.promptTokens || 0) / 1_000_000) * 0.15;
    const outputCost = ((usageData?.completionTokens || 0) / 1_000_000) * 0.6;
    const totalCost = (inputCost + outputCost).toFixed(4);

    // Check if Copy Bank already exists for this VPC version
    const { data: existingCopyBank } = await supabase
      .from('copy_banks')
      .select('id, vpc_version')
      .eq('project_id', projectId)
      .eq('segment_key', segmentKey)
      .order('vpc_version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = existingCopyBank ? existingCopyBank.vpc_version + 1 : 1;

    // Store the Copy Bank
    const { data: savedCopyBank, error: saveError } = await supabase
      .from('copy_banks')
      .insert({
        project_id: projectId,
        user_id: user.id,
        vpc_id: vpc.id,
        vpc_version: newVersion,
        segment_key: segmentKey,
        headlines: copyBankData.headlines,
        primary_texts: copyBankData.primary_texts,
        pains: copyBankData.pains,
        gains: copyBankData.gains,
        product: copyBankData.product,
        image_keywords: copyBankData.image_keywords,
        ctas: copyBankData.ctas,
        model_used: process.env.COPY_BANK_MODEL || 'gpt-4o-mini',
        prompt_version: 'v1',
        generation_cost: `$${totalCost}`,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving Copy Bank:', saveError);
      return NextResponse.json({ error: 'Failed to save Copy Bank' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: savedCopyBank,
      meta: {
        generationTimeMs: generationTime,
        tokensUsed: {
          prompt: usageData?.promptTokens || 0,
          completion: usageData?.completionTokens || 0,
        },
        cost: `$${totalCost}`,
        vpcVersion: newVersion,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/copy-bank/[projectId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildCopyBankPrompt(vpc: Record<string, unknown>, projectName: string): string {
  // Extract VPC data with safe defaults
  const jobs = (vpc.jobs as Array<{ functional?: string; emotional?: string; social?: string }>) || [];
  const pains = (vpc.pains as Array<{ description?: string; intensity?: number }>) || [];
  const gains = (vpc.gains as Array<{ description?: string; importance?: number }>) || [];
  const productsAndServices = (vpc.products_and_services as Array<{ text?: string }>) || [];
  const painRelievers = (vpc.pain_relievers as Array<{ painDescription?: string; relief?: string }>) || [];
  const gainCreators = (vpc.gain_creators as Array<{ gainDescription?: string; creator?: string }>) || [];
  const differentiators = (vpc.differentiators as Array<{ text?: string }>) || [];

  return `You are an expert advertising copywriter. Generate a Copy Bank for the following business:

PROJECT NAME: ${projectName}

VALUE PROPOSITION CANVAS DATA:

CUSTOMER PROFILE:
- Jobs to be Done:
${jobs.map((j, i) => `  ${i + 1}. Functional: ${j.functional || 'N/A'}, Emotional: ${j.emotional || 'N/A'}, Social: ${j.social || 'N/A'}`).join('\n') || '  (none specified)'}

- Customer Pains:
${pains.map((p, i) => `  ${i + 1}. ${p.description || 'N/A'}${p.intensity ? ` (intensity: ${p.intensity}/10)` : ''}`).join('\n') || '  (none specified)'}

- Customer Gains:
${gains.map((g, i) => `  ${i + 1}. ${g.description || 'N/A'}${g.importance ? ` (importance: ${g.importance}/10)` : ''}`).join('\n') || '  (none specified)'}

VALUE MAP:
- Products & Services:
${productsAndServices.map((p, i) => `  ${i + 1}. ${p.text || 'N/A'}`).join('\n') || '  (none specified)'}

- Pain Relievers:
${painRelievers.map((p, i) => `  ${i + 1}. Relieves "${p.painDescription || 'N/A'}" by: ${p.relief || 'N/A'}`).join('\n') || '  (none specified)'}

- Gain Creators:
${gainCreators.map((g, i) => `  ${i + 1}. Creates "${g.gainDescription || 'N/A'}" via: ${g.creator || 'N/A'}`).join('\n') || '  (none specified)'}

- Differentiators:
${differentiators.map((d, i) => `  ${i + 1}. ${d.text || 'N/A'}`).join('\n') || '  (none specified)'}

INSTRUCTIONS:
Generate advertising copy optimized for social media ads (Meta, Google, LinkedIn).
- Headlines must be under 40 characters
- Primary texts must be under 125 characters
- Focus on the most impactful pain points and gains
- Make CTAs action-oriented and compelling
- Image keywords should work well with Unsplash searches

Be specific and direct. Avoid generic marketing language.`;
}

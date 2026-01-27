/**
 * AI Image Generation API (Tier 4)
 *
 * POST: Generate custom images with DALL-E 3 when stock options are exhausted
 * Requires explicit cost approval (~$0.12 for 3 images)
 *
 * @story US-AP02
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

export interface GeneratedImage {
  id: string;
  url: string;
  revisedPrompt: string;
  style: string;
  aspectRatio: string;
  generatedAt: string;
}

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const generateRequestSchema = z.object({
  projectId: z.string().uuid(),
  description: z.string().min(10).max(500),
  style: z.enum(['modern', 'minimal', 'bold', 'playful']),
  includePeople: z.boolean(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']),
  costApproved: z.boolean(),
  count: z.number().min(1).max(4).default(3),
});

// ============================================================================
// COST CONSTANTS
// ============================================================================

const COST_PER_IMAGE = 0.04; // DALL-E 3 standard quality
const MAX_IMAGES = 4;

// ============================================================================
// ASPECT RATIO TO SIZE MAPPING
// ============================================================================

const ASPECT_TO_SIZE: Record<string, '1024x1024' | '1792x1024' | '1024x1792'> = {
  '1:1': '1024x1024',
  '16:9': '1792x1024',
  '9:16': '1024x1792',
};

// ============================================================================
// POST - Generate images with DALL-E 3
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = generateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { projectId, description, style, includePeople, aspectRatio, costApproved, count } =
      validationResult.data;

    // Verify cost approval
    if (!costApproved) {
      const estimatedCost = count * COST_PER_IMAGE;
      return NextResponse.json(
        {
          error: 'Cost approval required',
          costEstimate: {
            perImage: COST_PER_IMAGE,
            total: estimatedCost,
            count,
            currency: 'USD',
          },
          message: `This will cost approximately $${estimatedCost.toFixed(2)}. Set costApproved: true to proceed.`,
        },
        { status: 402 }
      );
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

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI image generation is not configured' },
        { status: 503 }
      );
    }

    // Build the prompt
    const prompt = buildImagePrompt(description, style, includePeople, project.name);

    // Generate images with DALL-E 3
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    });

    const generatedImages: GeneratedImage[] = [];
    const size = ASPECT_TO_SIZE[aspectRatio];

    // DALL-E 3 generates one image per request, so we need to make multiple calls
    for (let i = 0; i < count; i++) {
      try {
        // Add variation to prompt for different results
        const variedPrompt = i === 0 ? prompt : `${prompt} (variation ${i + 1})`;

        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: variedPrompt,
            n: 1,
            size,
            quality: 'standard',
            response_format: 'url',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`[DALL-E] Generation ${i + 1} failed:`, errorData);
          continue;
        }

        const data = await response.json();
        const imageData = data.data[0];

        generatedImages.push({
          id: `generated-${Date.now()}-${i}`,
          url: imageData.url,
          revisedPrompt: imageData.revised_prompt || variedPrompt,
          style,
          aspectRatio,
          generatedAt: new Date().toISOString(),
        });
      } catch (genError) {
        console.error(`[DALL-E] Generation ${i + 1} error:`, genError);
      }
    }

    if (generatedImages.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any images' },
        { status: 500 }
      );
    }

    // Calculate actual cost
    const actualCost = generatedImages.length * COST_PER_IMAGE;

    return NextResponse.json({
      success: true,
      data: {
        tier: 4,
        images: generatedImages,
        prompt,
        style,
        aspectRatio,
        totalGenerated: generatedImages.length,
        cost: {
          perImage: COST_PER_IMAGE,
          total: actualCost,
          currency: 'USD',
        },
      },
    });
  } catch (error) {
    console.error('Error in POST /api/ads/images/generate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildImagePrompt(
  description: string,
  style: string,
  includePeople: boolean,
  projectName: string
): string {
  const styleDescriptions: Record<string, string> = {
    modern: 'modern, clean, minimalist design with contemporary aesthetics',
    minimal: 'ultra-minimal, lots of white space, simple and elegant',
    bold: 'bold colors, high contrast, striking visual impact',
    playful: 'playful, creative, whimsical with fun elements',
  };

  const peopleInstruction = includePeople
    ? 'Include diverse, professional-looking people in the scene.'
    : 'Do not include any people. Focus on objects, spaces, or abstract elements.';

  return `Create a high-quality advertising image for a business called "${projectName}".

Description: ${description}

Style: ${styleDescriptions[style]}

${peopleInstruction}

Requirements:
- Professional quality suitable for social media advertising
- Clean, uncluttered composition
- No text or logos in the image
- Appropriate for business/professional context
- High visual appeal for marketing purposes`;
}

// ============================================================================
// GET - Cost estimate without generating
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countParam = searchParams.get('count');
  const count = countParam ? Math.min(parseInt(countParam, 10), MAX_IMAGES) : 3;

  return NextResponse.json({
    success: true,
    data: {
      costEstimate: {
        perImage: COST_PER_IMAGE,
        total: count * COST_PER_IMAGE,
        count,
        currency: 'USD',
        model: 'dall-e-3',
        quality: 'standard',
      },
      availableStyles: ['modern', 'minimal', 'bold', 'playful'],
      availableAspectRatios: ['1:1', '16:9', '9:16'],
      maxImages: MAX_IMAGES,
    },
  });
}

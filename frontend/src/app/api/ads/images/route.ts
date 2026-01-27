/**
 * Ad Images API Routes
 *
 * Tiered image selection for ad creatives:
 * - GET: Tier 1 - Search Unsplash with Copy Bank keywords (free)
 * - POST: Tier 2 - Refined search with structured feedback (free)
 * - PUT: Tier 3 - Reference-based search with image upload (~$0.01)
 * - POST /generate: Tier 4 - AI generation with DALL-E 3 (~$0.12)
 *
 * @story US-AP02
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

export interface UnsplashImage {
  id: string;
  url: string;
  thumbUrl: string;
  altDescription: string;
  photographer: string;
  photographerUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
}

export interface ImageSearchResult {
  tier: 1 | 2 | 3 | 4;
  images: UnsplashImage[];
  query: string;
  totalResults: number;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const tier2RefinementSchema = z.object({
  projectId: z.string().uuid(),
  originalKeywords: z.array(z.string()),
  feedback: z.object({
    whatsWrong: z.enum([
      'too_corporate',
      'too_casual',
      'wrong_demographic',
      'wrong_setting',
      'wrong_mood',
    ]).optional(),
    demographicPreference: z.enum(['young', 'middle', 'senior']).optional(),
    settingPreference: z.enum(['office', 'outdoor', 'home', 'abstract']).optional(),
    moodPreference: z.enum(['energetic', 'calm', 'serious', 'friendly']).optional(),
    stylePreference: z.enum(['modern', 'classic', 'bold', 'playful']).optional(),
    peoplePreference: z.enum(['yes', 'no', 'abstract_only']).optional(),
  }),
});

// ============================================================================
// FEEDBACK TO QUERY MAPPINGS
// ============================================================================

const FEEDBACK_MAPPINGS: Record<string, { remove: string[]; add: string[] }> = {
  too_corporate: {
    remove: ['business', 'corporate', 'suit', 'office', 'formal'],
    add: ['casual', 'startup', 'creative', 'relaxed', 'modern'],
  },
  too_casual: {
    remove: ['casual', 'fun', 'playful', 'relaxed'],
    add: ['professional', 'business', 'polished', 'corporate'],
  },
  wrong_demographic: {
    remove: [],
    add: [], // Handled by demographicPreference
  },
  wrong_setting: {
    remove: [],
    add: [], // Handled by settingPreference
  },
  wrong_mood: {
    remove: [],
    add: [], // Handled by moodPreference
  },
};

const DEMOGRAPHIC_KEYWORDS: Record<string, string[]> = {
  young: ['young', 'millennial', 'gen-z', 'youthful', 'energetic'],
  middle: ['professional', 'middle-aged', 'experienced', 'established'],
  senior: ['senior', 'mature', 'elderly', 'wisdom', 'retired'],
};

const SETTING_KEYWORDS: Record<string, string[]> = {
  office: ['office', 'workplace', 'desk', 'meeting', 'business'],
  outdoor: ['outdoor', 'nature', 'park', 'street', 'urban'],
  home: ['home', 'living room', 'cozy', 'domestic', 'comfortable'],
  abstract: ['abstract', 'minimal', 'geometric', 'pattern', 'texture'],
};

const MOOD_KEYWORDS: Record<string, string[]> = {
  energetic: ['energetic', 'dynamic', 'active', 'vibrant', 'excited'],
  calm: ['calm', 'peaceful', 'serene', 'relaxed', 'tranquil'],
  serious: ['serious', 'focused', 'determined', 'professional', 'intense'],
  friendly: ['friendly', 'happy', 'smiling', 'welcoming', 'warm'],
};

const STYLE_KEYWORDS: Record<string, string[]> = {
  modern: ['modern', 'contemporary', 'sleek', 'minimalist'],
  classic: ['classic', 'traditional', 'timeless', 'elegant'],
  bold: ['bold', 'vibrant', 'colorful', 'striking'],
  playful: ['playful', 'fun', 'creative', 'whimsical'],
};

// ============================================================================
// UNSPLASH API CLIENT
// ============================================================================

async function searchUnsplash(query: string, count: number = 12): Promise<UnsplashImage[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn('[Unsplash] No access key configured, returning placeholder images');
    return generatePlaceholderImages(count, query);
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error('[Unsplash] API error:', response.status, await response.text());
      return generatePlaceholderImages(count, query);
    }

    const data = await response.json();

    return data.results.map((photo: Record<string, unknown>) => ({
      id: photo.id as string,
      url: (photo.urls as Record<string, string>).regular,
      thumbUrl: (photo.urls as Record<string, string>).thumb,
      altDescription: (photo.alt_description as string) || query,
      photographer: (photo.user as Record<string, string>).name,
      photographerUrl: (photo.user as Record<string, Record<string, string>>).links.html,
      downloadUrl: (photo.links as Record<string, string>).download_location,
      width: photo.width as number,
      height: photo.height as number,
    }));
  } catch (error) {
    console.error('[Unsplash] Fetch error:', error);
    return generatePlaceholderImages(count, query);
  }
}

function generatePlaceholderImages(count: number, query: string): UnsplashImage[] {
  // Generate placeholder images for development/testing
  return Array.from({ length: count }, (_, i) => ({
    id: `placeholder-${i}`,
    url: `https://picsum.photos/seed/${query}-${i}/800/600`,
    thumbUrl: `https://picsum.photos/seed/${query}-${i}/200/150`,
    altDescription: `${query} placeholder ${i + 1}`,
    photographer: 'Placeholder',
    photographerUrl: 'https://picsum.photos',
    downloadUrl: `https://picsum.photos/seed/${query}-${i}/800/600`,
    width: 800,
    height: 600,
  }));
}

// ============================================================================
// GET - Tier 1: Initial Unsplash search with Copy Bank keywords
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the Copy Bank to get image keywords
    const { data: copyBank, error: copyBankError } = await supabase
      .from('copy_banks')
      .select('image_keywords')
      .eq('project_id', projectId)
      .order('vpc_version', { ascending: false })
      .limit(1)
      .single();

    if (copyBankError && copyBankError.code !== 'PGRST116') {
      console.error('Error fetching Copy Bank:', copyBankError);
      return NextResponse.json({ error: 'Failed to fetch Copy Bank' }, { status: 500 });
    }

    // Use Copy Bank keywords or fallback to generic search
    const keywords: string[] = copyBank?.image_keywords || ['business', 'technology', 'modern'];
    const query = keywords.slice(0, 3).join(' ');

    // Search Unsplash
    const images = await searchUnsplash(query, 12);

    return NextResponse.json({
      success: true,
      data: {
        tier: 1,
        images,
        query,
        keywords,
        totalResults: images.length,
      } as ImageSearchResult,
    });
  } catch (error) {
    console.error('Error in GET /api/ads/images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST - Tier 2: Refined search with structured feedback
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
    const validationResult = tier2RefinementSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { originalKeywords, feedback } = validationResult.data;

    // Build refined query based on feedback
    let refinedKeywords = [...originalKeywords];

    // Apply feedback mappings
    if (feedback.whatsWrong && FEEDBACK_MAPPINGS[feedback.whatsWrong]) {
      const mapping = FEEDBACK_MAPPINGS[feedback.whatsWrong];
      refinedKeywords = refinedKeywords.filter((k) => !mapping.remove.includes(k.toLowerCase()));
      refinedKeywords.push(...mapping.add);
    }

    // Add demographic keywords
    if (feedback.demographicPreference && DEMOGRAPHIC_KEYWORDS[feedback.demographicPreference]) {
      refinedKeywords.push(...DEMOGRAPHIC_KEYWORDS[feedback.demographicPreference].slice(0, 2));
    }

    // Add setting keywords
    if (feedback.settingPreference && SETTING_KEYWORDS[feedback.settingPreference]) {
      refinedKeywords.push(...SETTING_KEYWORDS[feedback.settingPreference].slice(0, 2));
    }

    // Add mood keywords
    if (feedback.moodPreference && MOOD_KEYWORDS[feedback.moodPreference]) {
      refinedKeywords.push(...MOOD_KEYWORDS[feedback.moodPreference].slice(0, 2));
    }

    // Add style keywords
    if (feedback.stylePreference && STYLE_KEYWORDS[feedback.stylePreference]) {
      refinedKeywords.push(...STYLE_KEYWORDS[feedback.stylePreference].slice(0, 2));
    }

    // Handle people preference
    if (feedback.peoplePreference === 'no') {
      refinedKeywords = refinedKeywords.filter(
        (k) => !['people', 'person', 'team', 'group'].includes(k.toLowerCase())
      );
      refinedKeywords.push('abstract', 'objects');
    } else if (feedback.peoplePreference === 'abstract_only') {
      refinedKeywords = ['abstract', 'minimal', 'geometric', 'texture'];
    }

    // Dedupe and limit
    refinedKeywords = [...new Set(refinedKeywords)].slice(0, 5);
    const query = refinedKeywords.join(' ');

    // Search Unsplash with refined query
    const images = await searchUnsplash(query, 12);

    return NextResponse.json({
      success: true,
      data: {
        tier: 2,
        images,
        query,
        refinedKeywords,
        originalKeywords,
        feedback,
        totalResults: images.length,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/ads/images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PUT - Tier 3: Reference-based search (placeholder - needs CLIP integration)
// ============================================================================

export async function PUT(request: NextRequest) {
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

    // For now, extract description from form data and search
    const formData = await request.formData();
    const description = formData.get('description') as string;

    if (!description) {
      return NextResponse.json(
        { error: 'Image description is required for reference search' },
        { status: 400 }
      );
    }

    // TODO: In future, add CLIP embedding for image similarity search
    // For now, use the description directly as search query
    const images = await searchUnsplash(description, 12);

    return NextResponse.json({
      success: true,
      data: {
        tier: 3,
        images,
        query: description,
        totalResults: images.length,
        note: 'Reference image upload with CLIP similarity search coming soon',
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/ads/images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

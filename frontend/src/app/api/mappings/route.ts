/**
 * Field Mappings API
 *
 * GET /api/mappings - List user's field mappings
 * POST /api/mappings - Create a new field mapping
 *
 * @story US-BI03
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createMappingSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  integrationType: z.enum([
    'notion',
    'google_drive',
    'airtable',
    'slack',
    'lark',
    'dropbox',
    'linear',
    'hubspot',
    'figma',
    'github',
  ]),
  sourceSchema: z.array(
    z.object({
      field: z.string(),
      type: z.string(),
      sample: z.unknown().optional(),
    })
  ),
  mappings: z.array(
    z.object({
      sourceField: z.string(),
      targetSection: z.enum(['vpc', 'bmc', 'evidence', 'project']),
      targetField: z.string(),
      transform: z.string().optional(),
    })
  ),
  unmappedFields: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const integrationType = searchParams.get('integrationType');

    // Build query
    let query = supabase
      .from('field_mappings')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (integrationType) {
      query = query.eq('integration_type', integrationType);
    }

    const { data: mappings, error: fetchError } = await query;

    if (fetchError) {
      console.error('[api/mappings] Error fetching mappings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch mappings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ mappings });
  } catch (error) {
    console.error('[api/mappings] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createMappingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If this is being set as default, unset any existing default
    if (data.isDefault) {
      await supabase
        .from('field_mappings')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('integration_type', data.integrationType)
        .eq('is_default', true);
    }

    // Create the mapping
    const { data: mapping, error: insertError } = await supabase
      .from('field_mappings')
      .insert({
        user_id: user.id,
        name: data.name,
        description: data.description,
        integration_type: data.integrationType,
        source_schema: data.sourceSchema,
        mappings: data.mappings,
        unmapped_fields: data.unmappedFields || [],
        is_default: data.isDefault || false,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'A mapping with this name already exists' },
          { status: 409 }
        );
      }
      console.error('[api/mappings] Error creating mapping:', insertError);
      return NextResponse.json(
        { error: 'Failed to create mapping' },
        { status: 500 }
      );
    }

    return NextResponse.json({ mapping }, { status: 201 });
  } catch (error) {
    console.error('[api/mappings] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

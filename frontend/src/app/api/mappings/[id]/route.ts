/**
 * Individual Field Mapping API
 *
 * GET /api/mappings/[id] - Get a specific mapping
 * PUT /api/mappings/[id] - Update a mapping
 * DELETE /api/mappings/[id] - Delete a mapping
 *
 * @story US-BI03
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateMappingSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  mappings: z
    .array(
      z.object({
        sourceField: z.string(),
        targetSection: z.enum(['vpc', 'bmc', 'evidence', 'project']),
        targetField: z.string(),
        transform: z.string().optional(),
      })
    )
    .optional(),
  unmappedFields: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch mapping
    const { data: mapping, error: fetchError } = await supabase
      .from('field_mappings')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !mapping) {
      return NextResponse.json(
        { error: 'Mapping not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ mapping });
  } catch (error) {
    console.error('[api/mappings/[id]] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
    const validation = updateMappingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // If this is being set as default, first get integration type
    if (updates.isDefault) {
      const { data: existing } = await supabase
        .from('field_mappings')
        .select('integration_type')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Unset any existing default
        await supabase
          .from('field_mappings')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('integration_type', existing.integration_type)
          .eq('is_default', true)
          .neq('id', id);
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.mappings !== undefined) updateData.mappings = updates.mappings;
    if (updates.unmappedFields !== undefined) updateData.unmapped_fields = updates.unmappedFields;
    if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;

    // Update mapping
    const { data: mapping, error: updateError } = await supabase
      .from('field_mappings')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'A mapping with this name already exists' },
          { status: 409 }
        );
      }
      console.error('[api/mappings/[id]] Error updating mapping:', updateError);
      return NextResponse.json(
        { error: 'Failed to update mapping' },
        { status: 500 }
      );
    }

    if (!mapping) {
      return NextResponse.json(
        { error: 'Mapping not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ mapping });
  } catch (error) {
    console.error('[api/mappings/[id]] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete mapping
    const { error: deleteError } = await supabase
      .from('field_mappings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[api/mappings/[id]] Error deleting mapping:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete mapping' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/mappings/[id]] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

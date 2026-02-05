/**
 * Evidence Package Access Tracking
 *
 * Tracks PH views of evidence packages with view duration,
 * access count, and engagement events.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :2218-2235
 */

import { createClient as createAdminClient } from '@/lib/supabase/admin';

/**
 * Record or update evidence package access for a portfolio holder.
 * Creates access row on first view, updates access_count and last_accessed_at on subsequent views.
 */
export async function trackPackageAccess(
  evidencePackageId: string,
  portfolioHolderId: string,
  connectionId?: string
): Promise<{ accessId: string; isFirstAccess: boolean }> {
  const supabase = createAdminClient();

  // Check for existing access record
  const { data: existing } = await supabase
    .from('evidence_package_access')
    .select('id, access_count')
    .eq('evidence_package_id', evidencePackageId)
    .eq('portfolio_holder_id', portfolioHolderId)
    .single();

  if (existing) {
    // Update existing access record
    await supabase
      .from('evidence_package_access')
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: (existing.access_count || 1) + 1,
      })
      .eq('id', existing.id);

    return { accessId: existing.id, isFirstAccess: false };
  }

  // Create new access record
  const { data: newAccess, error } = await supabase
    .from('evidence_package_access')
    .insert({
      evidence_package_id: evidencePackageId,
      portfolio_holder_id: portfolioHolderId,
      connection_id: connectionId,
      first_accessed_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      access_count: 1,
      view_duration_seconds: 0,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { accessId: newAccess!.id, isFirstAccess: true };
}

/**
 * Update view duration for an access record.
 * Called via client-side beacon on page unload.
 */
export async function updateViewDuration(
  accessId: string,
  durationSeconds: number
): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from('evidence_package_access')
    .update({
      view_duration_seconds: durationSeconds,
    })
    .eq('id', accessId);
}

/**
 * Track a package engagement event.
 * Events: tab_switch, slide_view, evidence_expand, pdf_download
 */
export async function trackEngagementEvent(
  accessId: string,
  eventType: 'tab_switch' | 'slide_view' | 'evidence_expand' | 'pdf_download',
  eventValue?: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from('package_engagement_events')
    .insert({
      access_id: accessId,
      event_type: eventType,
      event_value: eventValue || {},
    });
}

/**
 * Track a narrative funnel event.
 * Events: generate_started, generate_completed, edit_started, edit_saved,
 * export_started, export_completed, publish_started, publish_completed
 */
export async function trackNarrativeFunnelEvent(
  projectId: string,
  userId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from('narrative_funnel_events')
    .insert({
      project_id: projectId,
      user_id: userId,
      event_type: eventType,
      event_metadata: metadata || {},
    });
}

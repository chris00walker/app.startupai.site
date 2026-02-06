/**
 * Narrative Edit Page
 *
 * Slide-by-slide editor with side-by-side baseline comparison
 * and Supabase Realtime Guardian alignment updates.
 *
 * @story US-NL01
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { NarrativeEditor } from '@/components/narrative/NarrativeEditor';
import { NarrativeLoadingState } from '@/components/narrative/NarrativeLoadingState';
import { useNarrative } from '@/hooks/useNarrative';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { trackPageView, trackEvent } from '@/lib/analytics';
import type { AlignmentIssue } from '@/lib/narrative/types';

interface NarrativeEditData {
  id: string;
  narrative_data: Record<string, unknown>;
  baseline_narrative: Record<string, unknown>;
  is_edited: boolean;
  alignment_status: 'verified' | 'pending' | 'flagged';
  alignment_issues: AlignmentIssue[];
}

export default function NarrativeEditPage() {
  if (process.env.NEXT_PUBLIC_NARRATIVE_LAYER_ENABLED !== 'true') {
    notFound();
  }

  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const { narrative, isLoading: narrativeLoading } = useNarrative({ projectId });

  const [editData, setEditData] = useState<NarrativeEditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackPageView('Narrative Edit', { project_id: projectId });
  }, [projectId]);

  // Fetch full narrative data with baseline for editing
  useEffect(() => {
    if (!narrative?.id) return;

    async function fetchEditData() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/narrative/${narrative!.id}`);
        if (!response.ok) throw new Error('Failed to load narrative for editing');

        const data = await response.json();
        setEditData({
          id: data.id,
          narrative_data: data.narrative_data,
          baseline_narrative: data.baseline_narrative,
          is_edited: data.is_edited,
          alignment_status: data.alignment_status ?? 'verified',
          alignment_issues: data.alignment_issues ?? [],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEditData();
  }, [narrative?.id]);

  const handleSave = useCallback(async (edits: { field: string; new_value: string }[]) => {
    if (!narrative?.id) return;

    trackEvent('narrative_edit_saved', {
      project_id: projectId,
      fields_edited: edits.length,
      category: 'narrative',
    });

    const response = await fetch(`/api/narrative/${narrative.id}/edit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edits }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error?.message || 'Failed to save edits');
    }

    const result = await response.json();
    setEditData(prev => prev ? {
      ...prev,
      is_edited: result.is_edited,
      alignment_status: result.alignment_status,
    } : null);
  }, [narrative?.id, projectId]);

  const handleCancel = useCallback(() => {
    router.push(`/project/${projectId}/narrative`);
  }, [router, projectId]);

  if (narrativeLoading || isLoading) {
    return (
      <div className="space-y-6 p-6">
        <BackButton projectId={projectId} />
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error || !narrative || !editData) {
    return (
      <div className="space-y-6 p-6">
        <BackButton projectId={projectId} />
        <div className="text-center py-12 space-y-4">
          <p className="text-sm text-destructive">{error || 'Narrative not found'}</p>
          <Button variant="outline" onClick={() => router.push(`/project/${projectId}/narrative`)}>
            Back to Narrative
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <BackButton projectId={projectId} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Edit Narrative</h1>
        <p className="text-sm text-muted-foreground">
          Edit individual slides. Guardian will verify your changes against the evidence.
        </p>
      </div>

      <NarrativeEditor
        narrativeId={editData.id}
        content={narrative.content}
        baselineContent={editData.baseline_narrative as unknown as typeof narrative.content}
        isEdited={editData.is_edited}
        alignmentStatus={editData.alignment_status}
        alignmentIssues={editData.alignment_issues}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}

function BackButton({ projectId }: { projectId: string }) {
  return (
    <Link href={`/project/${projectId}/narrative`}>
      <Button variant="ghost" size="sm">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Narrative
      </Button>
    </Link>
  );
}

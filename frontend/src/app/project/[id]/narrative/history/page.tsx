/**
 * Narrative History Page
 *
 * Version timeline with field-by-field diff viewer.
 *
 * @story US-NL01
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { VersionTimeline } from '@/components/narrative/VersionTimeline';
import { VersionDiff } from '@/components/narrative/VersionDiff';
import { useNarrative } from '@/hooks/useNarrative';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { trackPageView } from '@/lib/analytics';

export default function NarrativeHistoryPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const { narrative, isLoading } = useNarrative({ projectId });
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  useEffect(() => {
    trackPageView('Narrative History', { project_id: projectId });
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <BackButton projectId={projectId} />
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  if (!narrative) {
    return (
      <div className="space-y-6 p-6">
        <BackButton projectId={projectId} />
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No narrative found for this project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <BackButton projectId={projectId} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Narrative History</h1>
        <p className="text-sm text-muted-foreground">
          Track how your pitch narrative has evolved with each generation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <VersionTimeline
          narrativeId={narrative.id}
          onSelectVersion={setSelectedVersion}
          selectedVersion={selectedVersion ?? undefined}
        />

        {/* Diff Viewer */}
        {selectedVersion !== null ? (
          <VersionDiff
            narrativeId={narrative.id}
            versionA={selectedVersion}
            versionB={selectedVersion + 1}
            onClose={() => setSelectedVersion(null)}
          />
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground text-center">
              Select a version from the timeline to view changes.
            </p>
          </div>
        )}
      </div>
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

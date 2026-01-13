/**
 * Project Analysis Page
 *
 * Full strategic analysis view including Value Proposition Canvas,
 * fit scores, validation outcomes, and next steps.
 *
 * Shows real-time progress when a validation run is active.
 */

'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { VPCReportViewer } from '@/components/vpc';
import { InnovationPhysicsPanel } from '@/components/signals';
import { ValidationProgressTimeline } from '@/components/validation/ValidationProgressTimeline';
import { useActiveValidationRun } from '@/hooks/useValidationProgress';
import { ArrowLeft, Download, Share2, FileText } from 'lucide-react';
import Link from 'next/link';
import { trackPageView } from '@/lib/analytics';

export default function ProjectAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  // Check for active validation run
  const { runId: activeRunId, isLoading: isCheckingRun } = useActiveValidationRun(projectId);

  // Track page view
  useEffect(() => {
    if (projectId) {
      trackPageView('Project Analysis', { project_id: projectId });
    }
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">
            Unable to load project analysis.
          </p>
          <Button onClick={() => router.push('/founder-dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show progress timeline when validation is running
  if (activeRunId && !isCheckingRun) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/founder-dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Validation in Progress</h1>
              <p className="text-sm text-muted-foreground">
                Your startup is being analyzed by our AI founders team
              </p>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <ValidationProgressTimeline
          runId={activeRunId}
          variant="inline"
          onHITLRequired={() => router.push('/approvals')}
          onComplete={() => {
            // Refresh the page to show results after completion
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/founder-dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Strategic Analysis</h1>
            <p className="text-sm text-muted-foreground">
              AI-generated value proposition and market fit analysis
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/project/${projectId}/report`}>
            <Button variant="default" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Full Report
            </Button>
          </Link>
          <Button variant="outline" size="sm" disabled>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Innovation Physics Signals - Compact view */}
      <InnovationPhysicsPanel
        projectId={projectId}
        variant="compact"
        showEvidence={false}
      />

      {/* VPC Report Viewer */}
      <VPCReportViewer
        projectId={projectId}
        variant="full"
        showFitScores={true}
        showMetadata={true}
      />
    </div>
  );
}

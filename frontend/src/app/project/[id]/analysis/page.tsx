/**
 * Project Analysis Page
 *
 * Full strategic analysis view including Value Proposition Canvas,
 * fit scores, validation outcomes, and next steps.
 *
 * Shows real-time progress when a validation run is active.
 *
 * @story US-F06, US-F08, US-F09, US-F10
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VPCReportViewer } from '@/components/vpc';
import { InnovationPhysicsPanel } from '@/components/signals';
import { ValidationProgressTimeline } from '@/components/validation/ValidationProgressTimeline';
import { useActiveValidationRun } from '@/hooks/useValidationProgress';
import { ArrowLeft, Download, Share2, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { trackPageView } from '@/lib/analytics';

const APPROVAL_BANNERS: Record<string, string> = {
  brief: "Brief approved! Starting VPC Discovery \u2014 5 AI crews are researching your market, competitors, and value proposition. ~15 minutes.",
  discovery_output: "Discovery approved! Starting Desirability validation \u2014 testing market demand with experiments.",
};

export default function ProjectAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params?.id as string;
  const approvedParam = searchParams?.get('approved');

  // Show post-approval banner once, then dismiss
  const [showApprovalBanner, setShowApprovalBanner] = useState(!!approvedParam);

  // Check for active validation run
  const {
    runId: activeRunId,
    isLoading: isCheckingRun,
    refresh: refreshActiveRun,
  } = useActiveValidationRun(projectId);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentRunId(activeRunId);
  }, [activeRunId]);

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
  const displayRunId = currentRunId;

  if (displayRunId && !isCheckingRun) {
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

        {/* Fix 6: Post-approval banner */}
        {showApprovalBanner && approvedParam && APPROVAL_BANNERS[approvedParam] && (
          <Alert className="border-green-300 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {APPROVAL_BANNERS[approvedParam]}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 text-green-600 hover:text-green-800"
                onClick={() => setShowApprovalBanner(false)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Timeline */}
        <ValidationProgressTimeline
          runId={displayRunId}
          variant="inline"
          onHITLRequired={() => router.push('/approvals')}
          onComplete={() => {
            // Refresh the page to show results after completion
            setCurrentRunId(null);
            refreshActiveRun();
            router.refresh();
          }}
          onRunRestarted={(nextRunId) => {
            setCurrentRunId(nextRunId);
            refreshActiveRun();
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

/**
 * Project Analysis Page
 *
 * Full strategic analysis view including Value Proposition Canvas,
 * fit scores, validation outcomes, and next steps.
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { VPCReportViewer } from '@/components/vpc';
import { InnovationPhysicsPanel } from '@/components/signals';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import Link from 'next/link';

export default function ProjectAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

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
          <Button variant="outline" size="sm" disabled>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
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

/**
 * Narrative Page
 *
 * Full narrative view for a project showing 10-slide preview,
 * generation/regeneration controls, export, and publish actions.
 *
 * @story US-NL01
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NarrativeEmptyState } from '@/components/narrative/NarrativeEmptyState';
import { NarrativePromptCard } from '@/components/narrative/NarrativePromptCard';
import { NarrativePreview } from '@/components/narrative/NarrativePreview';
import { NarrativeLoadingState } from '@/components/narrative/NarrativeLoadingState';
import { ExportDialog } from '@/components/narrative/ExportDialog';
import { PublishDialog } from '@/components/narrative/PublishDialog';
import { RegenerationDialog } from '@/components/narrative/RegenerationDialog';
import { ProvenanceBadge } from '@/components/narrative/ProvenanceBadge';
import { EvidencePackageViewer } from '@/components/evidence-package/EvidencePackageViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNarrative, useNarrativePrerequisites, useNarrativeExport } from '@/hooks/useNarrative';
import type { EvidencePackage, PitchNarrativeContent } from '@/lib/narrative/types';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Globe,
  Pencil,
  History,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { trackPageView, trackEvent } from '@/lib/analytics';
import { useEffect } from 'react';

export default function NarrativePage() {
  if (process.env.NEXT_PUBLIC_NARRATIVE_LAYER_ENABLED !== 'true') {
    notFound();
  }

  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const {
    narrative,
    isLoading,
    isGenerating,
    error,
    generate,
  } = useNarrative({ projectId });

  const {
    prerequisites,
    allMet,
    completedCount,
    total,
    isLoading: prereqsLoading,
  } = useNarrativePrerequisites(projectId);

  const { exportPdf, isExporting } = useNarrativeExport(narrative?.id);

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showRegenDialog, setShowRegenDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewPackage, setPreviewPackage] = useState<EvidencePackage | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    trackPageView('Narrative', { project_id: projectId });
  }, [projectId]);

  const handleGenerate = async () => {
    trackEvent('narrative_generate_started', {
      project_id: projectId,
      category: 'narrative',
    });
    await generate();
  };

  const handleRegenerate = async (preserveEdits: boolean) => {
    trackEvent('narrative_regenerate_started', {
      project_id: projectId,
      preserve_edits: preserveEdits,
      category: 'narrative',
    });
    await generate({ force_regenerate: true, preserve_edits: preserveEdits });
  };

  const handleExport = async (includeQrCode: boolean) => {
    trackEvent('narrative_export_started', {
      project_id: projectId,
      format: 'pdf',
      include_qr: includeQrCode,
      category: 'narrative',
    });
    return await exportPdf(includeQrCode);
  };

  const handlePublish = async (confirmation: {
    reviewed_slides: boolean;
    verified_traction: boolean;
    added_context: boolean;
    confirmed_ask: boolean;
  }) => {
    if (!narrative?.id) return;

    trackEvent('narrative_publish_started', {
      project_id: projectId,
      category: 'narrative',
    });

    const response = await fetch(`/api/narrative/${narrative.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hitl_confirmation: confirmation }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error?.message || 'Publish failed');
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setShowPreviewDialog(true);
    try {
      const res = await fetch(`/api/evidence-packages?project_id=${projectId}&primary=true`);
      if (res.ok) {
        const data = await res.json();
        const pkg = data.packages?.[0];
        if (pkg) {
          // Fetch the full package
          const pkgRes = await fetch(`/api/evidence-package/${pkg.id}`);
          if (pkgRes.ok) {
            setPreviewPackage(await pkgRes.json());
          }
        }
      }
    } catch {
      // Non-fatal — dialog will show empty state
    } finally {
      setPreviewLoading(false);
    }
  };

  // Loading state
  if (isLoading || prereqsLoading) {
    return (
      <div className="space-y-6 p-6">
        <BackButton />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Generation in progress
  if (isGenerating) {
    return (
      <div className="space-y-6 p-6">
        <BackButton />
        <NarrativeLoadingState />
      </div>
    );
  }

  // No narrative + prerequisites not met
  if (!narrative && !allMet) {
    return (
      <div className="space-y-6 p-6">
        <BackButton />
        <h1 className="text-2xl font-bold">Pitch Narrative</h1>
        <NarrativeEmptyState
          prerequisites={prerequisites}
          completedCount={completedCount}
          total={total}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </div>
    );
  }

  // No narrative + prerequisites met (first-run)
  if (!narrative && allMet) {
    return (
      <div className="space-y-6 p-6">
        <BackButton />
        <h1 className="text-2xl font-bold">Pitch Narrative</h1>
        <NarrativePromptCard
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 p-6">
        <BackButton />
        <div className="text-center py-12 space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => generate()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Narrative exists - full view
  return (
    <div className="space-y-6 p-6">
      <BackButton />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Pitch Narrative</h1>
          {narrative?.content.cover && (
            <p className="text-muted-foreground">{narrative.content.cover.venture_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ProvenanceBadge type="ai_generated" />
          <Button variant="outline" size="sm" onClick={() => router.push(`/project/${projectId}/narrative/edit`)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/project/${projectId}/narrative/history`)}>
            <History className="h-3.5 w-3.5 mr-1.5" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowRegenDialog(true)}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Regenerate
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Preview as PH
          </Button>
          <Button size="sm" onClick={() => setShowPublishDialog(true)}>
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            Publish
          </Button>
        </div>
      </div>

      {/* 10-Slide Preview */}
      {narrative?.content && (
        <NarrativePreview content={narrative.content} />
      )}

      {/* Dialogs */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        isExporting={isExporting}
      />
      <PublishDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        onPublish={handlePublish}
      />
      <RegenerationDialog
        open={showRegenDialog}
        onOpenChange={setShowRegenDialog}
        onRegenerate={handleRegenerate}
      />
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview as Portfolio Holder
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              This is how your evidence package appears to investors.
            </p>
          </DialogHeader>
          {previewLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading preview...
            </div>
          ) : previewPackage ? (
            <EvidencePackageViewer package_data={previewPackage} />
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No evidence package found. Generate a narrative first to create one.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BackButton() {
  return (
    <Link href="/founder-dashboard">
      <Button variant="ghost" size="sm">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
    </Link>
  );
}

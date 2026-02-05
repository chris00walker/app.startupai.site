/**
 * Narrative Dashboard Card
 *
 * Summary card for the founder dashboard showing narrative status,
 * tagline preview, and quick actions.
 *
 * @story US-NL01
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Sparkles,
  Download,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { STALENESS_COPY, ALIGNMENT_STATUS_COPY } from '@/lib/constants/narrative';
import type { PitchNarrative } from '@/lib/narrative/types';

interface NarrativeDashboardCardProps {
  narrative: PitchNarrative | null;
  isStale?: boolean;
  staleSeverity?: 'soft' | 'hard' | null;
  isPublished?: boolean;
  alignmentStatus?: 'verified' | 'pending' | 'flagged';
  onView?: () => void;
  onRegenerate?: () => void;
  onExport?: () => void;
}

export function NarrativeDashboardCard({
  narrative,
  isStale,
  staleSeverity,
  isPublished,
  alignmentStatus = 'verified',
  onView,
  onRegenerate,
  onExport,
}: NarrativeDashboardCardProps) {
  if (!narrative) return null;

  const tagline = narrative.content.cover?.tagline;
  const ventureName = narrative.content.cover?.venture_name;
  const fitScore = narrative.content.metadata?.overall_fit_score;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Pitch Narrative</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {/* Publication status */}
            {isPublished ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                Published
              </Badge>
            ) : (
              <Badge variant="outline">Draft</Badge>
            )}

            {/* Staleness indicator */}
            {isStale && staleSeverity && (
              <Badge
                variant={staleSeverity === 'hard' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {STALENESS_COPY[staleSeverity].badge}
              </Badge>
            )}

            {/* Alignment status */}
            {alignmentStatus === 'flagged' && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {ALIGNMENT_STATUS_COPY.flagged.badge}
              </Badge>
            )}
            {alignmentStatus === 'pending' && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {ALIGNMENT_STATUS_COPY.pending.badge}
              </Badge>
            )}
            {alignmentStatus === 'verified' && !isStale && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                {ALIGNMENT_STATUS_COPY.verified.badge}
              </Badge>
            )}
          </div>
        </div>
        {ventureName && (
          <CardDescription>{ventureName}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tagline preview */}
        {tagline && (
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm font-medium italic">&ldquo;{tagline}&rdquo;</p>
          </div>
        )}

        {/* Fit score */}
        {fitScore !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Fit Score:</span>
            <span className="text-sm font-bold">{(fitScore * 100).toFixed(0)}%</span>
          </div>
        )}

        {/* Staleness warning */}
        {isStale && staleSeverity && (
          <div className={`p-3 rounded-lg text-sm ${
            staleSeverity === 'hard'
              ? 'bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-300'
              : 'bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300'
          }`}>
            <p>{STALENESS_COPY[staleSeverity].description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onView}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Regenerate
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

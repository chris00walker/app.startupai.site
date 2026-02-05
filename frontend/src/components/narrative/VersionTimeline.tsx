/**
 * Version Timeline
 *
 * Displays narrative version history as a vertical timeline
 * with fit score trajectory and trigger reasons.
 *
 * @story US-NL01
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  History,
  GitCommit,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Eye,
} from 'lucide-react';
import type { VersionListResponse } from '@/lib/narrative/types';

interface VersionTimelineProps {
  narrativeId: string;
  onSelectVersion?: (versionNumber: number) => void;
  selectedVersion?: number;
}

function triggerReasonLabel(reason: string | null): string {
  switch (reason) {
    case 'initial_generation': return 'Initial generation';
    case 'regeneration': return 'Regenerated';
    case 'evidence_update': return 'Evidence updated';
    case 'manual_regeneration': return 'Manual regeneration';
    default: return reason || 'Unknown';
  }
}

function triggerReasonVariant(reason: string | null): 'default' | 'secondary' | 'outline' {
  switch (reason) {
    case 'initial_generation': return 'default';
    case 'regeneration': return 'secondary';
    default: return 'outline';
  }
}

function FitScoreTrend({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null) return null;
  if (previous === null) {
    return <span className="text-sm font-medium">{((current) * 100).toFixed(0)}%</span>;
  }

  const delta = current - previous;
  if (Math.abs(delta) < 0.01) {
    return (
      <span className="flex items-center gap-1 text-sm text-muted-foreground">
        <Minus className="h-3 w-3" />
        {(current * 100).toFixed(0)}%
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1 text-sm ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
      {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {(current * 100).toFixed(0)}%
      <span className="text-xs text-muted-foreground">
        ({delta > 0 ? '+' : ''}{(delta * 100).toFixed(1)})
      </span>
    </span>
  );
}

export function VersionTimeline({
  narrativeId,
  onSelectVersion,
  selectedVersion,
}: VersionTimelineProps) {
  const [data, setData] = useState<VersionListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVersions() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/narrative/${narrativeId}/versions`);
        if (!response.ok) throw new Error('Failed to load versions');
        const result = await response.json() as VersionListResponse;
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    }

    fetchVersions();
  }, [narrativeId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">{error || 'No version data'}</p>
        </CardContent>
      </Card>
    );
  }

  const { versions } = data;

  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No versions recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Version History
          <Badge variant="secondary" className="text-xs ml-auto">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {versions.map((version, index) => {
              const prevVersion = index < versions.length - 1 ? versions[index + 1] : null;
              const isSelected = selectedVersion === version.version_number;
              const isCurrent = version.version_number === data.current_version;

              return (
                <div
                  key={version.version_number}
                  className={`relative pl-8 ${isSelected ? 'bg-blue-50 dark:bg-blue-950/20 -mx-4 px-12 py-2 rounded-lg' : ''}`}
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 ${
                    isCurrent
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-background border-muted-foreground/30'
                  }`} />

                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          v{version.version_number}
                        </span>
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                        <Badge variant={triggerReasonVariant(version.trigger_reason)} className="text-xs">
                          {triggerReasonLabel(version.trigger_reason)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(version.created_at).toLocaleDateString()}</span>
                        <span>{new Date(version.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {version.fit_score_at_version !== null && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">Fit Score:</span>
                          <FitScoreTrend
                            current={version.fit_score_at_version}
                            previous={prevVersion?.fit_score_at_version ?? null}
                          />
                        </div>
                      )}
                    </div>

                    {onSelectVersion && !isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => onSelectVersion(version.version_number)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View Diff
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

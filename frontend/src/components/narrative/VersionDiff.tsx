/**
 * Version Diff
 *
 * Field-by-field comparison between two narrative versions.
 * Shows old/new values with visual highlighting.
 *
 * @story US-NL01
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitCompare, Loader2, X } from 'lucide-react';
import { SLIDE_LABELS } from '@/lib/constants/narrative';
import type { VersionDiffResponse } from '@/lib/narrative/types';

interface VersionDiffProps {
  narrativeId: string;
  versionA: number;
  versionB: number;
  onClose?: () => void;
}

function parseFieldPath(field: string): { slide: string; fieldName: string } {
  const parts = field.split('.');
  const slide = parts[0];
  const fieldName = parts.slice(1).join('.');
  return { slide, fieldName };
}

function formatFieldLabel(field: string): string {
  return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? v : JSON.stringify(v)).join(', ');
  return JSON.stringify(value, null, 2);
}

export function VersionDiff({
  narrativeId,
  versionA,
  versionB,
  onClose,
}: VersionDiffProps) {
  const [data, setData] = useState<VersionDiffResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDiff() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/narrative/${narrativeId}/versions/${versionA}/diff?compare_to=${versionB}`
        );
        if (!response.ok) throw new Error('Failed to load diff');
        const result = await response.json() as VersionDiffResponse;
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDiff();
  }, [narrativeId, versionA, versionB]);

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
          <p className="text-sm text-destructive">{error || 'No diff data'}</p>
        </CardContent>
      </Card>
    );
  }

  // Group diffs by slide
  const groupedDiffs = new Map<string, typeof data.diffs>();
  for (const diff of data.diffs) {
    const { slide } = parseFieldPath(diff.field);
    const existing = groupedDiffs.get(slide) || [];
    existing.push(diff);
    groupedDiffs.set(slide, existing);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Changes: v{data.version_a} &rarr; v{data.version_b}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {data.diffs.length} change{data.diffs.length !== 1 ? 's' : ''}
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.diffs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No differences between these versions.
          </p>
        ) : (
          Array.from(groupedDiffs.entries()).map(([slide, diffs]) => (
            <div key={slide} className="space-y-3">
              <h3 className="text-sm font-semibold border-b pb-1">
                {SLIDE_LABELS[slide] || formatFieldLabel(slide)}
              </h3>
              <div className="space-y-3">
                {diffs.map((diff, index) => {
                  const { fieldName } = parseFieldPath(diff.field);
                  const oldText = formatValue(diff.old_value);
                  const newText = formatValue(diff.new_value);

                  return (
                    <div key={index} className="rounded-lg border overflow-hidden">
                      <div className="px-3 py-1.5 bg-muted border-b">
                        <span className="text-xs font-medium">
                          {formatFieldLabel(fieldName)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 divide-x">
                        <div className="p-3 bg-red-50/50 dark:bg-red-950/10">
                          <p className="text-xs text-muted-foreground mb-1">v{data.version_a}</p>
                          <p className="text-sm whitespace-pre-wrap">{oldText}</p>
                        </div>
                        <div className="p-3 bg-green-50/50 dark:bg-green-950/10">
                          <p className="text-xs text-muted-foreground mb-1">v{data.version_b}</p>
                          <p className="text-sm whitespace-pre-wrap">{newText}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

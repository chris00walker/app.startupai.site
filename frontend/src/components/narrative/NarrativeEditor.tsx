/**
 * Narrative Editor
 *
 * Side-by-side baseline/edit view with per-slide editing.
 * Subscribes to Supabase Realtime for alignment_status updates.
 *
 * @story US-NL01
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProvenanceBadge } from './ProvenanceBadge';
import {
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SLIDE_ORDER, SLIDE_LABELS, SLIDE_DESCRIPTIONS } from '@/lib/constants/narrative';
import { ALIGNMENT_STATUS_COPY } from '@/lib/constants/narrative';
import { createClient } from '@/lib/supabase/client';
import type { PitchNarrativeContent, AlignmentIssue } from '@/lib/narrative/types';
import type { SlideKey } from '@/lib/narrative/types';

interface NarrativeEditorProps {
  narrativeId: string;
  content: PitchNarrativeContent;
  baselineContent?: PitchNarrativeContent;
  isEdited?: boolean;
  alignmentStatus: 'verified' | 'pending' | 'flagged';
  alignmentIssues?: AlignmentIssue[];
  onSave: (edits: { field: string; new_value: string }[]) => Promise<void>;
  onCancel: () => void;
}

// Get editable text fields from a slide
function getEditableFields(slideKey: SlideKey, content: PitchNarrativeContent): { path: string; label: string; value: string }[] {
  const slide = content[slideKey as keyof PitchNarrativeContent];
  if (!slide || typeof slide !== 'object') return [];

  const fields: { path: string; label: string; value: string }[] = [];

  const entries = Object.entries(slide as Record<string, unknown>);
  for (const [key, value] of entries) {
    if (typeof value === 'string' && value.length > 0) {
      fields.push({
        path: `${slideKey}.${key}`,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
      });
    }
  }

  return fields;
}

function AlignmentStatusBanner({ status, issues }: { status: string; issues?: AlignmentIssue[] }) {
  const copy = ALIGNMENT_STATUS_COPY[status as keyof typeof ALIGNMENT_STATUS_COPY];
  if (!copy) return null;

  return (
    <div className={`p-3 rounded-lg flex items-start gap-3 ${
      status === 'verified' ? 'bg-green-50 dark:bg-green-950/20' :
      status === 'pending' ? 'bg-blue-50 dark:bg-blue-950/20' :
      'bg-red-50 dark:bg-red-950/20'
    }`}>
      {status === 'verified' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />}
      {status === 'pending' && <Clock className="h-5 w-5 text-blue-500 mt-0.5 shrink-0 animate-pulse" />}
      {status === 'flagged' && <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />}
      <div>
        <p className="text-sm font-medium">{copy.badge}</p>
        <p className="text-xs text-muted-foreground">{copy.description}</p>
        {issues && issues.length > 0 && (
          <div className="mt-2 space-y-1">
            {issues.map((issue, i) => (
              <div key={i} className="text-xs p-2 rounded bg-background border">
                <p className="font-medium">{issue.field}</p>
                <p className="text-muted-foreground mt-0.5">{issue.issue}</p>
                {issue.suggested_language && (
                  <p className="text-green-700 dark:text-green-400 mt-0.5">
                    Suggested: {issue.suggested_language}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function NarrativeEditor({
  narrativeId,
  content,
  baselineContent,
  isEdited,
  alignmentStatus: initialAlignmentStatus,
  alignmentIssues: initialIssues,
  onSave,
  onCancel,
}: NarrativeEditorProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [editedValues, setEditedValues] = useState<Map<string, string>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [alignmentStatus, setAlignmentStatus] = useState(initialAlignmentStatus);
  const [alignmentIssues, setAlignmentIssues] = useState(initialIssues);

  const currentSlideKey = SLIDE_ORDER[currentSlideIndex] as SlideKey;
  const currentLabel = SLIDE_LABELS[currentSlideKey];
  const currentDescription = SLIDE_DESCRIPTIONS[currentSlideKey];
  const fields = getEditableFields(currentSlideKey, content);

  // Supabase Realtime subscription for alignment_status changes
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`narrative-alignment-${narrativeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pitch_narratives',
          filter: `id=eq.${narrativeId}`,
        },
        (payload) => {
          const newRecord = payload.new as {
            alignment_status?: string;
            alignment_issues?: AlignmentIssue[];
          };
          if (newRecord.alignment_status) {
            setAlignmentStatus(newRecord.alignment_status as 'verified' | 'pending' | 'flagged');
          }
          if (newRecord.alignment_issues) {
            setAlignmentIssues(newRecord.alignment_issues);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [narrativeId]);

  const handleFieldChange = useCallback((path: string, value: string) => {
    setEditedValues(prev => {
      const next = new Map(prev);
      next.set(path, value);
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (editedValues.size === 0) return;

    setIsSaving(true);
    try {
      const edits = Array.from(editedValues.entries()).map(([field, new_value]) => ({
        field,
        new_value,
      }));
      await onSave(edits);
      setEditedValues(new Map());
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = editedValues.size > 0;

  return (
    <div className="space-y-4">
      {/* Alignment Status Banner */}
      <AlignmentStatusBanner status={alignmentStatus} issues={alignmentIssues} />

      {/* Slide Navigator */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
          disabled={currentSlideIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="text-center">
          <p className="text-sm font-medium">{currentLabel}</p>
          <p className="text-xs text-muted-foreground">
            Slide {currentSlideIndex + 1} of {SLIDE_ORDER.length}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentSlideIndex(Math.min(SLIDE_ORDER.length - 1, currentSlideIndex + 1))}
          disabled={currentSlideIndex === SLIDE_ORDER.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Editor Content */}
      <Tabs defaultValue="edit">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="compare">Compare with Baseline</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{currentLabel}</CardTitle>
                <div className="flex gap-2">
                  {isEdited && <ProvenanceBadge type="founder_edited" />}
                  {!isEdited && <ProvenanceBadge type="ai_generated" />}
                </div>
              </div>
              {currentDescription && (
                <p className="text-xs text-muted-foreground">{currentDescription}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No editable text fields on this slide.
                </p>
              ) : (
                fields.map(({ path, label, value }) => {
                  const editedValue = editedValues.get(path);
                  const displayValue = editedValue ?? value;
                  const isChanged = editedValue !== undefined && editedValue !== value;

                  return (
                    <div key={path} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">{label}</label>
                        {isChanged && (
                          <Badge variant="outline" className="text-xs">Modified</Badge>
                        )}
                      </div>
                      <Textarea
                        value={displayValue}
                        onChange={(e) => handleFieldChange(path, e.target.value)}
                        rows={displayValue.length > 200 ? 6 : 3}
                        className={isChanged ? 'border-blue-500' : ''}
                      />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Baseline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Baseline (AI-Generated)</CardTitle>
              </CardHeader>
              <CardContent>
                {baselineContent ? (
                  getEditableFields(currentSlideKey, baselineContent).map(({ path, label, value }) => (
                    <div key={path} className="space-y-1 mb-4">
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      <p className="text-sm bg-muted p-2 rounded">{value}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No baseline available.</p>
                )}
              </CardContent>
            </Card>

            {/* Current */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Current (With Edits)</CardTitle>
              </CardHeader>
              <CardContent>
                {fields.map(({ path, label, value }) => {
                  const editedValue = editedValues.get(path);
                  const displayValue = editedValue ?? value;
                  const isChanged = editedValue !== undefined && editedValue !== value;

                  return (
                    <div key={path} className="space-y-1 mb-4">
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      <p className={`text-sm p-2 rounded ${isChanged ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200' : 'bg-muted'}`}>
                        {displayValue}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <div className="flex gap-2">
          {hasChanges && (
            <p className="text-sm text-muted-foreground self-center">
              {editedValues.size} field{editedValues.size !== 1 ? 's' : ''} modified
            </p>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Edits
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

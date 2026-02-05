/**
 * Narrative Empty State
 *
 * Shows prerequisite checklist and progress toward narrative generation.
 * Displayed when no narrative exists yet.
 *
 * @story US-NL01
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, FileText, Sparkles } from 'lucide-react';
import { EMPTY_STATE_COPY, PREREQUISITE_LABELS, PREREQUISITE_HELP } from '@/lib/constants/narrative';

interface NarrativeEmptyStateProps {
  prerequisites: {
    project: boolean;
    hypothesis: boolean;
    customer_profile: boolean;
    vpc: boolean;
  };
  completedCount: number;
  total: number;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

const PREREQ_ORDER = ['project', 'hypothesis', 'customer_profile', 'vpc'] as const;

export function NarrativeEmptyState({
  prerequisites,
  completedCount,
  total,
  onGenerate,
  isGenerating,
}: NarrativeEmptyStateProps) {
  const allMet = completedCount === total;
  const progress = (completedCount / total) * 100;

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 p-3 rounded-full bg-muted w-fit">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>{EMPTY_STATE_COPY.title}</CardTitle>
        <CardDescription className="max-w-md mx-auto">
          {EMPTY_STATE_COPY.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prerequisites</span>
            <span className="font-medium">{completedCount}/{total} complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {PREREQ_ORDER.map((key) => {
            const met = prerequisites[key];
            return (
              <div key={key} className="flex items-start gap-3">
                {met ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${met ? 'text-foreground line-through opacity-60' : 'text-foreground'}`}>
                    {PREREQUISITE_LABELS[key]}
                  </p>
                  {!met && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {PREREQUISITE_HELP[key]}
                    </p>
                  )}
                </div>
                {met && (
                  <Badge variant="secondary" className="text-xs">Done</Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Generate CTA */}
        {allMet && (
          <div className="flex justify-center pt-2">
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : EMPTY_STATE_COPY.cta}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

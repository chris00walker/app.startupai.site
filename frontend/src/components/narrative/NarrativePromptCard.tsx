/**
 * Narrative First-Run Prompt Card
 *
 * Shown when prerequisites are met but no narrative has been generated yet.
 * Encourages the founder to generate their first pitch narrative.
 *
 * @story US-NL01
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock } from 'lucide-react';
import { FIRST_RUN_COPY } from '@/lib/constants/narrative';

interface NarrativePromptCardProps {
  onGenerate: () => void;
  isGenerating?: boolean;
}

export function NarrativePromptCard({ onGenerate, isGenerating }: NarrativePromptCardProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="flex items-center gap-6 py-6">
        <div className="shrink-0 p-4 rounded-xl bg-blue-100 dark:bg-blue-900/30">
          <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-semibold">{FIRST_RUN_COPY.title}</h3>
          <p className="text-sm text-muted-foreground">
            {FIRST_RUN_COPY.description}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{FIRST_RUN_COPY.subtitle}</span>
          </div>
        </div>
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          size="lg"
          className="shrink-0"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : FIRST_RUN_COPY.cta}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Narrative Loading State
 *
 * Progress indicator with cycling messages during narrative generation.
 * Shows branded animation with contextual status messages.
 *
 * @story US-NL01
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GENERATION_LOADING_MESSAGES } from '@/lib/constants/narrative';

export function NarrativeLoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev =>
        prev < GENERATION_LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const progress = ((messageIndex + 1) / GENERATION_LOADING_MESSAGES.length) * 100;

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 py-12">
        {/* Animated spinner */}
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-muted" />
          <div
            className="absolute inset-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
          />
        </div>

        {/* Status message */}
        <div className="text-center space-y-2">
          <p className="text-sm font-medium transition-opacity duration-300">
            {GENERATION_LOADING_MESSAGES[messageIndex]}
          </p>
          <p className="text-xs text-muted-foreground">
            Step {messageIndex + 1} of {GENERATION_LOADING_MESSAGES.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

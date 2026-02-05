/**
 * Narrative Preview
 *
 * 10-slide card grid showing the complete pitch narrative.
 * Used on the narrative page as the primary view.
 *
 * @story US-NL01
 */

'use client';

import { SLIDE_ORDER } from '@/lib/constants/narrative';
import { NarrativeSlideView } from './NarrativeSlideView';
import type { PitchNarrativeContent } from '@/lib/narrative/types';
import type { SlideKey } from '@/lib/narrative/types';

interface NarrativePreviewProps {
  content: PitchNarrativeContent;
  editedSlides?: Set<string>;
  alignmentStatus?: 'verified' | 'pending' | 'flagged';
}

export function NarrativePreview({
  content,
  editedSlides,
  alignmentStatus,
}: NarrativePreviewProps) {
  return (
    <div className="space-y-4">
      {SLIDE_ORDER.map((slideKey, index) => (
        <NarrativeSlideView
          key={slideKey}
          slideKey={slideKey as SlideKey}
          content={content}
          slideNumber={index}
          isEdited={editedSlides?.has(slideKey)}
          alignmentStatus={editedSlides?.has(slideKey) ? alignmentStatus : undefined}
        />
      ))}
    </div>
  );
}

/**
 * Narrative Slide View
 *
 * Renders an individual slide from the pitch narrative.
 * Used in both preview (read-only) and editor (editable) modes.
 *
 * @story US-NL01
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SLIDE_LABELS, SLIDE_DESCRIPTIONS } from '@/lib/constants/narrative';
import { EVIDENCE_CATEGORY_LABELS } from '@/lib/constants/narrative';
import type { PitchNarrativeContent, EvidenceItem } from '@/lib/narrative/types';
import type { SlideKey } from '@/lib/narrative/types';

interface NarrativeSlideViewProps {
  slideKey: SlideKey;
  content: PitchNarrativeContent;
  slideNumber: number;
  isEdited?: boolean;
  alignmentStatus?: 'verified' | 'pending' | 'flagged';
}

function EvidenceItemBadge({ item }: { item: EvidenceItem }) {
  const colorMap = {
    'DO-direct': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'DO-indirect': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'SAY': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  };

  return (
    <div className={`rounded-lg px-3 py-2 text-sm ${colorMap[item.type]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="outline" className="text-xs">
          {EVIDENCE_CATEGORY_LABELS[item.type]}
        </Badge>
        {item.source && (
          <span className="text-xs opacity-70">{item.source}</span>
        )}
      </div>
      <p>{item.description}</p>
    </div>
  );
}

function CoverSlide({ content }: { content: PitchNarrativeContent }) {
  const { cover } = content;
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2 py-8">
        <h2 className="text-3xl font-bold">{cover.venture_name}</h2>
        <p className="text-lg text-muted-foreground">{cover.tagline}</p>
        <Badge variant="outline">{cover.document_type}</Badge>
      </div>
      <div className="text-sm text-muted-foreground text-center">
        <p>{cover.contact.founder_name} &middot; {cover.contact.email}</p>
        {cover.contact.linkedin_url && (
          <p className="mt-1">{cover.contact.linkedin_url}</p>
        )}
      </div>
    </div>
  );
}

function OverviewSlide({ content }: { content: PitchNarrativeContent }) {
  const { overview } = content;
  return (
    <div className="space-y-4">
      <p className="text-base leading-relaxed">{overview.thesis}</p>
      <div className="p-3 rounded-lg bg-muted">
        <p className="text-sm font-medium">{overview.one_liner}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline">{overview.industry}</Badge>
        {overview.ask && (
          <Badge>${(overview.ask.amount / 1000).toFixed(0)}K {overview.ask.instrument}</Badge>
        )}
      </div>
      {overview.novel_insight && (
        <blockquote className="border-l-4 border-blue-500 pl-4 text-sm italic text-muted-foreground">
          {overview.novel_insight}
        </blockquote>
      )}
      {overview.key_metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {overview.key_metrics.map((m, i) => (
            <div key={i} className="p-3 rounded-lg border text-center">
              <p className="text-lg font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TractionSlide({ content }: { content: PitchNarrativeContent }) {
  const { traction } = content;
  return (
    <div className="space-y-4">
      <p className="text-sm">{traction.evidence_summary}</p>

      {/* DO-direct evidence (highest prominence) */}
      {traction.do_direct.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-green-700 dark:text-green-400">
            Direct Behavioral Evidence ({traction.do_direct.length})
          </h4>
          {traction.do_direct.map((item, i) => (
            <EvidenceItemBadge key={i} item={item} />
          ))}
        </div>
      )}

      {/* DO-indirect evidence */}
      {traction.do_indirect.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
            Indirect Behavioral Evidence ({traction.do_indirect.length})
          </h4>
          {traction.do_indirect.map((item, i) => (
            <EvidenceItemBadge key={i} item={item} />
          ))}
        </div>
      )}

      {/* SAY evidence (lowest prominence) */}
      {traction.say_evidence.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            Stated Evidence ({traction.say_evidence.length})
          </h4>
          {traction.say_evidence.map((item, i) => (
            <EvidenceItemBadge key={i} item={item} />
          ))}
        </div>
      )}

      {/* Metrics row */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{traction.interview_count} interviews</span>
        <span>{traction.experiment_count} experiments</span>
        <span>{Math.round(traction.hitl_completion_rate * 100)}% HITL completion</span>
      </div>
    </div>
  );
}

function ProblemSlide({ content }: { content: PitchNarrativeContent }) {
  const { problem } = content;
  return (
    <div className="space-y-4">
      <p className="text-base font-medium">{problem.primary_pain}</p>
      <p className="text-sm">{problem.pain_narrative}</p>
      {problem.customer_story && (
        <div className="p-4 rounded-lg bg-muted space-y-1">
          <p className="text-sm font-medium">{problem.customer_story.name}</p>
          <p className="text-xs text-muted-foreground">{problem.customer_story.context}</p>
          <p className="text-sm italic">&ldquo;{problem.customer_story.struggle}&rdquo;</p>
        </div>
      )}
      {problem.evidence_quotes.length > 0 && (
        <div className="space-y-2">
          {problem.evidence_quotes.map((q, i) => (
            <blockquote key={i} className="border-l-2 border-muted-foreground/30 pl-3 text-sm italic text-muted-foreground">
              &ldquo;{q}&rdquo;
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
}

function SolutionSlide({ content }: { content: PitchNarrativeContent }) {
  const { solution } = content;
  return (
    <div className="space-y-4">
      <p className="text-base font-medium">{solution.value_proposition}</p>
      <p className="text-sm">{solution.how_it_works}</p>
      <div className="p-3 rounded-lg border">
        <p className="text-sm font-medium">Key Differentiator</p>
        <p className="text-sm text-muted-foreground">{solution.key_differentiator}</p>
      </div>
      {solution.use_cases.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Use Cases</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {solution.use_cases.map((uc, i) => (
              <li key={i}>{uc}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function GenericSlide({ slideKey, content }: { slideKey: string; content: PitchNarrativeContent }) {
  const slideData = content[slideKey as keyof PitchNarrativeContent];
  if (!slideData || typeof slideData !== 'object') return null;

  // Render a simple key-value view for slides without custom renderers
  return (
    <div className="space-y-3">
      {Object.entries(slideData as Record<string, unknown>).map(([key, value]) => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'object' && !Array.isArray(value)) return null;

        return (
          <div key={key} className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground capitalize">
              {key.replace(/_/g, ' ')}
            </p>
            {typeof value === 'string' ? (
              <p className="text-sm">{value}</p>
            ) : typeof value === 'number' ? (
              <p className="text-sm font-medium">{value}</p>
            ) : Array.isArray(value) && value.every(v => typeof v === 'string') ? (
              <div className="flex flex-wrap gap-1">
                {(value as string[]).map((v, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function NarrativeSlideView({
  slideKey,
  content,
  slideNumber,
  isEdited,
  alignmentStatus,
}: NarrativeSlideViewProps) {
  const label = SLIDE_LABELS[slideKey] || slideKey;
  const description = SLIDE_DESCRIPTIONS[slideKey];

  const renderSlideContent = () => {
    switch (slideKey) {
      case 'cover': return <CoverSlide content={content} />;
      case 'overview': return <OverviewSlide content={content} />;
      case 'traction': return <TractionSlide content={content} />;
      case 'problem': return <ProblemSlide content={content} />;
      case 'solution': return <SolutionSlide content={content} />;
      default: return <GenericSlide slideKey={slideKey} content={content} />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {slideKey !== 'cover' && (
              <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full w-6 h-6 flex items-center justify-center">
                {slideNumber}
              </span>
            )}
            <CardTitle className="text-base">{label}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isEdited && (
              <Badge variant="outline" className="text-xs">Edited</Badge>
            )}
            {alignmentStatus === 'flagged' && (
              <Badge variant="destructive" className="text-xs">Review needed</Badge>
            )}
            {alignmentStatus === 'pending' && (
              <Badge variant="secondary" className="text-xs">Checking...</Badge>
            )}
          </div>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        {renderSlideContent()}
      </CardContent>
    </Card>
  );
}

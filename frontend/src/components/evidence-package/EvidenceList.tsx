/**
 * Evidence List
 *
 * Sorted DO/SAY evidence with visual hierarchy.
 * DO-direct evidence has highest visual prominence (green),
 * DO-indirect is secondary (blue), SAY is tertiary (amber).
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :4687-4701
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EVIDENCE_CATEGORY_LABELS, EVIDENCE_CATEGORY_DESCRIPTIONS, EVIDENCE_WEIGHTS } from '@/lib/constants/narrative';
import type { EvidenceItem } from '@/lib/narrative/types';

interface EvidenceListProps {
  doDirectItems: EvidenceItem[];
  doIndirectItems: EvidenceItem[];
  sayItems: EvidenceItem[];
  showWeights?: boolean;
  compact?: boolean;
}

const CATEGORY_STYLES = {
  'DO-direct': {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-300',
    badgeBg: 'bg-green-100 dark:bg-green-900/40',
    header: 'text-green-700 dark:text-green-400',
    icon: '●',
  },
  'DO-indirect': {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
    header: 'text-blue-700 dark:text-blue-400',
    icon: '◐',
  },
  'SAY': {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-300',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
    header: 'text-amber-700 dark:text-amber-400',
    icon: '○',
  },
} as const;

function EvidenceItemRow({
  item,
  showWeight,
  compact,
}: {
  item: EvidenceItem;
  showWeight: boolean;
  compact: boolean;
}) {
  const style = CATEGORY_STYLES[item.type];

  return (
    <div className={`rounded-lg px-3 py-2 ${style.bg} border ${style.border}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs ${style.text}`}>{style.icon}</span>
        <Badge variant="outline" className={`text-xs ${style.badgeBg} ${style.text} border-0`}>
          {EVIDENCE_CATEGORY_LABELS[item.type]}
        </Badge>
        {item.source && (
          <span className="text-xs opacity-60">{item.source}</span>
        )}
        {showWeight && (
          <span className="text-xs opacity-50 ml-auto">
            Weight: {EVIDENCE_WEIGHTS[item.type]}
          </span>
        )}
      </div>
      <p className={`text-sm ${style.text} ${compact ? 'line-clamp-2' : ''}`}>
        {item.description}
      </p>
      {item.metric_value && (
        <p className={`text-xs mt-1 font-medium ${style.text}`}>
          {item.metric_value}
        </p>
      )}
    </div>
  );
}

function EvidenceSection({
  title,
  items,
  type,
  showWeight,
  compact,
}: {
  title: string;
  items: EvidenceItem[];
  type: 'DO-direct' | 'DO-indirect' | 'SAY';
  showWeight: boolean;
  compact: boolean;
}) {
  const style = CATEGORY_STYLES[type];

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-xs ${style.text}`}>{style.icon}</span>
        <h4 className={`text-sm font-semibold ${style.header}`}>
          {title} ({items.length})
        </h4>
      </div>
      <p className="text-xs text-muted-foreground">
        {EVIDENCE_CATEGORY_DESCRIPTIONS[type]}
      </p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <EvidenceItemRow key={i} item={item} showWeight={showWeight} compact={compact} />
        ))}
      </div>
    </div>
  );
}

export function EvidenceList({
  doDirectItems,
  doIndirectItems,
  sayItems,
  showWeights = false,
  compact = false,
}: EvidenceListProps) {
  const totalCount = doDirectItems.length + doIndirectItems.length + sayItems.length;

  if (totalCount === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No evidence items collected yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Evidence Hierarchy</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {totalCount} item{totalCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Evidence is ranked by behavioral signal strength: direct actions carry the most weight.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* DO-direct: highest prominence */}
        <EvidenceSection
          title="Direct Behavioral Evidence"
          items={doDirectItems}
          type="DO-direct"
          showWeight={showWeights}
          compact={compact}
        />

        {/* DO-indirect: secondary */}
        <EvidenceSection
          title="Indirect Behavioral Evidence"
          items={doIndirectItems}
          type="DO-indirect"
          showWeight={showWeights}
          compact={compact}
        />

        {/* SAY: tertiary */}
        <EvidenceSection
          title="Stated Evidence"
          items={sayItems}
          type="SAY"
          showWeight={showWeights}
          compact={compact}
        />
      </CardContent>
    </Card>
  );
}

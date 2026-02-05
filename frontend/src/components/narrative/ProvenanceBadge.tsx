/**
 * Provenance Badge
 *
 * Visual badge indicating how narrative content was produced.
 * AI-generated / Founder-edited / Verified / Flagged
 *
 * @story US-NL01
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Bot, Pencil, CheckCircle, AlertTriangle } from 'lucide-react';

type ProvenanceType = 'ai_generated' | 'founder_edited' | 'verified' | 'flagged';

interface ProvenanceBadgeProps {
  type: ProvenanceType;
  className?: string;
}

const PROVENANCE_CONFIG: Record<ProvenanceType, {
  label: string;
  icon: typeof Bot;
  className: string;
}> = {
  ai_generated: {
    label: 'AI-Generated',
    icon: Bot,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  founder_edited: {
    label: 'Founder-Edited',
    icon: Pencil,
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
  verified: {
    label: 'Verified',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  flagged: {
    label: 'Review Needed',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
};

export function ProvenanceBadge({ type, className }: ProvenanceBadgeProps) {
  const config = PROVENANCE_CONFIG[type];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} ${className ?? ''} gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

/**
 * @story US-CP02
 */
'use client';

/**
 * VPC Canvas
 *
 * Main orchestrator component for the Strategyzer-style Value Proposition Canvas.
 * Combines:
 * - SVG background with geometric shapes (square + circle)
 * - Animated fit lines connecting pain↔reliever and gain↔creator pairs
 * - HTML content positioned over the SVG shapes
 * - Hover interactions for highlighting connected items
 *
 * Supports both read-only (view) and editable (edit) modes.
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Gift,
  TrendingUp,
  Pill,
  Smile,
  Frown,
  Briefcase,
  Heart,
  Users,
} from 'lucide-react';
import type { VPCCanvasProps, VPCItemType } from './types';
import {
  VPC_VIEWBOX,
  VPC_SQUARE,
  VPC_CIRCLE,
} from './types';
import { VPCSvgBackground } from './VPCSvgBackground';
import { VPCFitLines, VPCFitLinesLegend } from './VPCFitLines';
import { VPCHoverProvider, useVPCItemHover } from './VPCHoverContext';
import { useVPCConnections } from './hooks/useVPCConnections';

// ============================================================================
// ITEM CARD COMPONENT
// ============================================================================

interface ItemCardProps {
  itemId: string;
  itemType: VPCItemType;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper for items that enables hover interactions
 */
function ItemCard({ itemId, itemType, children, className }: ItemCardProps) {
  const { onMouseEnter, onMouseLeave, isHighlighted, isDimmed } = useVPCItemHover(
    itemId,
    itemType
  );

  return (
    <div
      className={cn(
        'transition-all duration-200',
        isHighlighted && 'ring-2 ring-primary ring-offset-1 scale-[1.02]',
        isDimmed && 'opacity-30',
        className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

// ============================================================================
// CONTENT SECTIONS
// ============================================================================

interface ContentSectionProps {
  segment: VPCCanvasProps['segment'];
  mode: VPCCanvasProps['mode'];
}

/**
 * Value Map content (left side - square)
 */
function ValueMapContent({ segment, mode }: ContentSectionProps) {
  const { valueMap } = segment;
  const painRelieversEntries = Object.entries(valueMap.painRelievers);
  const gainCreatorsEntries = Object.entries(valueMap.gainCreators);

  return (
    <div className="absolute left-[3.3%] top-[7%] w-[40%] h-[86%] flex flex-col">
      {/* Gain Creators Section - Top third */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-xs font-medium text-green-700">Gain Creators</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {gainCreatorsEntries.length}
          </Badge>
        </div>
        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100%-2rem)]">
          {gainCreatorsEntries.map(([gain, creator], i) => (
            <ItemCard
              key={`creator-${i}`}
              itemId={`creator-${i}`}
              itemType="creator"
              className="p-2 bg-green-50 border border-green-200 rounded-md text-xs"
            >
              <div className="text-green-600 text-[10px] mb-0.5 truncate">
                Creates: {gain}
              </div>
              <div className="text-green-900 line-clamp-2">{creator}</div>
            </ItemCard>
          ))}
          {gainCreatorsEntries.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No gain creators</p>
          )}
        </div>
      </div>

      {/* Products & Services Section - Middle third */}
      <div className="flex-1 p-3 border-t border-purple-200/50 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-medium text-purple-700">Products & Services</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {valueMap.productsAndServices.length}
          </Badge>
        </div>
        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100%-2rem)]">
          {valueMap.productsAndServices.map((item, i) => (
            <ItemCard
              key={`product-${i}`}
              itemId={`product-${i}`}
              itemType="product"
              className="p-2 bg-white border border-purple-200 rounded-md text-xs"
            >
              {item}
            </ItemCard>
          ))}
          {valueMap.productsAndServices.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No products/services</p>
          )}
        </div>
      </div>

      {/* Pain Relievers Section - Bottom third */}
      <div className="flex-1 p-3 border-t border-purple-200/50 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Pill className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">Pain Relievers</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {painRelieversEntries.length}
          </Badge>
        </div>
        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100%-2rem)]">
          {painRelieversEntries.map(([pain, relief], i) => (
            <ItemCard
              key={`reliever-${i}`}
              itemId={`reliever-${i}`}
              itemType="reliever"
              className="p-2 bg-blue-50 border border-blue-200 rounded-md text-xs"
            >
              <div className="text-blue-600 text-[10px] mb-0.5 truncate">
                Relieves: {pain}
              </div>
              <div className="text-blue-900 line-clamp-2">{relief}</div>
            </ItemCard>
          ))}
          {painRelieversEntries.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No pain relievers</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Customer Profile content (right side - circle)
 */
function CustomerProfileContent({ segment, mode }: ContentSectionProps) {
  const { customerProfile } = segment;

  return (
    <div className="absolute left-[50%] top-[7%] w-[46.7%] h-[86%] flex flex-col">
      {/* Gains Section - Top third */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Smile className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-700">Gains</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {customerProfile.gains.length}
          </Badge>
        </div>
        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100%-2rem)]">
          {customerProfile.gains
            .sort((a, b) => (b.importance || 0) - (a.importance || 0))
            .map((gain, i) => (
              <ItemCard
                key={`gain-${i}`}
                itemId={`gain-${i}`}
                itemType="gain"
                className={cn(
                  'p-2 border rounded-md text-xs',
                  gain.creator
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-white border-gray-200'
                )}
              >
                <div className="flex justify-between gap-2">
                  <span className="line-clamp-2">{gain.description}</span>
                  {gain.importance && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1 py-0 flex-shrink-0',
                        gain.importance >= 7
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : gain.importance >= 4
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                      )}
                    >
                      {gain.importance}/10
                    </Badge>
                  )}
                </div>
              </ItemCard>
            ))}
          {customerProfile.gains.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No gains defined</p>
          )}
        </div>
      </div>

      {/* Customer Jobs Section - Middle third */}
      <div className="flex-1 p-3 border-t border-teal-200/50 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">Customer Jobs</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {customerProfile.jobs.length}
          </Badge>
        </div>
        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100%-2rem)]">
          {customerProfile.jobs.map((job, i) => (
            <ItemCard
              key={`job-${i}`}
              itemId={`job-${i}`}
              itemType="job"
              className="p-2 bg-white border border-gray-200 rounded-md text-xs space-y-1"
            >
              {job.functional && (
                <div className="flex items-start gap-1.5">
                  <Briefcase className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{job.functional}</span>
                </div>
              )}
              {job.emotional && (
                <div className="flex items-start gap-1.5">
                  <Heart className="w-3 h-3 text-pink-500 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1 text-muted-foreground">{job.emotional}</span>
                </div>
              )}
              {job.social && (
                <div className="flex items-start gap-1.5">
                  <Users className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1 text-muted-foreground">{job.social}</span>
                </div>
              )}
            </ItemCard>
          ))}
          {customerProfile.jobs.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No jobs defined</p>
          )}
        </div>
      </div>

      {/* Pains Section - Bottom third */}
      <div className="flex-1 p-3 border-t border-teal-200/50 overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Frown className="w-4 h-4 text-red-600" />
          <span className="text-xs font-medium text-red-700">Pains</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {customerProfile.pains.length}
          </Badge>
        </div>
        <div className="space-y-1.5 overflow-y-auto max-h-[calc(100%-2rem)]">
          {customerProfile.pains
            .sort((a, b) => (b.intensity || 0) - (a.intensity || 0))
            .map((pain, i) => (
              <ItemCard
                key={`pain-${i}`}
                itemId={`pain-${i}`}
                itemType="pain"
                className={cn(
                  'p-2 border rounded-md text-xs',
                  pain.reliever
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                )}
              >
                <div className="flex justify-between gap-2">
                  <span className="line-clamp-2">{pain.description}</span>
                  {pain.intensity && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1 py-0 flex-shrink-0',
                        pain.intensity >= 7
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : pain.intensity >= 4
                            ? 'bg-orange-100 text-orange-800 border-orange-200'
                            : 'bg-green-100 text-green-800 border-green-200'
                      )}
                    >
                      {pain.intensity}/10
                    </Badge>
                  )}
                </div>
              </ItemCard>
            ))}
          {customerProfile.pains.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No pains defined</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN CANVAS COMPONENT
// ============================================================================

/**
 * Inner canvas component (wrapped by hover provider)
 */
function VPCCanvasInner({
  segment,
  mode = 'view',
  showFitLines = true,
  className,
}: VPCCanvasProps) {
  const { connections } = useVPCConnections(segment);

  return (
    <div className={cn('relative w-full', className)}>
      {/* SVG Layer */}
      <svg
        viewBox={`0 0 ${VPC_VIEWBOX.width} ${VPC_VIEWBOX.height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Value Proposition Canvas"
      >
        <VPCSvgBackground />
        {showFitLines && <VPCFitLines connections={connections} />}
      </svg>

      {/* Content Layer - positioned over SVG */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="relative w-full h-full pointer-events-auto">
          <ValueMapContent segment={segment} mode={mode} />
          <CustomerProfileContent segment={segment} mode={mode} />
        </div>
      </div>
    </div>
  );
}

/**
 * Main VPC Canvas component with hover provider wrapper
 */
export function VPCCanvas(props: VPCCanvasProps) {
  const { segment, showFitLines = true } = props;
  const { connections } = useVPCConnections(segment);

  return (
    <VPCHoverProvider connections={connections}>
      <div className="space-y-4">
        <VPCCanvasInner {...props} />
        {showFitLines && connections.length > 0 && (
          <VPCFitLinesLegend className="justify-center" />
        )}
      </div>
    </VPCHoverProvider>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { VPCCanvasProps };

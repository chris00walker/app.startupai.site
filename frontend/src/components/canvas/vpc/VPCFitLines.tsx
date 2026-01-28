/**
 * @story US-CP02
 */
'use client';

/**
 * VPC Fit Lines
 *
 * Renders animated bezier curves connecting:
 * - Pains ↔ Pain Relievers (blue lines)
 * - Gains ↔ Gain Creators (green lines)
 *
 * Features:
 * - Smooth bezier curves between shapes
 * - Animated dash flow effect
 * - Hover highlighting with glow
 * - Dimming of non-connected lines
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { VPCConnection } from './types';
import { VPC_CONNECTION_COLORS } from './types';
import { generateBezierPath } from './hooks/useVPCConnections';
import { useVPCHover } from './VPCHoverContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_STROKE_WIDTH = 2;
const HIGHLIGHTED_STROKE_WIDTH = 3;
const DASH_ARRAY = '8 4';
const ANIMATION_DURATION = '1.5s';

// ============================================================================
// CONNECTION LINE COMPONENT
// ============================================================================

interface ConnectionLineProps {
  connection: VPCConnection;
  isHighlighted: boolean;
  isDimmed: boolean;
}

/**
 * Single animated connection line between a value map item and customer item
 */
function ConnectionLine({ connection, isHighlighted, isDimmed }: ConnectionLineProps) {
  const { from, to, type } = connection;
  const color = VPC_CONNECTION_COLORS[type];
  const path = generateBezierPath(from.position, to.position);

  return (
    <g className="vpc-connection" data-connection-id={connection.id}>
      {/* Background glow (only when highlighted) */}
      {isHighlighted && (
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={HIGHLIGHTED_STROKE_WIDTH + 4}
          strokeLinecap="round"
          opacity={0.3}
          filter="url(#vpc-glow)"
        />
      )}

      {/* Main connection path */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={isHighlighted ? HIGHLIGHTED_STROKE_WIDTH : DEFAULT_STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={DASH_ARRAY}
        className={cn(
          'vpc-fit-line',
          isHighlighted && 'vpc-fit-line--highlighted',
          isDimmed && 'vpc-fit-line--dimmed'
        )}
        style={{
          opacity: isDimmed ? 0.15 : 1,
          transition: 'opacity 0.2s ease, stroke-width 0.2s ease',
        }}
      />

      {/* Endpoint circles */}
      <circle
        cx={from.position.x}
        cy={from.position.y}
        r={isHighlighted ? 5 : 4}
        fill={color}
        opacity={isDimmed ? 0.15 : 1}
        style={{ transition: 'opacity 0.2s ease, r 0.2s ease' }}
      />
      <circle
        cx={to.position.x}
        cy={to.position.y}
        r={isHighlighted ? 5 : 4}
        fill={color}
        opacity={isDimmed ? 0.15 : 1}
        style={{ transition: 'opacity 0.2s ease, r 0.2s ease' }}
      />
    </g>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface VPCFitLinesProps {
  connections: VPCConnection[];
  className?: string;
}

/**
 * Renders all fit lines connecting value map items to customer profile items.
 * Uses the hover context to determine highlighting state.
 */
export function VPCFitLines({ connections, className }: VPCFitLinesProps) {
  const { hoverState, isHighlighted, isDimmed } = useVPCHover();
  const hasActiveHover = hoverState.hoveredItemId !== null;

  if (connections.length === 0) {
    return null;
  }

  return (
    <g id="vpc-fit-lines" className={className}>
      {connections.map((connection) => {
        // Determine if this connection should be highlighted
        const connectionHighlighted = hasActiveHover
          ? isHighlighted(connection.from.itemId) || isHighlighted(connection.to.itemId)
          : false;

        // Determine if this connection should be dimmed
        const connectionDimmed = hasActiveHover && !connectionHighlighted;

        return (
          <ConnectionLine
            key={connection.id}
            connection={connection}
            isHighlighted={connectionHighlighted}
            isDimmed={connectionDimmed}
          />
        );
      })}
    </g>
  );
}

// ============================================================================
// LEGEND COMPONENT
// ============================================================================

interface VPCFitLinesLegendProps {
  className?: string;
}

/**
 * Legend explaining the fit line colors
 */
export function VPCFitLinesLegend({ className }: VPCFitLinesLegendProps) {
  return (
    <div className={cn('flex items-center gap-6 text-sm', className)}>
      <div className="flex items-center gap-2">
        <svg width="32" height="8" className="flex-shrink-0">
          <line
            x1="0"
            y1="4"
            x2="32"
            y2="4"
            stroke={VPC_CONNECTION_COLORS['pain-reliever']}
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        </svg>
        <span className="text-muted-foreground">Pain ↔ Reliever</span>
      </div>
      <div className="flex items-center gap-2">
        <svg width="32" height="8" className="flex-shrink-0">
          <line
            x1="0"
            y1="4"
            x2="32"
            y2="4"
            stroke={VPC_CONNECTION_COLORS['gain-creator']}
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        </svg>
        <span className="text-muted-foreground">Gain ↔ Creator</span>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { VPCFitLinesProps, VPCFitLinesLegendProps };

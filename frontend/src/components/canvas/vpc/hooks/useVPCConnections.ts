/**
 * @story US-CP02
 */
/**
 * useVPCConnections Hook
 *
 * Computes connections between customer needs and value propositions:
 * - Pains ↔ Pain Relievers
 * - Gains ↔ Gain Creators
 *
 * Uses the data model where:
 * - VPCPain has optional `reliever` property (the relief text)
 * - VPCGain has optional `creator` property (the creator text)
 * - VPCUISegment.valueMap has `painRelievers` and `gainCreators` dictionaries
 */

import { useMemo } from 'react';
import type {
  VPCUISegment,
  VPCConnection,
  VPCPoint,
  VPCConnectionType,
} from '../types';
import {
  VPC_SQUARE,
  VPC_CIRCLE,
  VPC_VALUE_MAP_SECTIONS,
  VPC_CUSTOMER_SECTIONS,
} from '../types';

// ============================================================================
// POSITION CALCULATION
// ============================================================================

/**
 * Calculate the anchor point for an item in the Value Map (left side)
 * Anchor point is on the right edge of the square (for connecting to customer side)
 */
function getValueMapAnchor(
  sectionId: string,
  itemIndex: number,
  totalItems: number
): VPCPoint {
  const section = VPC_VALUE_MAP_SECTIONS.find((s) => s.id === sectionId);
  if (!section) {
    return { x: VPC_SQUARE.x + VPC_SQUARE.width, y: VPC_SQUARE.y + VPC_SQUARE.height / 2 };
  }

  const sectionHeight = VPC_SQUARE.height * (section.yEnd - section.yStart);
  const sectionTop = VPC_SQUARE.y + VPC_SQUARE.height * section.yStart;

  // Distribute items evenly within the section
  const itemSpacing = sectionHeight / (totalItems + 1);
  const y = sectionTop + itemSpacing * (itemIndex + 1);

  // Anchor on the right edge of the square
  const x = VPC_SQUARE.x + VPC_SQUARE.width;

  return { x, y };
}

/**
 * Calculate the anchor point for an item in the Customer Profile (right side)
 * Anchor point is on the left edge of the circle (for connecting to value map side)
 */
function getCustomerProfileAnchor(
  sectionId: string,
  itemIndex: number,
  totalItems: number
): VPCPoint {
  const section = VPC_CUSTOMER_SECTIONS.find((s) => s.id === sectionId);
  if (!section) {
    return { x: VPC_CIRCLE.cx - VPC_CIRCLE.rx, y: VPC_CIRCLE.cy };
  }

  // Calculate vertical position within the circle
  const sectionHeight = (VPC_CIRCLE.ry * 2) * (section.yEnd - section.yStart);
  const sectionTop = VPC_CIRCLE.cy - VPC_CIRCLE.ry + (VPC_CIRCLE.ry * 2) * section.yStart;

  // Distribute items evenly within the section
  const itemSpacing = sectionHeight / (totalItems + 1);
  const y = sectionTop + itemSpacing * (itemIndex + 1);

  // Calculate x position on the circle's left edge at this y position
  // Ellipse equation: ((x-cx)/rx)^2 + ((y-cy)/ry)^2 = 1
  // Solving for x when on left edge: x = cx - rx * sqrt(1 - ((y-cy)/ry)^2)
  const normalizedY = (y - VPC_CIRCLE.cy) / VPC_CIRCLE.ry;
  const clampedY = Math.max(-0.95, Math.min(0.95, normalizedY)); // Clamp to avoid edge cases
  const xOffset = VPC_CIRCLE.rx * Math.sqrt(1 - clampedY * clampedY);
  const x = VPC_CIRCLE.cx - xOffset;

  return { x, y };
}

// ============================================================================
// HOOK
// ============================================================================

interface UseVPCConnectionsResult {
  connections: VPCConnection[];
  painRelieversCount: number;
  gainCreatorsCount: number;
}

/**
 * Hook to compute VPC connections from segment data.
 * Returns an array of connections with their anchor positions.
 */
export function useVPCConnections(segment: VPCUISegment): UseVPCConnectionsResult {
  return useMemo(() => {
    const connections: VPCConnection[] = [];
    const { customerProfile, valueMap } = segment;

    // ========================================================================
    // Pain ↔ Reliever Connections
    // ========================================================================

    const painsWithRelievers = customerProfile.pains.filter((p) => p.reliever);
    const painRelieversEntries = Object.entries(valueMap.painRelievers);

    painsWithRelievers.forEach((pain, painIndex) => {
      // Find the matching reliever entry
      const relieverEntry = painRelieversEntries.find(
        ([painDesc]) => painDesc === pain.description
      );

      if (relieverEntry) {
        const [painDesc, relief] = relieverEntry;
        const relieverIndex = painRelieversEntries.findIndex(
          ([p]) => p === painDesc
        );

        connections.push({
          id: `pain-reliever-${painIndex}`,
          type: 'pain-reliever' as VPCConnectionType,
          from: {
            itemId: `reliever-${relieverIndex}`,
            label: relief as string,
            position: getValueMapAnchor(
              'pain-relievers',
              relieverIndex,
              painRelieversEntries.length
            ),
          },
          to: {
            itemId: `pain-${painIndex}`,
            label: pain.description,
            position: getCustomerProfileAnchor(
              'pains',
              customerProfile.pains.indexOf(pain),
              customerProfile.pains.length
            ),
          },
          isHighlighted: false,
        });
      }
    });

    // ========================================================================
    // Gain ↔ Creator Connections
    // ========================================================================

    const gainsWithCreators = customerProfile.gains.filter((g) => g.creator);
    const gainCreatorsEntries = Object.entries(valueMap.gainCreators);

    gainsWithCreators.forEach((gain, gainIndex) => {
      // Find the matching creator entry
      const creatorEntry = gainCreatorsEntries.find(
        ([gainDesc]) => gainDesc === gain.description
      );

      if (creatorEntry) {
        const [gainDesc, creator] = creatorEntry;
        const creatorIndex = gainCreatorsEntries.findIndex(
          ([g]) => g === gainDesc
        );

        connections.push({
          id: `gain-creator-${gainIndex}`,
          type: 'gain-creator' as VPCConnectionType,
          from: {
            itemId: `creator-${creatorIndex}`,
            label: creator as string,
            position: getValueMapAnchor(
              'gain-creators',
              creatorIndex,
              gainCreatorsEntries.length
            ),
          },
          to: {
            itemId: `gain-${gainIndex}`,
            label: gain.description,
            position: getCustomerProfileAnchor(
              'gains',
              customerProfile.gains.indexOf(gain),
              customerProfile.gains.length
            ),
          },
          isHighlighted: false,
        });
      }
    });

    return {
      connections,
      painRelieversCount: painsWithRelievers.length,
      gainCreatorsCount: gainsWithCreators.length,
    };
  }, [segment]);
}

// ============================================================================
// UTILITY: Bezier Path Generation
// ============================================================================

/**
 * Generate an SVG path string for a bezier curve between two points.
 * Creates a smooth S-curve that connects horizontally-separated points.
 */
export function generateBezierPath(from: VPCPoint, to: VPCPoint): string {
  const dx = to.x - from.x;
  const curvature = 0.4; // How much the control points pull toward center

  // Control points for smooth S-curve
  const cp1x = from.x + dx * curvature;
  const cp1y = from.y;
  const cp2x = to.x - dx * curvature;
  const cp2y = to.y;

  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}

/**
 * Get the midpoint of a bezier curve (for labels)
 */
export function getBezierMidpoint(from: VPCPoint, to: VPCPoint): VPCPoint {
  // Approximate midpoint of bezier (not exact but close enough for labels)
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { UseVPCConnectionsResult };

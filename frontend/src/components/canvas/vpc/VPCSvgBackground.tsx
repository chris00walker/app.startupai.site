/**
 * @story US-CP02
 */
'use client';

/**
 * VPC SVG Background
 *
 * Renders the canonical Strategyzer VPC geometric shapes:
 * - Square (rounded rectangle) for Value Map on the left
 * - Circle (ellipse) for Customer Profile on the right
 *
 * Includes section labels and divider lines within each shape.
 */

import React from 'react';
import {
  VPC_VIEWBOX,
  VPC_SQUARE,
  VPC_CIRCLE,
  VPC_VALUE_MAP_SECTIONS,
  VPC_CUSTOMER_SECTIONS,
  VPC_SHAPE_COLORS,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const LABEL_FONT_SIZE = 14;
const TITLE_FONT_SIZE = 18;
const DIVIDER_STROKE_WIDTH = 1;
const SHAPE_STROKE_WIDTH = 2;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Value Map Square Shape with section labels
 */
function ValueMapShape() {
  const { x, y, width, height, rx } = VPC_SQUARE;
  const { fill, stroke } = VPC_SHAPE_COLORS.valueMap;

  return (
    <g id="value-map-shape">
      {/* Main square shape */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={rx}
        ry={rx}
        fill={fill}
        stroke={stroke}
        strokeWidth={SHAPE_STROKE_WIDTH}
      />

      {/* Title */}
      <text
        x={x + width / 2}
        y={y - 15}
        textAnchor="middle"
        fontSize={TITLE_FONT_SIZE}
        fontWeight="600"
        fill="#7c3aed" // purple-600
      >
        Value Map
      </text>

      {/* Section dividers and labels */}
      {VPC_VALUE_MAP_SECTIONS.map((section, index) => {
        const sectionY = y + height * section.yStart;
        const sectionHeight = height * (section.yEnd - section.yStart);
        const labelY = sectionY + sectionHeight / 2;
        const labelX = x + 20;

        return (
          <g key={section.id}>
            {/* Section divider line (except for first section) */}
            {index > 0 && (
              <line
                x1={x + 10}
                y1={sectionY}
                x2={x + width - 10}
                y2={sectionY}
                stroke={stroke}
                strokeWidth={DIVIDER_STROKE_WIDTH}
                strokeDasharray="4 4"
                opacity={0.6}
              />
            )}

            {/* Section label */}
            <text
              x={labelX}
              y={labelY}
              fontSize={LABEL_FONT_SIZE}
              fontWeight="500"
              fill="#9333ea" // purple-600
              opacity={0.7}
              dominantBaseline="middle"
            >
              {section.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/**
 * Customer Profile Circle Shape with section labels
 */
function CustomerProfileShape() {
  const { cx, cy, rx, ry } = VPC_CIRCLE;
  const { fill, stroke } = VPC_SHAPE_COLORS.customerProfile;

  return (
    <g id="customer-profile-shape">
      {/* Main circle/ellipse shape */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={fill}
        stroke={stroke}
        strokeWidth={SHAPE_STROKE_WIDTH}
      />

      {/* Title */}
      <text
        x={cx}
        y={cy - ry - 15}
        textAnchor="middle"
        fontSize={TITLE_FONT_SIZE}
        fontWeight="600"
        fill="#0d9488" // teal-600
      >
        Customer Profile
      </text>

      {/* Section dividers and labels */}
      {VPC_CUSTOMER_SECTIONS.map((section, index) => {
        const sectionY = cy - ry + (ry * 2) * section.yStart;
        const sectionHeight = (ry * 2) * (section.yEnd - section.yStart);
        const labelY = sectionY + sectionHeight / 2;

        // Calculate x position for the label (centered in the circle at this y)
        const normalizedY = (labelY - cy) / ry;
        const clampedY = Math.max(-0.9, Math.min(0.9, normalizedY));
        const xExtent = rx * Math.sqrt(1 - clampedY * clampedY);

        return (
          <g key={section.id}>
            {/* Section divider line (except for first section) */}
            {index > 0 && (
              <line
                x1={cx - xExtent + 10}
                y1={sectionY}
                x2={cx + xExtent - 10}
                y2={sectionY}
                stroke={stroke}
                strokeWidth={DIVIDER_STROKE_WIDTH}
                strokeDasharray="4 4"
                opacity={0.6}
              />
            )}

            {/* Section label */}
            <text
              x={cx}
              y={labelY}
              textAnchor="middle"
              fontSize={LABEL_FONT_SIZE}
              fontWeight="500"
              fill="#0f766e" // teal-700
              opacity={0.7}
              dominantBaseline="middle"
            >
              {section.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/**
 * Gradient and filter definitions
 */
function SvgDefs() {
  return (
    <defs>
      {/* Glow filter for highlighted connections */}
      <filter id="vpc-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Arrow marker for connection lines */}
      <marker
        id="vpc-arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
      </marker>

      {/* Gradient for value map */}
      <linearGradient id="valueMapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#faf5ff" />
        <stop offset="100%" stopColor="#f3e8ff" />
      </linearGradient>

      {/* Gradient for customer profile */}
      <linearGradient id="customerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f0fdfa" />
        <stop offset="100%" stopColor="#ccfbf1" />
      </linearGradient>
    </defs>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface VPCSvgBackgroundProps {
  className?: string;
}

/**
 * SVG Background layer with Strategyzer geometric shapes.
 * This is rendered as the base layer of the VPC canvas.
 */
export function VPCSvgBackground({ className }: VPCSvgBackgroundProps) {
  return (
    <g className={className} id="vpc-background">
      <SvgDefs />
      <ValueMapShape />
      <CustomerProfileShape />
    </g>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { VPCSvgBackgroundProps };

/**
 * VPC Canvas Types
 *
 * TypeScript interfaces for the Strategyzer-style Value Proposition Canvas
 * SVG visualization with animated fit lines and hover interactions.
 */

import type { VPCUISegment, VPCPain, VPCGain, VPCJob } from '@/lib/crewai/vpc-transformer';

// Re-export transformer types for convenience
export type { VPCUISegment, VPCPain, VPCGain, VPCJob };

// ============================================================================
// LAYOUT TYPES
// ============================================================================

/**
 * Position and dimensions within the SVG viewBox
 */
export interface VPCPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A point in the SVG coordinate system
 */
export interface VPCPoint {
  x: number;
  y: number;
}

/**
 * SVG viewBox configuration
 */
export interface VPCViewBox {
  width: number;
  height: number;
  padding: number;
}

// ============================================================================
// CONNECTION TYPES
// ============================================================================

/**
 * Types of connections between VPC elements
 */
export type VPCConnectionType = 'pain-reliever' | 'gain-creator';

/**
 * A connection between a customer need and its value proposition response
 */
export interface VPCConnection {
  id: string;
  type: VPCConnectionType;
  from: {
    itemId: string;
    label: string;
    position: VPCPoint;
  };
  to: {
    itemId: string;
    label: string;
    position: VPCPoint;
  };
  isHighlighted: boolean;
}

/**
 * Item types that can be connected
 */
export type VPCItemType = 'pain' | 'gain' | 'reliever' | 'creator' | 'job' | 'product';

/**
 * A positioned item within the canvas
 */
export interface VPCPositionedItem {
  id: string;
  type: VPCItemType;
  label: string;
  position: VPCPoint;
  section: 'value-map' | 'customer-profile';
}

// ============================================================================
// HOVER STATE TYPES
// ============================================================================

/**
 * Current hover state for the canvas
 */
export interface VPCHoverState {
  hoveredItemId: string | null;
  hoveredItemType: VPCItemType | null;
  connectedItemIds: string[];
}

/**
 * Hover context value provided to children
 */
export interface VPCHoverContextValue {
  hoverState: VPCHoverState;
  setHoveredItem: (id: string | null, type: VPCItemType | null) => void;
  isHighlighted: (id: string) => boolean;
  isDimmed: (id: string) => boolean;
  hasActiveHover: boolean;
}

// ============================================================================
// CANVAS CONFIGURATION
// ============================================================================

/**
 * Canvas rendering mode
 */
export type VPCCanvasMode = 'view' | 'edit';

/**
 * Props for the main VPCCanvas component
 */
export interface VPCCanvasProps {
  segment: VPCUISegment;
  mode?: VPCCanvasMode;
  showFitLines?: boolean;
  className?: string;
  // Edit mode callbacks
  onAddJob?: () => void;
  onUpdateJob?: (index: number, job: VPCJob) => void;
  onRemoveJob?: (index: number) => void;
  onAddPain?: () => void;
  onUpdatePain?: (index: number, pain: VPCPain) => void;
  onRemovePain?: (index: number) => void;
  onAddGain?: () => void;
  onUpdateGain?: (index: number, gain: VPCGain) => void;
  onRemoveGain?: (index: number) => void;
  onAddProductOrService?: () => void;
  onUpdateProductOrService?: (index: number, value: string) => void;
  onRemoveProductOrService?: (index: number) => void;
  onAddPainReliever?: () => void;
  onUpdatePainReliever?: (pain: string, relief: string) => void;
  onRemovePainReliever?: (pain: string) => void;
  onAddGainCreator?: () => void;
  onUpdateGainCreator?: (gain: string, creator: string) => void;
  onRemoveGainCreator?: (gain: string) => void;
}

// ============================================================================
// SVG SHAPE CONFIGURATION
// ============================================================================

/**
 * Value Map square shape configuration
 */
export interface VPCSquareConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number; // border radius
}

/**
 * Customer Profile circle/ellipse shape configuration
 */
export interface VPCCircleConfig {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/**
 * Section within a shape (e.g., Gains, Pains, Jobs)
 */
export interface VPCSectionConfig {
  id: string;
  label: string;
  yStart: number; // percentage of shape height (0-1)
  yEnd: number;   // percentage of shape height (0-1)
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default SVG viewBox dimensions
 */
export const VPC_VIEWBOX: VPCViewBox = {
  width: 1200,
  height: 700,
  padding: 40,
};

/**
 * Value Map (square) shape configuration
 */
export const VPC_SQUARE: VPCSquareConfig = {
  x: 40,
  y: 50,
  width: 480,
  height: 600,
  rx: 16,
};

/**
 * Customer Profile (circle) shape configuration
 */
export const VPC_CIRCLE: VPCCircleConfig = {
  cx: 880,
  cy: 350,
  rx: 280,
  ry: 280,
};

/**
 * Value Map sections (top to bottom)
 */
export const VPC_VALUE_MAP_SECTIONS: VPCSectionConfig[] = [
  { id: 'gain-creators', label: 'Gain Creators', yStart: 0, yEnd: 0.33 },
  { id: 'products', label: 'Products & Services', yStart: 0.33, yEnd: 0.66 },
  { id: 'pain-relievers', label: 'Pain Relievers', yStart: 0.66, yEnd: 1 },
];

/**
 * Customer Profile sections (top to bottom)
 */
export const VPC_CUSTOMER_SECTIONS: VPCSectionConfig[] = [
  { id: 'gains', label: 'Gains', yStart: 0, yEnd: 0.33 },
  { id: 'jobs', label: 'Customer Jobs', yStart: 0.33, yEnd: 0.66 },
  { id: 'pains', label: 'Pains', yStart: 0.66, yEnd: 1 },
];

/**
 * Colors for different connection types
 */
export const VPC_CONNECTION_COLORS: Record<VPCConnectionType, string> = {
  'pain-reliever': '#60a5fa', // blue-400
  'gain-creator': '#34d399',  // emerald-400
};

/**
 * Colors for shapes
 */
export const VPC_SHAPE_COLORS = {
  valueMap: {
    fill: '#faf5ff',    // purple-50
    stroke: '#d8b4fe',  // purple-300
  },
  customerProfile: {
    fill: '#f0fdfa',    // teal-50
    stroke: '#5eead4',  // teal-300
  },
};

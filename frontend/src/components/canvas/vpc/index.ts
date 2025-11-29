/**
 * VPC Canvas Components
 *
 * Strategyzer-style Value Proposition Canvas visualization with:
 * - Geometric shapes (square for Value Map, circle for Customer Profile)
 * - Animated bezier fit lines connecting pain↔reliever and gain↔creator pairs
 * - Interactive hover highlighting
 */

// Main canvas component
export { VPCCanvas } from './VPCCanvas';
export type { VPCCanvasProps } from './VPCCanvas';

// Individual components (for advanced customization)
export { VPCSvgBackground } from './VPCSvgBackground';
export { VPCFitLines, VPCFitLinesLegend } from './VPCFitLines';
export { VPCHoverProvider, useVPCHover, useVPCItemHover } from './VPCHoverContext';

// Hooks
export { useVPCConnections, generateBezierPath, getBezierMidpoint } from './hooks/useVPCConnections';

// Types
export type {
  VPCUISegment,
  VPCPain,
  VPCGain,
  VPCJob,
  VPCPosition,
  VPCPoint,
  VPCConnection,
  VPCConnectionType,
  VPCItemType,
  VPCHoverState,
  VPCHoverContextValue,
  VPCCanvasMode,
  VPCViewBox,
  VPCSquareConfig,
  VPCCircleConfig,
  VPCSectionConfig,
} from './types';

// Constants
export {
  VPC_VIEWBOX,
  VPC_SQUARE,
  VPC_CIRCLE,
  VPC_VALUE_MAP_SECTIONS,
  VPC_CUSTOMER_SECTIONS,
  VPC_CONNECTION_COLORS,
  VPC_SHAPE_COLORS,
} from './types';

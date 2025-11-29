'use client';

/**
 * VPC Hover Context
 *
 * Manages hover state for the VPC canvas, enabling interactive highlighting
 * of connected pairs (pains↔relievers, gains↔creators).
 *
 * When an item is hovered:
 * - The hovered item is highlighted
 * - Connected items are highlighted
 * - All other items are dimmed
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type PropsWithChildren,
} from 'react';
import type {
  VPCHoverState,
  VPCHoverContextValue,
  VPCItemType,
  VPCConnection,
} from './types';

// ============================================================================
// CONTEXT
// ============================================================================

const defaultHoverState: VPCHoverState = {
  hoveredItemId: null,
  hoveredItemType: null,
  connectedItemIds: [],
};

const defaultContextValue: VPCHoverContextValue = {
  hoverState: defaultHoverState,
  setHoveredItem: () => {},
  isHighlighted: () => false,
  isDimmed: () => false,
  hasActiveHover: false,
};

const VPCHoverContext = createContext<VPCHoverContextValue>(defaultContextValue);

// ============================================================================
// PROVIDER
// ============================================================================

interface VPCHoverProviderProps extends PropsWithChildren {
  connections: VPCConnection[];
}

/**
 * Provides hover state management for the VPC canvas.
 * Wrap the entire VPCCanvas in this provider.
 */
export function VPCHoverProvider({
  children,
  connections,
}: VPCHoverProviderProps) {
  const [hoverState, setHoverState] = useState<VPCHoverState>(defaultHoverState);

  // Build a lookup map for finding connected items
  const connectionMap = useMemo(() => {
    const map = new Map<string, string[]>();

    connections.forEach((conn) => {
      // Add from -> to mapping
      const fromConnections = map.get(conn.from.itemId) || [];
      fromConnections.push(conn.to.itemId);
      map.set(conn.from.itemId, fromConnections);

      // Add to -> from mapping (bidirectional)
      const toConnections = map.get(conn.to.itemId) || [];
      toConnections.push(conn.from.itemId);
      map.set(conn.to.itemId, toConnections);
    });

    return map;
  }, [connections]);

  const setHoveredItem = useCallback(
    (id: string | null, type: VPCItemType | null) => {
      if (!id || !type) {
        setHoverState(defaultHoverState);
        return;
      }

      // Find all connected items
      const connectedItemIds = connectionMap.get(id) || [];

      setHoverState({
        hoveredItemId: id,
        hoveredItemType: type,
        connectedItemIds,
      });
    },
    [connectionMap]
  );

  const isHighlighted = useCallback(
    (id: string): boolean => {
      if (!hoverState.hoveredItemId) return false;
      return (
        hoverState.hoveredItemId === id ||
        hoverState.connectedItemIds.includes(id)
      );
    },
    [hoverState]
  );

  const isDimmed = useCallback(
    (id: string): boolean => {
      if (!hoverState.hoveredItemId) return false;
      return !isHighlighted(id);
    },
    [hoverState.hoveredItemId, isHighlighted]
  );

  const hasActiveHover = hoverState.hoveredItemId !== null;

  const value: VPCHoverContextValue = useMemo(
    () => ({
      hoverState,
      setHoveredItem,
      isHighlighted,
      isDimmed,
      hasActiveHover,
    }),
    [hoverState, setHoveredItem, isHighlighted, isDimmed, hasActiveHover]
  );

  return (
    <VPCHoverContext.Provider value={value}>
      {children}
    </VPCHoverContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access the VPC hover context.
 * Must be used within a VPCHoverProvider.
 */
export function useVPCHover(): VPCHoverContextValue {
  const context = useContext(VPCHoverContext);
  if (!context) {
    throw new Error('useVPCHover must be used within a VPCHoverProvider');
  }
  return context;
}

/**
 * Hook to get hover handlers for a specific item.
 * Returns onMouseEnter and onMouseLeave handlers.
 */
export function useVPCItemHover(itemId: string, itemType: VPCItemType) {
  const { setHoveredItem, isHighlighted, isDimmed } = useVPCHover();

  const onMouseEnter = useCallback(() => {
    setHoveredItem(itemId, itemType);
  }, [itemId, itemType, setHoveredItem]);

  const onMouseLeave = useCallback(() => {
    setHoveredItem(null, null);
  }, [setHoveredItem]);

  return {
    onMouseEnter,
    onMouseLeave,
    isHighlighted: isHighlighted(itemId),
    isDimmed: isDimmed(itemId),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { VPCHoverContext };
export type { VPCHoverProviderProps };

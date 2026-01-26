/**
 * Provider Types
 *
 * Shared types for provider API clients.
 *
 * @story US-BI01
 */

/**
 * An item that can be imported from an external provider
 */
export interface ImportableItem {
  /** Provider-specific ID */
  id: string;
  /** Display name */
  name: string;
  /** Item type (e.g., 'page', 'database', 'file', 'folder') */
  type: string;
  /** Direct URL to the item in the provider */
  url?: string;
  /** Last modified timestamp */
  lastModified?: string;
  /** Additional metadata (varies by provider) */
  metadata?: Record<string, unknown>;
}

/**
 * Data imported from an external provider
 */
export interface ImportedData {
  /** Provider-specific ID of the source */
  sourceId: string;
  /** Display name of the source */
  sourceName: string;
  /** Type of source (e.g., 'page', 'file', 'table') */
  sourceType: string;
  /** URL to the source in the provider */
  sourceUrl?: string;
  /** Raw data from the provider (for debugging/audit) */
  rawData: Record<string, unknown>;
  /** Fields extracted from the source, ready for mapping */
  extractedFields: Record<string, unknown>;
  /** When the import was performed */
  importedAt: string;
}

/**
 * Provider client interface
 * All provider clients should implement this interface
 */
export interface ProviderClient {
  /** List items available for import */
  listItems(accessToken: string): Promise<ImportableItem[]>;
  /** Import a specific item */
  importItem(accessToken: string, itemId: string): Promise<ImportedData>;
}

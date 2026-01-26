/**
 * Provider Client Registry
 *
 * Routes import requests to the correct provider client.
 *
 * @story US-BI01
 */

import type { IntegrationType } from '@/types/integrations';
import type { ImportableItem, ImportedData } from './types';
import {
  listNotionItems,
  importNotionPage,
  importNotionDatabase,
} from './notion';
import {
  listGoogleDriveItems,
  importGoogleDriveFile,
} from './google-drive';
import {
  listAirtableItems,
  importAirtableTable,
} from './airtable';

export type { ImportableItem, ImportedData } from './types';

/**
 * Integration types that support import
 */
export const IMPORT_SUPPORTED_TYPES: IntegrationType[] = [
  'notion',
  'google_drive',
  'airtable',
];

/**
 * Check if an integration type supports import
 */
export function supportsImport(type: IntegrationType): boolean {
  return IMPORT_SUPPORTED_TYPES.includes(type);
}

/**
 * List importable items from a provider
 */
export async function listImportableItems(
  type: IntegrationType,
  accessToken: string
): Promise<ImportableItem[]> {
  switch (type) {
    case 'notion':
      return listNotionItems(accessToken);
    case 'google_drive':
      return listGoogleDriveItems(accessToken);
    case 'airtable':
      return listAirtableItems(accessToken);
    default:
      throw new Error(`Import not supported for ${type}`);
  }
}

/**
 * Import an item from a provider
 */
export async function importItem(
  type: IntegrationType,
  accessToken: string,
  itemId: string,
  itemType?: string
): Promise<ImportedData> {
  switch (type) {
    case 'notion':
      // Notion differentiates between pages and databases
      if (itemType === 'database') {
        return importNotionDatabase(accessToken, itemId);
      }
      return importNotionPage(accessToken, itemId);
    case 'google_drive':
      return importGoogleDriveFile(accessToken, itemId);
    case 'airtable':
      return importAirtableTable(accessToken, itemId);
    default:
      throw new Error(`Import not supported for ${type}`);
  }
}

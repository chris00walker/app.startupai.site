/**
 * Airtable API Client
 *
 * Provides methods to fetch bases, tables, and records from Airtable
 * for importing business data into StartupAI.
 *
 * @story US-BI01
 */

import Airtable from 'airtable';
import { withRateLimit } from '../rate-limit';
import type { ImportableItem, ImportedData } from './types';

/**
 * Airtable API base URL
 */
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

/**
 * List bases accessible to the user
 * Note: Airtable's official SDK doesn't support listing bases,
 * so we use the REST API directly
 */
export async function listAirtableBases(accessToken: string): Promise<ImportableItem[]> {
  const { data } = await withRateLimit('airtable', async () => {
    const response = await fetch(`${AIRTABLE_API_URL}/meta/bases`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API error: ${error}`);
    }

    return response.json() as Promise<{
      bases: Array<{
        id: string;
        name: string;
        permissionLevel: string;
      }>;
    }>;
  });

  return data.bases.map((base) => ({
    id: base.id,
    name: base.name,
    type: 'base',
    metadata: {
      permissionLevel: base.permissionLevel,
    },
  }));
}

/**
 * List tables within a base
 */
export async function listAirtableTables(
  accessToken: string,
  baseId: string
): Promise<ImportableItem[]> {
  const { data } = await withRateLimit('airtable', async () => {
    const response = await fetch(`${AIRTABLE_API_URL}/meta/bases/${baseId}/tables`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API error: ${error}`);
    }

    return response.json() as Promise<{
      tables: Array<{
        id: string;
        name: string;
        primaryFieldId: string;
        fields: Array<{
          id: string;
          name: string;
          type: string;
        }>;
      }>;
    }>;
  });

  return data.tables.map((table) => ({
    id: `${baseId}:${table.id}`,
    name: table.name,
    type: 'table',
    metadata: {
      baseId,
      tableId: table.id,
      primaryFieldId: table.primaryFieldId,
      fields: table.fields,
    },
  }));
}

/**
 * List all items (bases and their tables) from Airtable
 */
export async function listAirtableItems(accessToken: string): Promise<ImportableItem[]> {
  const items: ImportableItem[] = [];

  // Get all bases
  const bases = await listAirtableBases(accessToken);
  items.push(...bases);

  // Get tables for each base
  for (const base of bases) {
    try {
      const tables = await listAirtableTables(accessToken, base.id);
      items.push(...tables);
    } catch (error) {
      console.error(`[airtable] Error fetching tables for base ${base.id}:`, error);
      // Continue with other bases even if one fails
    }
  }

  return items;
}

/**
 * Import records from an Airtable table
 */
export async function importAirtableTable(
  accessToken: string,
  tableRef: string // Format: "baseId:tableId"
): Promise<ImportedData> {
  const [baseId, tableId] = tableRef.split(':');

  if (!baseId || !tableId) {
    throw new Error('Invalid table reference. Expected format: baseId:tableId');
  }

  // Configure Airtable SDK
  Airtable.configure({
    apiKey: accessToken,
  });

  const base = Airtable.base(baseId);

  // Get table metadata
  const { data: tableMetadata } = await withRateLimit('airtable', async () => {
    const response = await fetch(`${AIRTABLE_API_URL}/meta/bases/${baseId}/tables`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch table metadata');
    }

    return response.json() as Promise<{
      tables: Array<{
        id: string;
        name: string;
        fields: Array<{
          id: string;
          name: string;
          type: string;
        }>;
      }>;
    }>;
  });

  const tableInfo = tableMetadata.tables.find((t) => t.id === tableId);
  if (!tableInfo) {
    throw new Error('Table not found');
  }

  // Fetch records (up to 100 for initial import)
  const records: Array<Record<string, unknown>> = [];

  await withRateLimit('airtable', async () => {
    return new Promise<void>((resolve, reject) => {
      base(tableInfo.name)
        .select({
          maxRecords: 100,
          pageSize: 100,
        })
        .eachPage(
          (pageRecords, fetchNextPage) => {
            for (const record of pageRecords) {
              records.push({
                id: record.id,
                ...record.fields,
              });
            }

            // For now, just get first page
            resolve();
          },
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
    });
  });

  // Extract field names from schema
  const columns = tableInfo.fields.map((f) => f.name);

  return {
    sourceId: tableRef,
    sourceName: tableInfo.name,
    sourceType: 'table',
    sourceUrl: `https://airtable.com/${baseId}/${tableId}`,
    rawData: {
      tableMetadata: tableInfo,
      records,
    },
    extractedFields: {
      title: tableInfo.name,
      columns,
      columnTypes: tableInfo.fields.reduce(
        (acc, f) => {
          acc[f.name] = f.type;
          return acc;
        },
        {} as Record<string, string>
      ),
      rows: records,
      rowCount: records.length,
    },
    importedAt: new Date().toISOString(),
  };
}

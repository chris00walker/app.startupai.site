/**
 * Notion API Client
 *
 * Provides methods to fetch pages and databases from Notion
 * for importing business data into StartupAI.
 *
 * Uses REST API directly for simpler type handling.
 *
 * @story US-BI01
 */

import { withRateLimit } from '../rate-limit';
import type { ImportableItem, ImportedData } from './types';

/**
 * Notion API base URL
 */
const NOTION_API_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

/**
 * Make an authenticated request to Notion API
 */
async function notionRequest<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${NOTION_API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Rich text item from Notion
 */
interface RichTextItem {
  plain_text: string;
}

/**
 * Page/Database from search results
 */
interface NotionSearchResult {
  object: 'page' | 'database';
  id: string;
  url: string;
  last_edited_time: string;
  icon?: { type: string; emoji?: string };
  cover?: { type: string };
  properties?: Record<string, unknown>;
  title?: RichTextItem[];
}

/**
 * Search response
 */
interface NotionSearchResponse {
  results: NotionSearchResult[];
  next_cursor?: string;
}

/**
 * Block from Notion
 */
interface NotionBlock {
  type: string;
  paragraph?: { rich_text: RichTextItem[] };
  heading_1?: { rich_text: RichTextItem[] };
  heading_2?: { rich_text: RichTextItem[] };
  heading_3?: { rich_text: RichTextItem[] };
  bulleted_list_item?: { rich_text: RichTextItem[] };
  numbered_list_item?: { rich_text: RichTextItem[] };
  to_do?: { rich_text: RichTextItem[]; checked: boolean };
  quote?: { rich_text: RichTextItem[] };
  code?: { rich_text: RichTextItem[] };
}

/**
 * List all accessible pages and databases from Notion
 */
export async function listNotionItems(accessToken: string): Promise<ImportableItem[]> {
  const { data } = await withRateLimit('notion', async () => {
    return notionRequest<NotionSearchResponse>(accessToken, '/search', {
      method: 'POST',
      body: JSON.stringify({
        page_size: 100,
      }),
    });
  });

  const items: ImportableItem[] = [];

  for (const result of data.results) {
    if (result.object === 'page') {
      const title = extractNotionTitle(result.properties || {});
      items.push({
        id: result.id,
        name: title || 'Untitled',
        type: 'page',
        url: result.url,
        lastModified: result.last_edited_time,
        metadata: {
          icon: result.icon,
          cover: result.cover,
        },
      });
    } else if (result.object === 'database') {
      const title = result.title?.map((t) => t.plain_text).join('') || '';
      items.push({
        id: result.id,
        name: title || 'Untitled Database',
        type: 'database',
        url: result.url,
        lastModified: result.last_edited_time,
        metadata: {
          icon: result.icon,
          cover: result.cover,
        },
      });
    }
  }

  return items;
}

/**
 * Import a Notion page with its content
 */
export async function importNotionPage(
  accessToken: string,
  pageId: string
): Promise<ImportedData> {
  // Fetch the page
  const { data: page } = await withRateLimit('notion', async () => {
    return notionRequest<NotionSearchResult>(accessToken, `/pages/${pageId}`);
  });

  // Fetch page content (blocks)
  const { data: blocksResponse } = await withRateLimit('notion', async () => {
    return notionRequest<{ results: NotionBlock[] }>(
      accessToken,
      `/blocks/${pageId}/children?page_size=100`
    );
  });

  // Extract text content from blocks
  const content = blocksResponse.results
    .map((block) => extractBlockText(block))
    .filter(Boolean)
    .join('\n\n');

  // Extract properties
  const properties = extractPageProperties(page.properties || {});

  return {
    sourceId: pageId,
    sourceName: extractNotionTitle(page.properties || {}) || 'Untitled',
    sourceType: 'page',
    sourceUrl: page.url,
    rawData: {
      properties: page.properties,
      content: blocksResponse.results,
    },
    extractedFields: {
      title: properties.title,
      content,
      ...properties,
    },
    importedAt: new Date().toISOString(),
  };
}

/**
 * Import a Notion database with its entries
 */
export async function importNotionDatabase(
  accessToken: string,
  databaseId: string
): Promise<ImportedData> {
  // Fetch database schema
  const { data: database } = await withRateLimit('notion', async () => {
    return notionRequest<{
      id: string;
      url: string;
      title: RichTextItem[];
      properties: Record<string, { name: string; type: string }>;
    }>(accessToken, `/databases/${databaseId}`);
  });

  // Fetch database entries
  const { data: entriesResponse } = await withRateLimit('notion', async () => {
    return notionRequest<{ results: NotionSearchResult[] }>(
      accessToken,
      `/databases/${databaseId}/query`,
      {
        method: 'POST',
        body: JSON.stringify({
          page_size: 100,
        }),
      }
    );
  });

  // Extract data from entries
  const rows = entriesResponse.results.map((entry) =>
    extractPageProperties(entry.properties || {})
  );

  const databaseTitle = database.title?.map((t) => t.plain_text).join('') || '';

  return {
    sourceId: databaseId,
    sourceName: databaseTitle || 'Untitled Database',
    sourceType: 'database',
    sourceUrl: database.url,
    rawData: {
      schema: database.properties,
      entries: entriesResponse.results,
    },
    extractedFields: {
      title: databaseTitle,
      columns: Object.keys(database.properties),
      rows,
      rowCount: rows.length,
    },
    importedAt: new Date().toISOString(),
  };
}

/**
 * Extract title from Notion page properties
 */
function extractNotionTitle(properties: Record<string, unknown>): string | null {
  for (const [, value] of Object.entries(properties)) {
    const prop = value as { type?: string; title?: RichTextItem[] };
    if (prop.type === 'title' && prop.title) {
      return prop.title.map((t) => t.plain_text).join('');
    }
  }
  return null;
}

/**
 * Extract text from a Notion block
 */
function extractBlockText(block: NotionBlock): string | null {
  const getRichText = (richText?: RichTextItem[]): string => {
    return richText?.map((t) => t.plain_text).join('') || '';
  };

  switch (block.type) {
    case 'paragraph':
      return getRichText(block.paragraph?.rich_text);
    case 'heading_1':
      return `# ${getRichText(block.heading_1?.rich_text)}`;
    case 'heading_2':
      return `## ${getRichText(block.heading_2?.rich_text)}`;
    case 'heading_3':
      return `### ${getRichText(block.heading_3?.rich_text)}`;
    case 'bulleted_list_item':
      return `- ${getRichText(block.bulleted_list_item?.rich_text)}`;
    case 'numbered_list_item':
      return `1. ${getRichText(block.numbered_list_item?.rich_text)}`;
    case 'to_do':
      return `[${block.to_do?.checked ? 'x' : ' '}] ${getRichText(block.to_do?.rich_text)}`;
    case 'quote':
      return `> ${getRichText(block.quote?.rich_text)}`;
    case 'code':
      return `\`\`\`\n${getRichText(block.code?.rich_text)}\n\`\`\``;
    default:
      return null;
  }
}

/**
 * Extract properties from a Notion page into a flat object
 */
function extractPageProperties(properties: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    const prop = value as {
      type?: string;
      title?: RichTextItem[];
      rich_text?: RichTextItem[];
      number?: number;
      select?: { name: string };
      multi_select?: Array<{ name: string }>;
      date?: { start: string; end?: string };
      checkbox?: boolean;
      url?: string;
      email?: string;
      phone_number?: string;
    };

    switch (prop.type) {
      case 'title':
        result[key] = prop.title?.map((t) => t.plain_text).join('');
        break;
      case 'rich_text':
        result[key] = prop.rich_text?.map((t) => t.plain_text).join('');
        break;
      case 'number':
        result[key] = prop.number;
        break;
      case 'select':
        result[key] = prop.select?.name;
        break;
      case 'multi_select':
        result[key] = prop.multi_select?.map((s) => s.name);
        break;
      case 'date':
        result[key] = prop.date?.start;
        break;
      case 'checkbox':
        result[key] = prop.checkbox;
        break;
      case 'url':
        result[key] = prop.url;
        break;
      case 'email':
        result[key] = prop.email;
        break;
      case 'phone_number':
        result[key] = prop.phone_number;
        break;
      default:
        // Skip unsupported property types
        break;
    }
  }

  return result;
}

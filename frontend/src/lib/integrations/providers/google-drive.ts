/**
 * Google Drive API Client
 *
 * Provides methods to fetch files from Google Drive
 * for importing business data into StartupAI.
 *
 * Uses REST API directly for simpler type handling.
 *
 * @story US-BI01
 */

import { withRateLimit } from '../rate-limit';
import type { ImportableItem, ImportedData } from './types';

/**
 * Google Drive API base URL
 */
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';

/**
 * MIME types we can import
 */
const IMPORTABLE_MIME_TYPES = [
  'application/vnd.google-apps.document', // Google Docs
  'application/vnd.google-apps.spreadsheet', // Google Sheets
  'application/vnd.google-apps.presentation', // Google Slides
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
];

/**
 * File metadata from Google Drive API
 */
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  description?: string;
  iconLink?: string;
  thumbnailLink?: string;
}

/**
 * List files response from Google Drive API
 */
interface FilesListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

/**
 * Make an authenticated request to Drive API
 */
async function driveRequest<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${DRIVE_API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Drive API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * List files from Google Drive that can be imported
 */
export async function listGoogleDriveItems(accessToken: string): Promise<ImportableItem[]> {
  // Build query for importable file types
  const mimeQueries = IMPORTABLE_MIME_TYPES.map((m) => `mimeType='${m}'`).join(' or ');
  const query = encodeURIComponent(`(${mimeQueries}) and trashed=false`);
  const fields = encodeURIComponent('files(id,name,mimeType,webViewLink,modifiedTime,iconLink,thumbnailLink)');

  const { data } = await withRateLimit('google_drive', async () => {
    return driveRequest<FilesListResponse>(
      accessToken,
      `/files?q=${query}&pageSize=100&orderBy=modifiedTime desc&fields=${fields}`
    );
  });

  return data.files.map((file) => ({
    id: file.id,
    name: file.name || 'Untitled',
    type: getFileType(file.mimeType),
    url: file.webViewLink,
    lastModified: file.modifiedTime,
    metadata: {
      mimeType: file.mimeType,
      iconLink: file.iconLink,
      thumbnailLink: file.thumbnailLink,
    },
  }));
}

/**
 * Import a file from Google Drive
 */
export async function importGoogleDriveFile(
  accessToken: string,
  fileId: string
): Promise<ImportedData> {
  // Get file metadata
  const { data: file } = await withRateLimit('google_drive', async () => {
    const fields = encodeURIComponent('id,name,mimeType,webViewLink,modifiedTime,description');
    return driveRequest<DriveFile>(accessToken, `/files/${fileId}?fields=${fields}`);
  });

  const mimeType = file.mimeType || '';
  let content: string;
  let extractedFields: Record<string, unknown>;

  // Export based on file type
  if (mimeType === 'application/vnd.google-apps.document') {
    content = await exportGoogleFile(accessToken, fileId, 'text/plain');
    extractedFields = {
      title: file.name,
      content,
      description: file.description,
    };
  } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    content = await exportGoogleFile(accessToken, fileId, 'text/csv');
    const rows = parseCSV(content);
    extractedFields = {
      title: file.name,
      columns: rows[0] || [],
      rows: rows.slice(1),
      rowCount: rows.length - 1,
    };
  } else if (mimeType === 'application/vnd.google-apps.presentation') {
    content = await exportGoogleFile(accessToken, fileId, 'text/plain');
    extractedFields = {
      title: file.name,
      content,
    };
  } else {
    // Download regular file content
    content = await downloadFile(accessToken, fileId);

    if (mimeType === 'application/json') {
      try {
        extractedFields = {
          title: file.name,
          data: JSON.parse(content),
        };
      } catch {
        extractedFields = { title: file.name, content };
      }
    } else if (mimeType === 'text/csv') {
      const rows = parseCSV(content);
      extractedFields = {
        title: file.name,
        columns: rows[0] || [],
        rows: rows.slice(1),
        rowCount: rows.length - 1,
      };
    } else {
      extractedFields = {
        title: file.name,
        content,
      };
    }
  }

  return {
    sourceId: fileId,
    sourceName: file.name || 'Untitled',
    sourceType: getFileType(mimeType),
    sourceUrl: file.webViewLink,
    rawData: {
      file,
      content,
    },
    extractedFields,
    importedAt: new Date().toISOString(),
  };
}

/**
 * Export a Google Apps file (Docs, Sheets, Slides) to a specified format
 */
async function exportGoogleFile(
  accessToken: string,
  fileId: string,
  exportMimeType: string
): Promise<string> {
  const result = await withRateLimit('google_drive', async () => {
    const response = await fetch(
      `${DRIVE_API_URL}/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.text();
  });

  return result.data;
}

/**
 * Download a regular file's content
 */
async function downloadFile(accessToken: string, fileId: string): Promise<string> {
  const result = await withRateLimit('google_drive', async () => {
    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return response.text();
  });

  return result.data;
}

/**
 * Map MIME type to friendly file type
 */
function getFileType(mimeType: string): string {
  switch (mimeType) {
    case 'application/vnd.google-apps.document':
      return 'document';
    case 'application/vnd.google-apps.spreadsheet':
      return 'spreadsheet';
    case 'application/vnd.google-apps.presentation':
      return 'presentation';
    case 'text/csv':
      return 'csv';
    case 'application/json':
      return 'json';
    case 'text/markdown':
      return 'markdown';
    case 'text/plain':
      return 'text';
    default:
      return 'file';
  }
}

/**
 * Simple CSV parser (handles basic cases)
 */
function parseCSV(content: string): string[][] {
  const lines = content.split('\n');
  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      return values;
    });
}

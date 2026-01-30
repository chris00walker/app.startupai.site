/**
 * Unified Knowledge Index System - Checksum Utilities
 *
 * Provides file checksum calculation for drift detection.
 */

import * as fs from 'fs';
import * as crypto from 'crypto';

/**
 * Calculate MD5 checksum of a file
 */
export function calculateFileChecksum(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Calculate checksums for multiple files
 */
export function calculateChecksums(filePaths: string[]): Record<string, string> {
  const checksums: Record<string, string> = {};

  for (const filePath of filePaths) {
    try {
      checksums[filePath] = calculateFileChecksum(filePath);
    } catch (error) {
      console.warn(`Warning: Could not calculate checksum for ${filePath}: ${error}`);
    }
  }

  return checksums;
}

/**
 * Calculate checksum of string content (for in-memory data)
 */
export function calculateContentChecksum(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Compare two checksum maps and return differences
 */
export function compareChecksums(
  oldChecksums: Record<string, string>,
  newChecksums: Record<string, string>
): {
  changed: string[];
  added: string[];
  removed: string[];
} {
  const changed: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];

  // Find changed and removed files
  for (const [path, oldChecksum] of Object.entries(oldChecksums)) {
    if (!(path in newChecksums)) {
      removed.push(path);
    } else if (newChecksums[path] !== oldChecksum) {
      changed.push(path);
    }
  }

  // Find added files
  for (const path of Object.keys(newChecksums)) {
    if (!(path in oldChecksums)) {
      added.push(path);
    }
  }

  return { changed, added, removed };
}

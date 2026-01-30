#!/usr/bin/env tsx
/**
 * Unified Knowledge Index System - Bootstrap Script
 *
 * Auto-discovers canonical docs and generates a draft docs-registry.json.
 * Run with: pnpm knowledge:bootstrap
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PROJECT_ROOT,
  resolveRepoRoots,
  classifyDocCategory,
  extractTopics,
  DOC_SCAN_DIRS,
  DOC_EXTENSIONS,
  DOC_EXCLUDE_DIRS,
  DOCS_REGISTRY_PATH,
  REPO_ROOTS_PATH,
} from './config';
import type { DocRegistryEntry, RepoId, RepoRoots } from './types';

// =============================================================================
// File Discovery
// =============================================================================

/**
 * Recursively find all markdown files in a directory
 */
function findMarkdownFiles(
  dir: string,
  baseDir: string,
  files: string[] = []
): string[] {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    // Skip excluded directories
    if (entry.isDirectory()) {
      if (DOC_EXCLUDE_DIRS.some((excluded) => entry.name === excluded)) {
        continue;
      }
      findMarkdownFiles(fullPath, baseDir, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if ((DOC_EXTENSIONS as readonly string[]).includes(ext)) {
        files.push(relativePath);
      }
    }
  }

  return files;
}

/**
 * Extract title from markdown content
 */
function extractTitle(content: string, filename: string): string {
  // Try to find first H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Try frontmatter title
  const frontmatterMatch = content.match(/^---\s*\n[\s\S]*?title:\s*["']?([^"'\n]+)["']?\s*\n[\s\S]*?---/);
  if (frontmatterMatch) {
    return frontmatterMatch[1].trim();
  }

  // Fall back to filename
  return path.basename(filename, path.extname(filename))
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Scan a repo for markdown files and create registry entries
 */
function scanRepoForDocs(
  repoId: RepoId,
  repoRoot: string,
  scanDirs: string[]
): DocRegistryEntry[] {
  const entries: DocRegistryEntry[] = [];

  for (const scanDir of scanDirs) {
    const fullPath = path.join(repoRoot, scanDir);

    // Handle single file entries (like README.md)
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      entries.push({
        repo: repoId,
        path: scanDir,
        title: extractTitle(content, scanDir),
        category: classifyDocCategory(scanDir),
        topics: extractTopics(content + ' ' + scanDir),
      });
      continue;
    }

    // Handle directory entries
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
      continue;
    }

    const files = findMarkdownFiles(fullPath, repoRoot);
    for (const file of files) {
      const filePath = path.join(repoRoot, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        entries.push({
          repo: repoId,
          path: file,
          title: extractTitle(content, file),
          category: classifyDocCategory(file),
          topics: extractTopics(content + ' ' + file),
        });
      } catch (error) {
        console.warn(`Warning: Could not read ${filePath}: ${error}`);
      }
    }
  }

  return entries;
}

// =============================================================================
// Main Bootstrap Function
// =============================================================================

async function bootstrap(): Promise<void> {
  console.log('🔍 Starting knowledge index bootstrap...\n');

  // Resolve repo roots
  const repoRoots = resolveRepoRoots();
  console.log('📂 Repo roots:');
  console.log(`   app: ${repoRoots.app}`);
  console.log(`   crew: ${repoRoots.crew}`);
  console.log(`   marketing: ${repoRoots.marketing}\n`);

  // Write repo-roots.json for portability
  const repoRootsFullPath = path.join(PROJECT_ROOT, REPO_ROOTS_PATH);
  const repoRootsDir = path.dirname(repoRootsFullPath);
  if (!fs.existsSync(repoRootsDir)) {
    fs.mkdirSync(repoRootsDir, { recursive: true });
  }
  fs.writeFileSync(repoRootsFullPath, JSON.stringify(repoRoots, null, 2));
  console.log(`✅ Written: ${REPO_ROOTS_PATH}\n`);

  // Scan each repo for docs
  const allEntries: DocRegistryEntry[] = [];

  for (const [repoId, scanDirs] of Object.entries(DOC_SCAN_DIRS)) {
    const repo = repoId as RepoId;
    const repoRoot = repoRoots[repo];

    console.log(`📖 Scanning ${repo} repo...`);

    if (!fs.existsSync(repoRoot)) {
      console.log(`   ⚠️  Repo not found: ${repoRoot}`);
      continue;
    }

    const entries = scanRepoForDocs(repo, repoRoot, scanDirs);
    allEntries.push(...entries);
    console.log(`   Found ${entries.length} documents`);
  }

  console.log(`\n📊 Total documents found: ${allEntries.length}`);

  // Group by category for summary
  const byCategory: Record<string, number> = {};
  for (const entry of allEntries) {
    byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
  }
  console.log('\nBy category:');
  for (const [category, count] of Object.entries(byCategory).sort()) {
    console.log(`   ${category}: ${count}`);
  }

  // Collect all unique topics
  const allTopics = new Set<string>();
  for (const entry of allEntries) {
    for (const topic of entry.topics) {
      allTopics.add(topic);
    }
  }
  console.log(`\nUnique topics: ${allTopics.size}`);

  // Write docs-registry.json
  const registryFullPath = path.join(PROJECT_ROOT, DOCS_REGISTRY_PATH);
  fs.writeFileSync(registryFullPath, JSON.stringify(allEntries, null, 2));
  console.log(`\n✅ Written: ${DOCS_REGISTRY_PATH}`);

  // Summary
  console.log('\n📝 Bootstrap complete!');
  console.log('   Next steps:');
  console.log('   1. Review docs-registry.json and curate entries');
  console.log('   2. Add missing references (stories, schemas, apis)');
  console.log('   3. Run: pnpm knowledge:generate');
}

// =============================================================================
// CLI Entry Point
// =============================================================================

bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});

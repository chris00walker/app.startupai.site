#!/usr/bin/env tsx
/**
 * Knowledge Index - Registry Enrichment
 *
 * Adds derived topics and cross-repo connections to docs-registry.json.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PROJECT_ROOT, DOCS_REGISTRY_PATH } from './config';
import type { DocRegistryEntry, RepoId } from './types';

const registryPath = path.join(PROJECT_ROOT, DOCS_REGISTRY_PATH);
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8')) as DocRegistryEntry[];

const WEAK_TOPICS = new Set([
  'api',
  'schema',
  'testing',
  'founder',
  'consultant',
  'phase-0',
  'phase-1',
  'phase-2',
  'phase-3',
  'phase-4',
  'work',
  'auth',
  'netlify',
  'supabase',
  'crewai',
]);

const MAX_PER_REPO = 2;
const MAX_TOTAL = 6;

function addDerivedTopics(entry: DocRegistryEntry): void {
  const topics = Array.isArray(entry.topics) ? entry.topics : [];
  const topicSet = new Set(topics.map((t) => t.toLowerCase()));

  if (topicSet.has('pgvector') && topicSet.has('evidence')) {
    topicSet.add('pgvector-evidence');
  }

  // Preserve original order where possible, append derived topics
  const ordered = [...topics];
  for (const t of topicSet) {
    if (!ordered.includes(t)) {
      ordered.push(t);
    }
  }
  entry.topics = ordered;
}

function scoreConnection(a: DocRegistryEntry, b: DocRegistryEntry): number {
  const aTopics = new Set((a.topics || []).map((t) => t.toLowerCase()).filter((t) => !WEAK_TOPICS.has(t)));
  const bTopics = new Set((b.topics || []).map((t) => t.toLowerCase()).filter((t) => !WEAK_TOPICS.has(t)));
  let score = 0;
  for (const t of aTopics) {
    if (bTopics.has(t)) {
      score++;
    }
  }
  return score;
}

function buildCrossRepoConnections(entry: DocRegistryEntry, all: DocRegistryEntry[]): string[] {
  const candidates = all.filter((e) => e.repo !== entry.repo);
  const scored = candidates
    .map((e) => ({ entry: e, score: scoreConnection(entry, e) }))
    .filter((e) => e.score > 0);

  const byRepo: Record<RepoId, Array<{ entry: DocRegistryEntry; score: number }>> = {
    app: [],
    crew: [],
    marketing: [],
  };

  for (const item of scored) {
    byRepo[item.entry.repo as RepoId].push(item);
  }

  const results: string[] = [];
  for (const repo of Object.keys(byRepo) as RepoId[]) {
    const items = byRepo[repo]
      .sort((a, b) => b.score - a.score || a.entry.path.localeCompare(b.entry.path))
      .slice(0, MAX_PER_REPO);

    for (const item of items) {
      results.push(`${item.entry.repo}:${item.entry.path}`);
    }
  }

  return results.slice(0, MAX_TOTAL);
}

let updated = 0;
for (const entry of registry) {
  addDerivedTopics(entry);
  const connections = buildCrossRepoConnections(entry, registry);
  if (connections.length > 0) {
    entry.cross_repo_connections = connections;
  } else {
    delete entry.cross_repo_connections;
  }
  updated++;
}

fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
console.log(`Enriched ${updated} registry entries`);

/**
 * Evidence Queries
 * 
 * Type-safe query functions for evidence table with vector search support.
 */

import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../client';
import { evidence, type Evidence, type NewEvidence } from '../schema';

/**
 * Get all evidence for a project
 */
export async function getProjectEvidence(projectId: string): Promise<Evidence[]> {
  return await db
    .select()
    .from(evidence)
    .where(eq(evidence.projectId, projectId))
    .orderBy(desc(evidence.createdAt));
}

/**
 * Get evidence by ID
 */
export async function getEvidence(evidenceId: string): Promise<Evidence | undefined> {
  const [item] = await db
    .select()
    .from(evidence)
    .where(eq(evidence.id, evidenceId))
    .limit(1);
  
  return item;
}

/**
 * Create new evidence
 */
export async function createEvidence(item: NewEvidence): Promise<Evidence> {
  const [newEvidence] = await db
    .insert(evidence)
    .values(item)
    .returning();
  
  return newEvidence;
}

/**
 * Update evidence
 */
export async function updateEvidence(
  evidenceId: string,
  updates: Partial<Omit<Evidence, 'id' | 'project_id' | 'created_at'>>
): Promise<Evidence> {
  const [updated] = await db
    .update(evidence)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(evidence.id, evidenceId))
    .returning();
  
  return updated;
}

/**
 * Delete evidence
 */
export async function deleteEvidence(evidenceId: string): Promise<void> {
  await db
    .delete(evidence)
    .where(eq(evidence.id, evidenceId));
}

/**
 * Search for similar evidence using vector similarity
 * 
 * @param projectId - Project to search within
 * @param queryEmbedding - Vector embedding of the search query (1536 dimensions)
 * @param threshold - Similarity threshold (0-1, higher = more similar)
 * @param limit - Maximum number of results
 */
export async function searchSimilarEvidence(
  projectId: string,
  queryEmbedding: number[],
  threshold: number = 0.7,
  limit: number = 10
): Promise<(Evidence & { similarity: number })[]> {
  // Convert embedding array to pgvector format string
  const embeddingStr = `[${queryEmbedding.join(',')}]`;
  
  // Use raw SQL for vector similarity search
  // Using cosine distance operator <=> (lower is more similar)
  const results = await db.execute(sql`
    SELECT 
      *,
      1 - (embedding <=> ${embeddingStr}::vector) as similarity
    FROM evidence
    WHERE project_id = ${projectId}
      AND embedding IS NOT NULL
      AND 1 - (embedding <=> ${embeddingStr}::vector) >= ${threshold}
    ORDER BY embedding <=> ${embeddingStr}::vector ASC
    LIMIT ${limit}
  `);
  
  return results as any as (Evidence & { similarity: number })[];
}

/**
 * Count evidence items in a project
 */
export async function countProjectEvidence(projectId: string): Promise<number> {
  const items = await getProjectEvidence(projectId);
  return items.length;
}

/**
 * Get recent evidence for a project
 */
export async function getRecentEvidence(
  projectId: string,
  limit: number = 5
): Promise<Evidence[]> {
  return await db
    .select()
    .from(evidence)
    .where(eq(evidence.projectId, projectId))
    .orderBy(desc(evidence.createdAt))
    .limit(limit);
}

/**
 * Hypothesis Queries
 *
 * Type-safe helpers for interacting with the hypotheses table.
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { hypotheses, type Hypothesis, type NewHypothesis } from '../schema';

/**
 * Fetch all hypotheses for a project.
 */
export async function getProjectHypotheses(projectId: string): Promise<Hypothesis[]> {
  return await db
    .select()
    .from(hypotheses)
    .where(eq(hypotheses.projectId, projectId))
    .orderBy(desc(hypotheses.createdAt));
}

/**
 * Fetch hypotheses for a project filtered by status.
 */
export async function getProjectHypothesesByStatus(
  projectId: string,
  status: Hypothesis['status']
): Promise<Hypothesis[]> {
  return await db
    .select()
    .from(hypotheses)
    .where(and(eq(hypotheses.projectId, projectId), eq(hypotheses.status, status)))
    .orderBy(desc(hypotheses.createdAt));
}

/**
 * Fetch hypotheses for a project filtered by type (desirable, feasible, viable).
 */
export async function getProjectHypothesesByType(
  projectId: string,
  type: Hypothesis['type']
): Promise<Hypothesis[]> {
  return await db
    .select()
    .from(hypotheses)
    .where(and(eq(hypotheses.projectId, projectId), eq(hypotheses.type, type)))
    .orderBy(desc(hypotheses.createdAt));
}

/**
 * Fetch a single hypothesis by id.
 */
export async function getHypothesis(hypothesisId: string): Promise<Hypothesis | undefined> {
  const [record] = await db
    .select()
    .from(hypotheses)
    .where(eq(hypotheses.id, hypothesisId))
    .limit(1);

  return record;
}

/**
 * Create a hypothesis.
 */
export async function createHypothesis(payload: NewHypothesis): Promise<Hypothesis> {
  const [record] = await db
    .insert(hypotheses)
    .values(payload)
    .returning();

  return record;
}

/**
 * Update a hypothesis with partial fields.
 */
export async function updateHypothesis(
  hypothesisId: string,
  updates: Partial<Omit<Hypothesis, 'id' | 'projectId' | 'createdAt'>>
): Promise<Hypothesis> {
  const [record] = await db
    .update(hypotheses)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(hypotheses.id, hypothesisId))
    .returning();

  return record;
}

/**
 * Delete a hypothesis.
 */
export async function deleteHypothesis(hypothesisId: string): Promise<void> {
  await db
    .delete(hypotheses)
    .where(eq(hypotheses.id, hypothesisId));
}

/**
 * Count hypotheses for a project.
 */
export async function countProjectHypotheses(projectId: string): Promise<number> {
  const records = await db
    .select({ id: hypotheses.id })
    .from(hypotheses)
    .where(eq(hypotheses.projectId, projectId));

  return records.length;
}

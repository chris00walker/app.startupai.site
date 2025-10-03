/**
 * Experiment Queries
 *
 * Type-safe helpers for interacting with the experiments table.
 */

import { and, desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { experiments, type Experiment, type NewExperiment } from '../schema';

/**
 * Fetch all experiments for a project.
 */
export async function getProjectExperiments(projectId: string): Promise<Experiment[]> {
  return await db
    .select()
    .from(experiments)
    .where(eq(experiments.projectId, projectId))
    .orderBy(desc(experiments.createdAt));
}

/**
 * Fetch experiments for a project filtered by status.
 */
export async function getProjectExperimentsByStatus(
  projectId: string,
  status: Experiment['status']
): Promise<Experiment[]> {
  return await db
    .select()
    .from(experiments)
    .where(and(eq(experiments.projectId, projectId), eq(experiments.status, status)))
    .orderBy(desc(experiments.createdAt));
}

/**
 * Fetch experiments for a specific hypothesis.
 */
export async function getHypothesisExperiments(hypothesisId: string): Promise<Experiment[]> {
  return await db
    .select()
    .from(experiments)
    .where(eq(experiments.hypothesisId, hypothesisId))
    .orderBy(desc(experiments.createdAt));
}

/**
 * Fetch an experiment by id.
 */
export async function getExperiment(experimentId: string): Promise<Experiment | undefined> {
  const [record] = await db
    .select()
    .from(experiments)
    .where(eq(experiments.id, experimentId))
    .limit(1);

  return record;
}

/**
 * Create an experiment.
 */
export async function createExperiment(payload: NewExperiment): Promise<Experiment> {
  const [record] = await db
    .insert(experiments)
    .values(payload)
    .returning();

  return record;
}

/**
 * Update an experiment with partial fields.
 */
export async function updateExperiment(
  experimentId: string,
  updates: Partial<Omit<Experiment, 'id' | 'projectId' | 'createdAt'>>
): Promise<Experiment> {
  const [record] = await db
    .update(experiments)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(experiments.id, experimentId))
    .returning();

  return record;
}

/**
 * Delete an experiment.
 */
export async function deleteExperiment(experimentId: string): Promise<void> {
  await db
    .delete(experiments)
    .where(eq(experiments.id, experimentId));
}

/**
 * Count experiments for a project.
 */
export async function countProjectExperiments(projectId: string): Promise<number> {
  const records = await db
    .select({ id: experiments.id })
    .from(experiments)
    .where(eq(experiments.projectId, projectId));

  return records.length;
}

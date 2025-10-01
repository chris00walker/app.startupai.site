/**
 * Project Queries
 * 
 * Type-safe query functions for projects table.
 */

import { eq, desc, and } from 'drizzle-orm';
import { db } from '../client';
import { projects, type Project, type NewProject } from '../schema';

/**
 * Get all projects for a user
 */
export async function getUserProjects(userId: string): Promise<Project[]> {
  return await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));
}

/**
 * Get active projects for a user
 */
export async function getActiveUserProjects(userId: string): Promise<Project[]> {
  return await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.userId, userId),
        eq(projects.status, 'active')
      )
    )
    .orderBy(desc(projects.createdAt));
}

/**
 * Get project by ID
 */
export async function getProject(projectId: string): Promise<Project | undefined> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  
  return project;
}

/**
 * Create a new project
 */
export async function createProject(project: NewProject): Promise<Project> {
  const [newProject] = await db
    .insert(projects)
    .values(project)
    .returning();
  
  return newProject;
}

/**
 * Update project
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>
): Promise<Project> {
  const [updated] = await db
    .update(projects)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
    .returning();
  
  return updated;
}

/**
 * Delete project (and cascade to evidence/reports)
 */
export async function deleteProject(projectId: string): Promise<void> {
  await db
    .delete(projects)
    .where(eq(projects.id, projectId));
}

/**
 * Archive project
 */
export async function archiveProject(projectId: string): Promise<Project> {
  return await updateProject(projectId, { status: 'archived' });
}

/**
 * Count user's projects
 */
export async function countUserProjects(userId: string): Promise<number> {
  const userProjects = await getUserProjects(userId);
  return userProjects.length;
}

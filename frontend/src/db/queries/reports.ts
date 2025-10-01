/**
 * Report Queries
 * 
 * Type-safe query functions for reports table.
 */

import { eq, desc, and } from 'drizzle-orm';
import { db } from '../client';
import { reports, type Report, type NewReport } from '../schema';

/**
 * Get all reports for a project
 */
export async function getProjectReports(projectId: string): Promise<Report[]> {
  return await db
    .select()
    .from(reports)
    .where(eq(reports.projectId, projectId))
    .orderBy(desc(reports.generatedAt));
}

/**
 * Get reports by type for a project
 */
export async function getProjectReportsByType(
  projectId: string,
  reportType: string
): Promise<Report[]> {
  return await db
    .select()
    .from(reports)
    .where(
      and(
        eq(reports.projectId, projectId),
        eq(reports.reportType, reportType)
      )
    )
    .orderBy(desc(reports.generatedAt));
}

/**
 * Get report by ID
 */
export async function getReport(reportId: string): Promise<Report | undefined> {
  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);
  
  return report;
}

/**
 * Create new report
 */
export async function createReport(report: NewReport): Promise<Report> {
  const [newReport] = await db
    .insert(reports)
    .values(report)
    .returning();
  
  return newReport;
}

/**
 * Update report
 */
export async function updateReport(
  reportId: string,
  updates: Partial<Omit<Report, 'id' | 'project_id' | 'generated_at'>>
): Promise<Report> {
  const [updated] = await db
    .update(reports)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, reportId))
    .returning();
  
  return updated;
}

/**
 * Delete report
 */
export async function deleteReport(reportId: string): Promise<void> {
  await db
    .delete(reports)
    .where(eq(reports.id, reportId));
}

/**
 * Get latest report of a specific type
 */
export async function getLatestReport(
  projectId: string,
  reportType: string
): Promise<Report | undefined> {
  const [report] = await db
    .select()
    .from(reports)
    .where(
      and(
        eq(reports.projectId, projectId),
        eq(reports.reportType, reportType)
      )
    )
    .orderBy(desc(reports.generatedAt))
    .limit(1);
  
  return report;
}

/**
 * Count reports in a project
 */
export async function countProjectReports(projectId: string): Promise<number> {
  const projectReports = await getProjectReports(projectId);
  return projectReports.length;
}

/**
 * Get recent reports across all types
 */
export async function getRecentReports(
  projectId: string,
  limit: number = 5
): Promise<Report[]> {
  return await db
    .select()
    .from(reports)
    .where(eq(reports.projectId, projectId))
    .orderBy(desc(reports.generatedAt))
    .limit(limit);
}

/**
 * Database Schema Index
 * 
 * Exports all schema definitions and types for the StartupAI application.
 * 
 * Schema Structure:
 * - user_profiles: User account information
 * - projects: User projects for strategy development
 * - evidence: Project evidence with vector embeddings
 * - reports: AI-generated reports and insights
 */

export * from './users';
export * from './projects';
export * from './evidence';
export * from './reports';

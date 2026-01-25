/**
 * Notification Preferences Schema
 *
 * Stores user notification settings for email, push, and in-app notifications.
 *
 * @story US-N03
 */

import { pgTable, uuid, boolean, timestamp } from 'drizzle-orm/pg-core';

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id').notNull().unique(),

  // Channel preferences
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  pushNotifications: boolean('push_notifications').default(true).notNull(),

  // Category preferences
  workflowUpdates: boolean('workflow_updates').default(true).notNull(),
  clientUpdates: boolean('client_updates').default(true).notNull(),
  systemAlerts: boolean('system_alerts').default(true).notNull(),
  weeklyReports: boolean('weekly_reports').default(false).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;

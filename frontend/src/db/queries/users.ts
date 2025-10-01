/**
 * User Profile Queries
 * 
 * Type-safe query functions for user_profiles table.
 */

import { eq } from 'drizzle-orm';
import { db } from '../client';
import { userProfiles, type UserProfile, type NewUserProfile } from '../schema';

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | undefined> {
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, userId))
    .limit(1);
  
  return profile;
}

/**
 * Create a new user profile
 */
export async function createUserProfile(profile: NewUserProfile): Promise<UserProfile> {
  const [newProfile] = await db
    .insert(userProfiles)
    .values(profile)
    .returning();
  
  return newProfile;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>
): Promise<UserProfile> {
  const [updated] = await db
    .update(userProfiles)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.id, userId))
    .returning();
  
  return updated;
}

/**
 * Get user profile by email
 */
export async function getUserProfileByEmail(email: string): Promise<UserProfile | undefined> {
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.email, email))
    .limit(1);
  
  return profile;
}

/**
 * Check if user profile exists
 */
export async function userProfileExists(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return !!profile;
}

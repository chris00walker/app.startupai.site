/**
 * User Profile Queries
 * 
 * Real Supabase queries for user_profiles table.
 * Replaces stub functions with actual database operations.
 * 
 * Phase 0 implementation using direct Supabase client.
 */

import { createClient } from '@/lib/supabase/server';

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  role: 'admin' | 'founder' | 'consultant' | 'trial';
  subscription_tier: string | null;
  subscription_status: string | null;
  plan_status: string | null;
  trial_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
  
  return data;
}

/**
 * Get user profile by email
 */
export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    console.error('Failed to get user profile by email:', error);
    return null;
  }
  
  return data;
}

/**
 * Check if user profile exists
 */
export async function userProfileExists(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return !!profile;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>
): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to update user profile:', error);
    return null;
  }
  
  return data;
}

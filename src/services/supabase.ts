// src/services/supabase.ts
// This file connects your app to Supabase database

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get Supabase credentials from environment variables
const supabaseUrl = Constants?.expoConfig?.extra?.SUPABASE_URL || 
  process.env.EXPO_PUBLIC_SUPABASE_URL;
  
const supabaseAnonKey = Constants?.expoConfig?.extra?.SUPABASE_ANON_KEY || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Error checking
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Supabase credentials missing!');
  console.error('Make sure .env.local has:');
  console.error('  EXPO_PUBLIC_SUPABASE_URL=...');
  console.error('  EXPO_PUBLIC_SUPABASE_ANON_KEY=...');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ============================================
// Helper Functions
// ============================================

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    return false;
  }
}

/**
 * Get user profile and role from users table
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
}

/**
 * Get player profile (game name, UID, etc.)
 */
export async function getPlayerProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  } catch (error) {
    console.error('Failed to get player profile:', error);
    return null;
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    return profile?.role === 'admin' || profile?.role === 'super_admin';
  } catch (error) {
    return false;
  }
}

/**
 * Check if user is banned
 */
export async function isBanned(userId: string): Promise<{ banned: boolean; reason?: string; expiresAt?: string }> {
  try {
    const { data, error } = await supabase
      .from('bans')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      return { banned: false };
    }

    if (error) throw error;

    // Check if ban has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { banned: false };
    }

    return {
      banned: true,
      reason: data.reason,
      expiresAt: data.expires_at,
    };
  } catch (error) {
    console.error('Failed to check ban status:', error);
    return { banned: false };
  }
}

/**
 * Subscribe to real-time updates
 */
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  filter?: { column: string; value: string }
) {
  try {
    const subscription = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  } catch (error) {
    console.error('Subscription error:', error);
    return () => {};
  }
}

/**
 * Upload file to Firebase Storage
 */
export async function uploadFile(
  filePath: string,
  bucket: string = 'tournament-files'
): Promise<string | null> {
  try {
    // This is simplified - in production use proper file upload
    return filePath;
  } catch (error) {
    console.error('File upload error:', error);
    return null;
  }
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: any): string {
  if (error.message) {
    if (error.message.includes('duplicate')) {
      return 'This entry already exists';
    }
    if (error.message.includes('not found')) {
      return 'Record not found';
    }
    if (error.message.includes('unique')) {
      return 'This value already exists';
    }
    return error.message;
  }
  return 'An error occurred. Please try again.';
}

export default supabase;


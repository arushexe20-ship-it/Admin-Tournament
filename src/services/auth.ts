// src/services/auth.ts
// Handle login, signup, and authentication

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// SIGNUP
// ============================================

export async function signup(
  email: string,
  password: string,
  fullName: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // Validate inputs
    if (!email || !password || !fullName) {
      return { success: false, error: 'All fields are required' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    if (!email.includes('@')) {
      return { success: false, error: 'Invalid email address' };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return { success: false, error: 'Email already exists' };
      }
      return { success: false, error: authError.message };
    }

    if (!authData.user?.id) {
      return { success: false, error: 'Failed to create user' };
    }

    // Create user record in users table
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          name: fullName,
          role: 'player', // Default role
          status: 'active',
        },
      ]);

    if (profileError) {
      // Clean up: delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: 'Failed to create profile' };
    }

    return {
      success: true,
      userId: authData.user.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Signup failed',
    };
  }
}

// ============================================
// LOGIN
// ============================================

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    // Validate inputs
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Invalid email or password' };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Login failed' };
    }

    // Get user profile to check role and ban status
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return { success: false, error: 'Failed to fetch user profile' };
    }

    // Check if user is banned
    const { data: banData } = await supabase
      .from('bans')
      .select('*')
      .eq('user_id', data.user.id)
      .eq('status', 'active')
      .single();

    if (banData && (!banData.expires_at || new Date(banData.expires_at) > new Date())) {
      // User is banned
      await supabase.auth.signOut();
      return {
        success: false,
        error: `Your account has been banned. Reason: ${banData.reason}. Expires: ${banData.expires_at || 'Permanent'}`,
      };
    }

    // Save session
    await AsyncStorage.setItem('user_id', data.user.id);
    await AsyncStorage.setItem('user_email', data.user.email || '');

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        ...userProfile,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Login failed',
    };
  }
}

// ============================================
// LOGOUT
// ============================================

export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    // Clear local storage
    await AsyncStorage.removeItem('user_id');
    await AsyncStorage.removeItem('user_email');

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Logout failed',
    };
  }
}

// ============================================
// RESET PASSWORD
// ============================================

export async function resetPassword(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!email) {
      return { success: false, error: 'Email is required' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'exp://localhost:19000/reset-password',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to reset password',
    };
  }
}

// ============================================
// UPDATE PASSWORD
// ============================================

export async function updatePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters',
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update password',
    };
  }
}

// ============================================
// GET CURRENT SESSION
// ============================================

export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return data.session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

// ============================================
// GET CURRENT USER FULL PROFILE
// ============================================

export async function getCurrentUserProfile() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Get full user profile from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return null;
    }

    // Get player profile if exists
    const { data: playerProfile } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return {
      ...userProfile,
      playerProfile: playerProfile || null,
    };
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
}

// ============================================
// UPDATE PLAYER PROFILE
// ============================================

export async function updatePlayerProfile(
  userId: string,
  gameName: string,
  gameUid: string,
  upiId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if profile exists
    const { data: existing } = await supabase
      .from('player_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing profile
      const { error } = await supabase
        .from('player_profiles')
        .update({
          game_name: gameName,
          game_uid: gameUid,
          upi_id: upiId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Create new profile
      const { error } = await supabase
        .from('player_profiles')
        .insert([
          {
            user_id: userId,
            game_name: gameName,
            game_uid: gameUid,
            upi_id: upiId,
          },
        ]);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update profile',
    };
  }
}

// ============================================
// UPDATE USER NAME
// ============================================

export async function updateUserName(
  userId: string,
  fullName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update name',
    };
  }
}

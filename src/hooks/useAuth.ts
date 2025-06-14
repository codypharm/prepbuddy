import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { User, AuthState } from '../types/user';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthStore } from '../stores/useAuthStore';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (updates: Partial<User['profile']>) => Promise<void>;
  updatePreferences: (updates: Partial<User['preferences']>) => Promise<void>;
  updateUserStats: (stats: Partial<User['stats']>) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = (): AuthContextType => {
  const { setTheme } = useTheme();
  const { 
    user, 
    profile, 
    isAuthenticated, 
    isLoading, 
    error, 
    signIn: storeSignIn, 
    signUp: storeSignUp, 
    signOut: storeSignOut, 
    updateProfile: storeUpdateProfile,
    clearError: storeClearError
  } = useAuthStore();

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      await storeSignIn(email, password);
      
      // Apply user's theme preference if available
      if (profile?.preferences?.theme) {
        setTheme(profile.preferences.theme as 'light' | 'dark');
      }
    } catch (error) {
      // Error is handled by the auth store
      throw error;
    }
  }, [storeSignIn, profile?.preferences?.theme, setTheme]);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<void> => {
    try {
      await storeSignUp(email, password, name);
    } catch (error) {
      // Error is handled by the auth store
      throw error;
    }
  }, [storeSignUp]);

  const signOut = useCallback(() => {
    storeSignOut();
  }, [storeSignOut]);

  const updateProfile = useCallback(async (updates: Partial<User['profile']>): Promise<void> => {
    if (!isAuthenticated || !profile) return;
    
    try {
      await storeUpdateProfile({
        bio: updates.bio,
        learning_goals: updates.learningGoals,
        preferred_study_time: updates.preferredStudyTime as any,
        study_level: updates.studyLevel as any,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [isAuthenticated, profile, storeUpdateProfile]);

  const updatePreferences = useCallback(async (updates: Partial<User['preferences']>): Promise<void> => {
    if (!isAuthenticated || !profile) return;
    
    try {
      const newPreferences = { ...profile.preferences, ...updates };
      
      await storeUpdateProfile({
        preferences: newPreferences,
      });
      
      // If it's a theme update, use the ThemeContext's setTheme function directly
      if (updates.theme && (updates.theme === 'light' || updates.theme === 'dark')) {
        setTheme(updates.theme);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }, [isAuthenticated, profile, storeUpdateProfile, setTheme]);

  const updateUserStats = useCallback((stats: Partial<User['stats']>) => {
    if (!isAuthenticated || !profile) return;
    
    // Check if stats are actually different to avoid unnecessary updates
    const hasChanges = Object.entries(stats).some(
      ([key, value]) => profile.stats[key as keyof typeof profile.stats] !== value
    );
    
    // Only update if there are actual changes
    if (!hasChanges) return;
    
    // Update database in background
    const updateDatabase = async () => {
      try {
        await storeUpdateProfile({
          stats: { ...profile.stats, ...stats },
        });
      } catch (error) {
        console.error('Error updating user stats:', error);
      }
    };
    
    // Use setTimeout to break the circular dependency
    setTimeout(updateDatabase, 0);
  }, [isAuthenticated, profile, storeUpdateProfile]);

  const clearError = useCallback(() => {
    storeClearError();
  }, [storeClearError]);

  return {
    user: profile ? {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar_url,
      createdAt: new Date(profile.created_at || ''),
      lastLoginAt: new Date(profile.last_login_at || ''),
      preferences: profile.preferences || {
        theme: 'light',
        notifications: true,
        studyReminders: true,
        weeklyReports: true,
      },
      profile: {
        bio: profile.bio || '',
        learningGoals: profile.learning_goals || [],
        preferredStudyTime: profile.preferred_study_time || 'evening',
        timezone: profile.timezone || 'UTC',
        studyLevel: profile.study_level || 'intermediate',
      },
      stats: profile.stats || {
        totalStudyTime: 0,
        plansCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalXP: 0,
        level: 1,
      },
    } : null,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePreferences,
    updateUserStats,
    clearError,
  };
};

export { AuthContext };
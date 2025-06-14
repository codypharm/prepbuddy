import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/useAuthStore';
import { useStudyPlanStore } from '../stores/useStudyPlanStore';
import { useTaskCompletionStore } from '../stores/useTaskCompletionStore';
import { useQuizStore } from '../stores/useQuizStore';

export const useSupabaseSync = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { syncWithSupabase: syncStudyPlans } = useStudyPlanStore();
  const { fetchCompletions } = useTaskCompletionStore();
  const { fetchQuizResults } = useQuizStore();

  const syncAll = useCallback(async () => {
    // Only sync if user is authenticated and we have a valid user object
    if (!isAuthenticated || !user) {
      console.log('Skipping sync: user not authenticated or user object missing');
      return;
    }

    try {
      // Add a small delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify auth session is still valid before syncing
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('Skipping sync: no valid session found');
        return;
      }
      
      await Promise.all([
        syncStudyPlans(),
        fetchCompletions(),
        fetchQuizResults(),
      ]);
    } catch (error) {
      console.error('Sync failed:', error);
      // Don't throw the error to prevent cascading failures
    }
  }, [isAuthenticated, user, syncStudyPlans, fetchCompletions, fetchQuizResults]);

  // Initial sync when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Add a delay to ensure the session is fully established
      const timeoutId = setTimeout(() => {
        syncAll();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, user, syncAll]);

  // Periodic sync every 5 minutes
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(syncAll, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [isAuthenticated, user, syncAll]);

  // Sync on window focus (when user returns to tab)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleFocus = () => {
      syncAll();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, user, syncAll]);

  return { syncAll };
};
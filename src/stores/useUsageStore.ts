import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, handleSupabaseError, checkAuth } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

interface UsageData {
  studyPlansCreated: number;
  aiRequests: number;
  fileUploads: number;
  studyGroupsCreated: number;
  storageUsed: number; // in bytes
  month: string; // YYYY-MM format
}

interface UsageState {
  usage: UsageData;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  getUsage: () => Promise<UsageData>;
  incrementUsage: (metric: keyof Omit<UsageData, 'month'>, amount?: number) => Promise<void>;
  resetUsage: () => Promise<void>;
  clearError: () => void;
}

// Helper to get current month in YYYY-MM format
const getCurrentMonth = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// Initialize with empty usage for current month
const initialUsage: UsageData = {
  studyPlansCreated: 0,
  aiRequests: 0,
  fileUploads: 0,
  studyGroupsCreated: 0,
  storageUsed: 0,
  month: getCurrentMonth(),
};

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      usage: initialUsage,
      isLoading: false,
      error: null,

      getUsage: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Check if we need to reset for a new month
          const currentMonth = getCurrentMonth();
          const { usage } = get();
          
          if (usage.month !== currentMonth) {
            // Reset usage for new month
            set({ 
              usage: { ...initialUsage, month: currentMonth },
              isLoading: false 
            });
            return { ...initialUsage, month: currentMonth };
          }
          
          // Try to fetch from database if user is authenticated
          const { isAuthenticated } = useAuthStore.getState();
          
          if (isAuthenticated) {
            try {
              const { user, error: authError } = await checkAuth();
              
              if (authError || !user) {
                console.log('User not authenticated or session invalid, returning local usage.');
                set({ isLoading: false });
                return usage;
              }
              
              // Fetch usage from database
              const { data, error } = await supabase
                .from('user_usage')
                .select('*')
                .eq('user_id', user.id)
                .eq('month', currentMonth)
                .maybeSingle();
              
              if (error) throw error;
              
              if (data) {
                // Convert database format to our format
                const dbUsage: UsageData = {
                  studyPlansCreated: data.study_plans_created || 0,
                  aiRequests: data.ai_requests || 0,
                  fileUploads: data.file_uploads || 0,
                  studyGroupsCreated: data.study_groups_created || 0,
                  storageUsed: data.storage_used || 0,
                  month: data.month,
                };
                
                // Update local state with database values
                set({ 
                  usage: dbUsage,
                  isLoading: false 
                });
                
                return dbUsage;
              }
            } catch (error) {
              console.error('Failed to fetch usage from database:', error);
              // Continue with local usage data
            }
          }
          
          set({ isLoading: false });
          return usage;
        } catch (error: any) {
          set({
            isLoading: false,
            error: handleSupabaseError(error),
          });
          return get().usage;
        }
      },

      incrementUsage: async (metric, amount = 1) => {
        try {
          // Update local state first for immediate feedback
          const currentMonth = getCurrentMonth();
          const { usage } = get();
          
          // Reset if it's a new month
          if (usage.month !== currentMonth) {
            const newUsage = { ...initialUsage, month: currentMonth };
            newUsage[metric] = amount;
            set({ usage: newUsage });
          } else {
            // Increment the specified metric
            set({
              usage: {
                ...usage,
                [metric]: usage[metric] + amount,
              },
            });
          }
          
          // Try to update in database if user is authenticated
          const { isAuthenticated } = useAuthStore.getState();
          
          if (isAuthenticated) {
            try {
              const { user, error: authError } = await checkAuth();
              
              if (authError || !user) {
                console.log('User not authenticated or session invalid, skipping database update.');
                return;
              }
              
              // Prepare database field name (convert camelCase to snake_case)
              const dbField = metric.replace(/([A-Z])/g, '_$1').toLowerCase();
              
              // Upsert usage record
              const { error } = await supabase
                .from('user_usage')
                .upsert({
                  user_id: user.id,
                  month: currentMonth,
                  [dbField]: get().usage[metric],
                }, {
                  onConflict: 'user_id,month',
                  ignoreDuplicates: false,
                });
              
              if (error) throw error;
            } catch (error) {
              console.error('Failed to update usage in database:', error);
              // Continue with local update even if database update fails
            }
          }
        } catch (error: any) {
          set({ error: handleSupabaseError(error) });
          // Don't throw - we don't want to block the user if tracking fails
        }
      },

      resetUsage: async () => {
        const currentMonth = getCurrentMonth();
        
        set({
          usage: { ...initialUsage, month: currentMonth },
        });
        
        // Try to reset in database if user is authenticated
        const { isAuthenticated } = useAuthStore.getState();
        
        if (isAuthenticated) {
          try {
            const { user, error: authError } = await checkAuth();
            
            if (authError || !user) {
              console.log('User not authenticated or session invalid, skipping database reset.');
              return;
            }
            
            // Delete current month's usage record
            const { error } = await supabase
              .from('user_usage')
              .delete()
              .eq('user_id', user.id)
              .eq('month', currentMonth);
            
            if (error) throw error;
          } catch (error) {
            console.error('Failed to reset usage in database:', error);
            set({ error: handleSupabaseError(error) });
          }
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'usage-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        usage: state.usage,
      }),
    }
  )
);
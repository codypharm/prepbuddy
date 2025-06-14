import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, handleSupabaseError, requireAuth } from '../lib/supabase';
import { StudyPlan } from '../App';
import { Database } from '../types/database';
import { useSubscriptionStore } from './useSubscriptionStore';
import { useUsageStore } from './useUsageStore';

type StudyPlanRow = Database['public']['Tables']['study_plans']['Row'];
type StudyPlanInsert = Database['public']['Tables']['study_plans']['Insert'];
type StudyPlanUpdate = Database['public']['Tables']['study_plans']['Update'];

interface StudyPlanState {
  studyPlans: StudyPlan[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: number;
  
  // Actions
  fetchStudyPlans: () => Promise<void>;
  createStudyPlan: (plan: Omit<StudyPlan, 'id' | 'createdAt'>) => Promise<StudyPlan>;
  updateStudyPlan: (id: string, updates: Partial<StudyPlan>) => Promise<void>;
  deleteStudyPlan: (id: string) => Promise<void>;
  syncWithSupabase: () => Promise<void>;
  clearError: () => void;
  
  // Local-only actions (for offline support)
  addStudyPlanLocally: (plan: StudyPlan) => void;
  updateStudyPlanLocally: (id: string, updates: Partial<StudyPlan>) => void;
  deleteStudyPlanLocally: (id: string) => void;
}

// Helper function to convert Supabase row to StudyPlan
const convertToStudyPlan = (row: StudyPlanRow): StudyPlan => ({
  id: row.id,
  title: row.title,
  description: row.description,
  duration: row.duration,
  difficulty: row.difficulty,
  topics: row.topics || [],
  schedule: (row.schedule as any) || [],
  files: (row.files as any) || [],
  progress: (row.progress as any) || {
    completedTasks: 0,
    totalTasks: 0,
    completedDays: 0,
    totalDays: 0,
  },
  createdAt: new Date(row.created_at || ''),
});

// Helper function to convert StudyPlan to Supabase insert
const convertToSupabaseInsert = (plan: StudyPlan, userId: string): StudyPlanInsert => ({
  id: plan.id,
  user_id: userId,
  title: plan.title,
  description: plan.description,
  duration: plan.duration,
  difficulty: plan.difficulty as Database['public']['Enums']['study_difficulty'],
  topics: plan.topics,
  schedule: plan.schedule as any,
  files: plan.files as any,
  progress: plan.progress as any,
  created_at: plan.createdAt.toISOString(),
  updated_at: new Date().toISOString(),
});

export const useStudyPlanStore = create<StudyPlanState>()(
  persist(
    (set, get) => ({
      studyPlans: [],
      isLoading: false,
      error: null,
      lastSyncTime: 0,

      fetchStudyPlans: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const user = await requireAuth();
          
          const { data, error } = await supabase
            .from('study_plans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const studyPlans = data.map(convertToStudyPlan);
          
          set({
            studyPlans,
            isLoading: false,
            lastSyncTime: Date.now(),
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: handleSupabaseError(error),
          });
        }
      },

      createStudyPlan: async (planData) => {
        try {
          const user = await requireAuth();
          
          // Check subscription limits before creating
          const { getCurrentPlan, isSubscribed } = useSubscriptionStore.getState();
          const { getUsage, incrementUsage } = useUsageStore.getState();
          
          const currentPlan = getCurrentPlan();
          const usage = await getUsage();
          
          // Check if user has reached their plan limit
          if (currentPlan.limits.studyPlans !== 'unlimited') {
            if (usage.studyPlansCreated >= currentPlan.limits.studyPlans) {
              throw new Error(
                `You've reached your limit of ${currentPlan.limits.studyPlans} study plans per month. ` +
                `Please upgrade your plan to create more study plans.`
              );
            }
          }
          
          const plan: StudyPlan = {
            ...planData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
          };

          // Add locally first for immediate UI update
          get().addStudyPlanLocally(plan);

          // Then sync to Supabase
          const insertData = convertToSupabaseInsert(plan, user.id);
          
          const { error } = await supabase
            .from('study_plans')
            .insert(insertData);

          if (error) {
            // Remove from local state if Supabase insert failed
            get().deleteStudyPlanLocally(plan.id);
            throw error;
          }
          
          // Track usage after successful creation
          await incrementUsage('studyPlansCreated');

          return plan;
        } catch (error: any) {
          set({ error: handleSupabaseError(error) });
          throw error;
        }
      },

      updateStudyPlan: async (id, updates) => {
        try {
          const user = await requireAuth();
          
          // Update locally first
          get().updateStudyPlanLocally(id, updates);

          // Then sync to Supabase
          const updateData: StudyPlanUpdate = {
            ...updates,
            updated_at: new Date().toISOString(),
          };

          // Convert complex fields
          if (updates.schedule) updateData.schedule = updates.schedule as any;
          if (updates.files) updateData.files = updates.files as any;
          if (updates.progress) updateData.progress = updates.progress as any;
          if (updates.difficulty) updateData.difficulty = updates.difficulty as Database['public']['Enums']['study_difficulty'];

          const { error } = await supabase
            .from('study_plans')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
        } catch (error: any) {
          set({ error: handleSupabaseError(error) });
          throw error;
        }
      },

      deleteStudyPlan: async (id) => {
        try {
          const user = await requireAuth();
          
          // Remove locally first
          get().deleteStudyPlanLocally(id);

          // Then remove from Supabase
          const { error } = await supabase
            .from('study_plans')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
        } catch (error: any) {
          set({ error: handleSupabaseError(error) });
          throw error;
        }
      },

      syncWithSupabase: async () => {
        try {
          await get().fetchStudyPlans();
        } catch (error) {
          console.error('Sync failed:', error);
        }
      },

      clearError: () => set({ error: null }),

      // Local-only actions
      addStudyPlanLocally: (plan) => {
        set((state) => ({
          studyPlans: [plan, ...state.studyPlans],
        }));
      },

      updateStudyPlanLocally: (id, updates) => {
        set((state) => ({
          studyPlans: state.studyPlans.map((plan) =>
            plan.id === id ? { ...plan, ...updates } : plan
          ),
        }));
      },

      deleteStudyPlanLocally: (id) => {
        set((state) => ({
          studyPlans: state.studyPlans.filter((plan) => plan.id !== id),
        }));
      },
    }),
    {
      name: 'study-plans-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        studyPlans: state.studyPlans,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);
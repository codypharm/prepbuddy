import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, handleSupabaseError, requireAuth } from '../lib/supabase';
import { Database } from '../types/database';

type TaskCompletionRow = Database['public']['Tables']['task_completions']['Row'];
type TaskCompletionInsert = Database['public']['Tables']['task_completions']['Insert'];

interface TaskCompletion {
  id: string;
  userId: string;
  studyPlanId: string;
  taskId: string;
  dayIndex: number;
  taskIndex: number;
  completedAt: Date;
}

interface TaskCompletionState {
  completions: TaskCompletion[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCompletions: (studyPlanId?: string) => Promise<void>;
  markTaskComplete: (studyPlanId: string, dayIndex: number, taskIndex: number) => Promise<void>;
  markTaskIncomplete: (studyPlanId: string, dayIndex: number, taskIndex: number) => Promise<void>;
  isTaskCompleted: (studyPlanId: string, dayIndex: number, taskIndex: number) => boolean;
  getCompletedTasksForPlan: (studyPlanId: string) => TaskCompletion[];
  clearError: () => void;
  
  // Local-only actions
  addCompletionLocally: (completion: TaskCompletion) => void;
  removeCompletionLocally: (studyPlanId: string, dayIndex: number, taskIndex: number) => void;
}

// Helper function to convert Supabase row to TaskCompletion
const convertToTaskCompletion = (row: TaskCompletionRow): TaskCompletion => ({
  id: row.id,
  userId: row.user_id,
  studyPlanId: row.study_plan_id,
  taskId: row.task_id,
  dayIndex: row.day_index,
  taskIndex: row.task_index,
  completedAt: new Date(row.completed_at || ''),
});

export const useTaskCompletionStore = create<TaskCompletionState>()(
  persist(
    (set, get) => ({
      completions: [],
      isLoading: false,
      error: null,

      fetchCompletions: async (studyPlanId) => {
        set({ isLoading: true, error: null });
        
        try {
          const user = await requireAuth();
          
          let query = supabase
            .from('task_completions')
            .select('*')
            .eq('user_id', user.id);

          if (studyPlanId) {
            query = query.eq('study_plan_id', studyPlanId);
          }

          const { data, error } = await query.order('completed_at', { ascending: false });

          if (error) throw error;

          const completions = data.map(convertToTaskCompletion);
          
          set({
            completions,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: handleSupabaseError(error),
          });
        }
      },

      markTaskComplete: async (studyPlanId, dayIndex, taskIndex) => {
        try {
          const user = await requireAuth();
          const taskId = `${dayIndex}-${taskIndex}`;
          
          // Check if already completed
          const existing = get().completions.find(
            c => c.studyPlanId === studyPlanId && c.dayIndex === dayIndex && c.taskIndex === taskIndex
          );
          
          if (existing) return;

          const completion: TaskCompletion = {
            id: crypto.randomUUID(),
            userId: user.id,
            studyPlanId,
            taskId,
            dayIndex,
            taskIndex,
            completedAt: new Date(),
          };

          // Add locally first
          get().addCompletionLocally(completion);

          // Then sync to Supabase
          const insertData: TaskCompletionInsert = {
            id: completion.id,
            user_id: completion.userId,
            study_plan_id: completion.studyPlanId,
            task_id: completion.taskId,
            day_index: completion.dayIndex,
            task_index: completion.taskIndex,
            completed_at: completion.completedAt.toISOString(),
            created_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('task_completions')
            .insert(insertData);

          if (error) {
            // Remove from local state if Supabase insert failed
            get().removeCompletionLocally(studyPlanId, dayIndex, taskIndex);
            throw error;
          }
        } catch (error: any) {
          set({ error: handleSupabaseError(error) });
          throw error;
        }
      },

      markTaskIncomplete: async (studyPlanId, dayIndex, taskIndex) => {
        try {
          const user = await requireAuth();
          
          // Remove locally first
          get().removeCompletionLocally(studyPlanId, dayIndex, taskIndex);

          // Then remove from Supabase
          const { error } = await supabase
            .from('task_completions')
            .delete()
            .eq('user_id', user.id)
            .eq('study_plan_id', studyPlanId)
            .eq('day_index', dayIndex)
            .eq('task_index', taskIndex);

          if (error) throw error;
        } catch (error: any) {
          set({ error: handleSupabaseError(error) });
          throw error;
        }
      },

      isTaskCompleted: (studyPlanId, dayIndex, taskIndex) => {
        return get().completions.some(
          c => c.studyPlanId === studyPlanId && c.dayIndex === dayIndex && c.taskIndex === taskIndex
        );
      },

      getCompletedTasksForPlan: (studyPlanId) => {
        return get().completions.filter(c => c.studyPlanId === studyPlanId);
      },

      clearError: () => set({ error: null }),

      // Local-only actions
      addCompletionLocally: (completion) => {
        set((state) => ({
          completions: [completion, ...state.completions],
        }));
      },

      removeCompletionLocally: (studyPlanId, dayIndex, taskIndex) => {
        set((state) => ({
          completions: state.completions.filter(
            c => !(c.studyPlanId === studyPlanId && c.dayIndex === dayIndex && c.taskIndex === taskIndex)
          ),
        }));
      },
    }),
    {
      name: 'task-completions-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        completions: state.completions,
      }),
    }
  )
);
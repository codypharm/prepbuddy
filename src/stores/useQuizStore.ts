import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, handleSupabaseError, checkAuth } from '../lib/supabase';
import { QuizResult } from '../App';
import { Database } from '../types/database';

type QuizResultRow = Database['public']['Tables']['quiz_results']['Row'];
type QuizResultInsert = Database['public']['Tables']['quiz_results']['Insert'];

interface QuizState {
  quizResults: QuizResult[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchQuizResults: (studyPlanId?: string) => Promise<void>;
  saveQuizResult: (result: QuizResult, studyPlanId: string) => Promise<void>;
  getQuizResult: (quizId: string) => QuizResult | null;
  getQuizResultsForPlan: (studyPlanId: string) => QuizResult[];
  clearError: () => void;
  
  // Local-only actions
  addQuizResultLocally: (result: QuizResult) => void;
}

// Helper function to convert Supabase row to QuizResult
const convertToQuizResult = (row: QuizResultRow): QuizResult => ({
  quizId: row.quiz_id,
  score: row.score,
  answers: row.answers || [],
  completedAt: new Date(row.completed_at || ''),
  passed: row.passed,
});

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quizResults: [],
      isLoading: false,
      error: null,

      fetchQuizResults: async (studyPlanId) => {
        set({ isLoading: true, error: null });
        
        try {
          // Use checkAuth instead of requireAuth to avoid throwing
          const { user, error: authError } = await checkAuth();
          
          if (authError || !user) {
            console.log('User not authenticated, skipping quiz results fetch');
            set({ isLoading: false });
            return;
          }
          
          let query = supabase
            .from('quiz_results')
            .select('*')
            .eq('user_id', user.id);

          if (studyPlanId) {
            query = query.eq('study_plan_id', studyPlanId);
          }

          const { data, error } = await query.order('completed_at', { ascending: false });

          if (error) throw error;

          const quizResults = data.map(convertToQuizResult);
          
          set({
            quizResults,
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch quiz results:', error);
          set({
            isLoading: false,
            error: handleSupabaseError(error),
          });
        }
      },

      saveQuizResult: async (result, studyPlanId) => {
        try {
          const { user, error: authError } = await checkAuth();
          
          if (authError || !user) {
            throw new Error('Authentication required to save quiz results');
          }
          
          // Add locally first
          get().addQuizResultLocally(result);

          // Then sync to Supabase
          const insertData: QuizResultInsert = {
            id: crypto.randomUUID(),
            user_id: user.id,
            study_plan_id: studyPlanId,
            quiz_id: result.quizId,
            score: result.score,
            answers: result.answers,
            passed: result.passed,
            completed_at: result.completedAt.toISOString(),
            created_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('quiz_results')
            .insert(insertData);

          if (error) throw error;
        } catch (error: any) {
          set({ error: handleSupabaseError(error) });
          throw error;
        }
      },

      getQuizResult: (quizId) => {
        return get().quizResults.find(r => r.quizId === quizId) || null;
      },

      getQuizResultsForPlan: (studyPlanId) => {
        // Note: This would need studyPlanId to be stored in QuizResult
        // For now, return all results
        return get().quizResults;
      },

      clearError: () => set({ error: null }),

      // Local-only actions
      addQuizResultLocally: (result) => {
        set((state) => ({
          quizResults: [result, ...state.quizResults.filter(r => r.quizId !== result.quizId)],
        }));
      },
    }),
    {
      name: 'quiz-results-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        quizResults: state.quizResults,
      }),
    }
  )
);
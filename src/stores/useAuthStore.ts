import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: SupabaseUser | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            // Fetch user profile with better error handling
            let profile = null;
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .maybeSingle();

              if (profileError) {
                console.error('Profile fetch error:', profileError);
              } else {
                profile = profileData;
              }
            } catch (profileError) {
              console.error('Profile fetch failed:', profileError);
              // Continue without profile
            }

            set({
              user: data.user,
              profile: profile,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          }
        } catch (error: any) {
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: handleSupabaseError(error),
          });
          throw error;
        }
      },

      signUp: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // First check if the email already exists
          const { data: existingUsers, error: checkError } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', email)
            .maybeSingle();
            
          if (checkError) {
            console.error('Error checking existing user:', checkError);
            // Continue with signup attempt even if check fails
          } else if (existingUsers) {
            // Email already exists, throw a clear error
            throw new Error(`An account with email ${email} already exists. Please sign in instead.`);
          }
          
          // Sign up the user with metadata
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
              },
              // Don't require email verification for better UX
              emailRedirectTo: `${window.location.origin}`,
            },
          });

          if (error) {
            // Handle rate limiting specifically
            if (error.message?.includes('rate_limit') || error.message?.includes('7 seconds')) {
              throw new Error('Too many sign-up attempts. Please wait a moment before trying again.');
            }
            throw error;
          }

          // For email verification flow, we don't set the user as authenticated yet
          // The user will be authenticated after they verify their email
          set({
            isLoading: false,
            error: null,
          });
          
          // Return without throwing an error - the UI will show verification message
        } catch (error: any) {
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: handleSupabaseError(error),
          });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: handleSupabaseError(error),
          });
        }
      },

      updateProfile: async (updates: Partial<Profile>) => {
        const { user } = get();
        if (!user) throw new Error('Not authenticated');

        try {
          const { data, error } = await supabase
            .from('profiles')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select()
            .single();

          if (error) throw error;

          set({ profile: data });
        } catch (error: any) {
          set({ error: handleSupabaseError(error) });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Fetch user profile with better error handling
            let profile = null;
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              if (profileError) {
                console.error('Profile fetch error:', profileError);
              } else {
                profile = profileData;
              }
            } catch (profileError) {
              console.error('Profile fetch failed during initialization:', profileError);
            }

            set({
              user: session.user,
              profile: profile,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error: any) {
          console.error('Auth initialization error:', error);
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: handleSupabaseError(error),
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist essential data, not sensitive info
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Set up auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  const { initialize } = useAuthStore.getState();
  
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    initialize();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }
});
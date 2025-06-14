import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Error handling utility
export const handleSupabaseError = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

// Authentication utilities
export const requireAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error(handleSupabaseError(error));
  }
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  
  return session.user;
}

export const checkAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return { user: null, error: handleSupabaseError(error) };
    }
    
    return { user: session?.user || null, error: null };
  } catch (error) {
    return { user: null, error: handleSupabaseError(error) };
  }
}
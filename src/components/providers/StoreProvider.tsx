import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSupabaseSync } from '../../hooks/useSupabaseSync';

interface StoreProviderProps {
  children: React.ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const { initialize } = useAuthStore();
  
  // Initialize auth store
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Set up sync
  useSupabaseSync();

  return <>{children}</>;
};
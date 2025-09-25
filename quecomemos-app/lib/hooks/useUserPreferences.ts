'use client';

import { useUser } from '@/lib/contexts/UserContext';

interface UserPreferences {
  preferences: any[];
  dietaryRestrictions: any[];
  hasPreferences: boolean;
}

interface UseUserPreferencesReturn {
  userPreferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook de compatibilidad que usa el UserContext.
 * Se mantiene para compatibilidad con componentes existentes.
 */
export function useUserPreferences(): UseUserPreferencesReturn {
  const { userData, loading, error,  } = useUser();

  return {
    userPreferences: userData.preferences,
    loading,
    error,

  };
}
'use client';

import { useUser } from '@/lib/contexts/UserContext';

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  role: string;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook de compatibilidad que usa el UserContext.
 * Se mantiene para compatibilidad con componentes existentes.
 */
export function useUserProfile(): UseUserProfileReturn {
  const { userData, loading, error, refetch } = useUser();

  return {
    profile: userData.profile,
    loading,
    error,
    refetch,
  };
}
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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

// Cache simple en memoria con TTL
const profileCache = new Map<string, { data: UserProfile; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchProfile = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const { data: claims, error: claimsError } = await supabase.auth.getClaims();
      
      if (claimsError || !claims?.claims) {
        throw new Error('No authenticated user');
      }

      const userId = claims.claims.sub;
      const now = Date.now();
      
      // Verificar cache (saltar si forceRefresh es true)
      const cached = profileCache.get(userId);
      if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_TTL) {
        // Even with cache, get fresh email from auth as it might have been updated
        const { data: { user } } = await supabase.auth.getUser();
        const emailFromAuth = user?.email || '';
        
        const profileWithFreshEmail = {
          ...cached.data,
          email: emailFromAuth
        };
        
        setProfile(profileWithFreshEmail);
        setLoading(false);
        return;
      }

      // Fetch from API
      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData.session?.access_token;

      const response = await fetch(`http://localhost:3005/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await response.json();
      
      // Get email from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      const emailFromAuth = user?.email || '';
      
      // Merge profile data with email from auth
      const completeProfile = {
        ...profileData,
        email: emailFromAuth
      };
      
      // Actualizar cache
      profileCache.set(userId, { 
        data: completeProfile, 
        timestamp: now 
      });
      
      setProfile(completeProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    // Limpiar todo el cache para forzar fetch
    profileCache.clear();
    
    const { data: claims } = await supabase.auth.getClaims();
    if (claims?.claims?.sub) {
      // Asegurar que el cache específico del usuario esté limpio
      profileCache.delete(claims.claims.sub);
    }
    
    await fetchProfile(true); // Forzar refresh
  };

  useEffect(() => {
    const initializeProfile = async () => {
      // Verificar si ya tenemos data válida en cache antes de hacer fetch
      const { data: claims } = await supabase.auth.getClaims();
      if (claims?.claims?.sub) {
        const userId = claims.claims.sub;
        const now = Date.now();
        const cached = profileCache.get(userId);
        
        // Si tenemos cache válido, usarlo directamente sin loading pero con email fresco
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
          // Get fresh email from auth even when using cache
          const { data: { user } } = await supabase.auth.getUser();
          const emailFromAuth = user?.email || '';
          
          const profileWithFreshEmail = {
            ...cached.data,
            email: emailFromAuth
          };
          
          setProfile(profileWithFreshEmail);
          setLoading(false);
          return; // No hacer fetch si el cache es válido
        }
      }
      
      // Solo hacer fetch si no hay cache válido
      await fetchProfile();
    };

    initializeProfile();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          fetchProfile(true); // Forzar refresh en cambios de auth
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
          profileCache.clear();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]); // Agregar supabase como dependencia

  return { profile, loading, error, refetch };
}
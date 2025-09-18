'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserPreferences {
  preferences: any[];
  dietaryRestrictions: any[];
  hasPreferences: boolean;
}

interface UseUserPreferencesReturn {
  userPreferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Cache for preferences data
const preferencesCache = new Map<string, { data: UserPreferences; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useUserPreferences(): UseUserPreferencesReturn {
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPreferences = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const { data: claims, error: claimsError } = await supabase.auth.getClaims();
      
      if (claimsError || !claims?.claims) {
        throw new Error('No authenticated user');
      }

      const userId = claims.claims.sub;
      const now = Date.now();
      
      // Check cache (skip if forceRefresh is true)
      const cached = preferencesCache.get(userId);
      if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_TTL) {
        setUserPreferences(cached.data);
        setLoading(false);
        return;
      }

      // Fetch from API
      const { data: sessionData } = await supabase.auth.getSession();
      const jwt = sessionData.session?.access_token;

      if (!jwt) {
        throw new Error('No valid session found');
      }

      const response = await fetch(`http://localhost:3005/profile/${userId}/full`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user preferences');
      }

      const data = await response.json();
      
      // Extract preferences and dietary restrictions
      const preferences = data.Preference?.map((pref: { PreferenceID: any }) => pref.PreferenceID) || [];
      const dietaryRestrictions = data.DietaryRestriction?.map((dr: { DietaryRestrictionID: any }) => dr.DietaryRestrictionID) || [];
      
      // Check if user has any preferences or dietary restrictions set
      const hasPreferences = preferences.length > 0 || dietaryRestrictions.length > 0;
      
      const preferencesData: UserPreferences = {
        preferences,
        dietaryRestrictions,
        hasPreferences,
      };
      
      // Update cache
      preferencesCache.set(userId, { 
        data: preferencesData, 
        timestamp: now 
      });
      
      setUserPreferences(preferencesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUserPreferences(null);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    // Clear cache to force refresh
    preferencesCache.clear();
    
    const { data: claims } = await supabase.auth.getClaims();
    if (claims?.claims?.sub) {
      preferencesCache.delete(claims.claims.sub);
    }
    
    await fetchPreferences(true); // Force refresh
  };

  useEffect(() => {
    const initializePreferences = async () => {
      // Check if we have valid cached data before fetching
      const { data: claims } = await supabase.auth.getClaims();
      if (claims?.claims?.sub) {
        const userId = claims.claims.sub;
        const now = Date.now();
        const cached = preferencesCache.get(userId);
        
        // If we have valid cache, use it directly without loading
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
          setUserPreferences(cached.data);
          setLoading(false);
          return; // Don't fetch if cache is valid
        }
      }
      
      // Only fetch if we don't have valid cache
      await fetchPreferences();
    };

    initializePreferences();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          fetchPreferences(true); // Force refresh on auth changes
        } else if (event === 'SIGNED_OUT') {
          setUserPreferences(null);
          setLoading(false);
          preferencesCache.clear();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Separate useEffect for the event listener to prevent re-setup on re-renders
  useEffect(() => {
    // Listen to profile update events (like username updates, but also preferences)
    const handleProfileUpdate = async () => {
      // Use the refetch function which properly handles cache clearing
      await refetch();
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, [refetch]); // Include refetch as dependency

  return { userPreferences, loading, error, refetch };
}
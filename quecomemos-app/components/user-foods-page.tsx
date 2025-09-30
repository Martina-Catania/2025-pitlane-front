'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { RoleGate } from './ui/role-based';
import { UserFoods } from './ui/UserFoods';
import { PreferencesWarning } from './custom-components/preferences-warning';
import { UserPreferenceCards } from './user-preference-cards';
import { useEffect, useState } from 'react';
import { AdminSection } from './ui/AdminSection';
import { AdminUserPreview } from './admin-user-preview';
import { useFoods } from '@/lib/contexts/FoodsContext';
import { API_BASE_URL } from '@/lib/config/api';
import { AddFoodForm } from './user-add-meal-form';

export function UserFoodsPage() {
  const { userData, loading, error } = useUser();
  const { fetchFoodsForUser, setFoods, foods } = useFoods();
  const [loadingFoods, setLoadingFoods] = useState(true);
  
  const profile = userData.profile;
  const userPreferences = userData.preferences;
  const preferencesLoading = loading;

  useEffect(() => {
    const fetchFoods = async () => {
      if (profile && (profile.role === "user" || profile.role === "admin")) {
        try {
          // For admin users, fetch all foods regardless of their preferences
          if (profile.role === "admin") {
            const response = await fetch(`${API_BASE_URL}/foods`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const foodsData = await response.json();
              setFoods(foodsData);
            }
          } else {
            // For regular users, use the new efficient filtering
            const userRestrictions = userPreferences?.dietaryRestrictions || [];
            await fetchFoodsForUser(userRestrictions);
          }
        } catch (error) {
          console.error('Error fetching foods:', error);
        }
      }
      setLoadingFoods(false);
    };

    // Admin users can fetch foods immediately when profile is loaded
    // Regular users need to wait for userPreferences to be loaded
    if (!loading && profile) {
      if (profile.role === "admin") {
        fetchFoods();
      } else if (userPreferences) {
        fetchFoods();
      }
    }
  }, [profile, loading, userPreferences, fetchFoodsForUser, setFoods]);

  if (loading || preferencesLoading) {
    return (
      <div className="flex-1 w-full flex flex-col gap-12">
        <div className="mb-4">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="w-24 h-4 bg-gray-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Only show error when not loading and there's an actual error
  if (!loading && error) {
    return (
      <div className="flex-1 w-full flex flex-col gap-12">
        <div className="text-red-500">
          Error loading profile: {error}
        </div>
      </div>
    );
  }

  // If no profile but no error, just return null (user is signing out)
  if (!profile) {
    return null;
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="mb-4">
        <h1 className="font-bold text-2xl text-amber-200">Foods</h1>
        <p className="text-sm text-gray-400">Explore all available foods</p>
      </div>

      {/* UI solo para admin */}
      <RoleGate role="admin" userRole={profile.role}>
        <div className="space-y-8 mt-6">
          <AdminSection />
          <AdminUserPreview />
        </div>
      </RoleGate>

      {/* UI for users */}
      <RoleGate role="user" userRole={profile.role}>
        {/* Show preferences warning if user doesn't have preferences set */}
        {!preferencesLoading && userPreferences && !userPreferences.hasPreferences && (
          <PreferencesWarning className="mb-6" />
        )}
        
        {/* User Preference Cards - only show if user has preferences */}
        {!preferencesLoading && userPreferences && userPreferences.hasPreferences && (
          <UserPreferenceCards />
        )}
          
        {loadingFoods ? (
          <div className="text-gray-500">Loading foods...</div>
        ) : (
          <UserFoods foods={foods} />
        )}
      </RoleGate>


    </div>
  );
}
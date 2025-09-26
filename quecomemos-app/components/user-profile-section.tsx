'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { RoleGate } from './ui/role-based';
import { UserFoods } from './ui/UserFoods';
import { PreferencesWarning } from './custom-components/preferences-warning';
import { useEffect, useState } from 'react';
import { AdminSection } from './ui/AdminSection';
import { useFoods } from '@/lib/contexts/FoodsContext';

export function UserProfileSection() {
  const { userData, loading, error } = useUser();
  const { setFoods, foods } = useFoods();
  const [loadingFoods, setLoadingFoods] = useState(true);
  
  const profile = userData.profile;
  const userPreferences = userData.preferences;
  const preferencesLoading = loading;

  useEffect(() => {
    const fetchFoods = async () => {
      if (profile && (profile.role === "user" || profile.role === "admin")) {
        try {
          const response = await fetch("http://localhost:3005/foods");
          if (response.ok) {
            const foodsData = await response.json();
            setFoods(foodsData);
          }
        } catch (error) {
          console.error('Error fetching foods:', error);
        }
      }
      setLoadingFoods(false);
    };

    if (!loading && profile) {
      fetchFoods();
    }
  }, [profile, loading, setFoods]);

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
        <div className="font-bold text-lg">{profile.username || profile.email}</div>
        <div className="text-sm text-gray-500 capitalize">{profile.role}</div>
      </div>

      {/* UI solo para admin */}
      <RoleGate role="admin" userRole={profile.role}>
        <div className="mt-6">
          <AdminSection />
        </div>
      </RoleGate>

      {/* UI solo para user */}
      <RoleGate role="user" userRole={profile.role}>
        {/* Show preferences warning if user doesn't have preferences set */}
        {!preferencesLoading && userPreferences && !userPreferences.hasPreferences && (
          <PreferencesWarning className="mb-6" />
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
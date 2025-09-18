'use client';

import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useUserPreferences } from '@/lib/hooks/useUserPreferences';
import { RoleGate } from './ui/role-based';
import { AddFoodForm } from './custom-components/add-food-form';
import { UserFoods } from './ui/UserFoods';
import { PreferencesWarning } from './custom-components/preferences-warning';
import { useEffect, useState } from 'react';
import { AdminFoodForm } from './ui/AdminFoodForm';
import { AdminSection } from './ui/AdminSection';

interface Food {
  FoodID: number;
  name: string;
  svgLink?: string;
  dietaryRestrictions?: any[];
  preferences?: any[];
}

export function UserProfileSection() {
  const { profile, loading, error, refetch } = useUserProfile();
  const { userPreferences, loading: preferencesLoading } = useUserPreferences();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);

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
  }, [profile, loading]);

  // Escuchar eventos de actualización de perfil
  useEffect(() => {
    const handleProfileUpdate = () => {
      refetch();
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, [refetch]);

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

  if (error || !profile) {
    return (
      <div className="flex-1 w-full flex flex-col gap-12">
        <div className="text-red-500">
          Error loading profile: {error || 'Unknown error'}
        </div>
      </div>
    );
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
          <AdminSection foods={foods} />
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
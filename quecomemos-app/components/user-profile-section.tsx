'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { AllMeals } from './all-meals';

export function UserProfileSection() {
  const { userData, loading, error } = useUser();
  
  const profile = userData.profile;

  if (loading) {
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

      {/* Show all meals from all users for both admin and regular users */}
      <AllMeals />
    </div>
  );
}
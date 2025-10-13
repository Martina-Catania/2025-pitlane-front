'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { AllMeals } from './all-meals';
import { PreferencesWarning } from './custom-components/preferences-warning';
import DashboardGroupsSection from './groups/DashboardGroupsSection';

export function UserProfileSection() {
  const { userData, loading, error } = useUser();
  
  const profile = userData.profile;

  if (loading) {
    return (
      <div className="flex-1 w-full flex flex-col gap-8">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="w-64 h-8 bg-muted rounded animate-pulse mb-2"></div>
              <div className="w-32 h-5 bg-muted/70 rounded animate-pulse"></div>
            </div>
            <div className="text-right">
              <div className="w-48 h-4 bg-muted/70 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="w-48 h-6 bg-muted rounded animate-pulse"></div>
          <div className="w-full h-32 bg-muted rounded animate-pulse"></div>
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
      {/* Show preferences warning if user doesn't have preferences set */}
      {(!userData.preferences || !userData.preferences.hasPreferences) && (
        <PreferencesWarning className="mb-6" />
      )}

      {/* Dashboard with groups and meals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Groups section */}
        <div>
          <DashboardGroupsSection userId={profile.id} />
        </div>
        
        {/* Meals section */}
        <div>
          <AllMeals />
        </div>
      </div>
    </div>
  );
}
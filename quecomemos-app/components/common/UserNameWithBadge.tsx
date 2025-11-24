'use client';

import React from 'react';
import { PrimaryBadgeDisplay } from '@/components/profile/PrimaryBadgeDisplay';
import { usePrimaryBadge } from '@/lib/hooks/usePrimaryBadge';

interface UserNameWithBadgeProps {
  username: string;
  profileId: string;
  className?: string;
  badgeSize?: 'sm' | 'md' | 'lg';
  usernameClassName?: string;
}

/**
 * Reusable component that displays a username with their primary badge
 * Use this consistently throughout the app wherever user names are displayed
 */
export function UserNameWithBadge({ 
  username, 
  profileId, 
  className = '',
  badgeSize = 'sm',
  usernameClassName = ''
}: UserNameWithBadgeProps) {
  const { primaryBadge, loading } = usePrimaryBadge(profileId);
  
  // Show loading skeleton while badge is loading to ensure both load together
  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`h-4 bg-zinc-800/50 rounded animate-pulse ${usernameClassName ? 'w-24' : 'w-20'}`} />
        <div className={`${
          badgeSize === 'sm' ? 'w-6 h-6' : badgeSize === 'md' ? 'w-8 h-8' : 'w-10 h-10'
        } bg-zinc-800/50 rounded-full animate-pulse`} />
      </div>
    );
  }
  
  // Only show username and badge together once badge is loaded
  if (!primaryBadge) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={usernameClassName || 'font-medium'}>{username}</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={usernameClassName || 'font-medium'}>{username}</span>
      <PrimaryBadgeDisplay 
        profileId={profileId} 
        size={badgeSize}
        showName={false}
      />
    </div>
  );
}

export default UserNameWithBadge;

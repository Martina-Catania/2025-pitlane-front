'use client';

import React from 'react';
import { PrimaryBadgeDisplay } from '@/components/profile/PrimaryBadgeDisplay';

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

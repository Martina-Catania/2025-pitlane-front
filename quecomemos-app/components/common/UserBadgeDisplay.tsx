import React from 'react';
import Image from 'next/image';
import { useUserDisplayBadges } from '@/lib/hooks/useUserDisplayBadges';

interface Badge {
  BadgeID: number;
  name: string;
  description: string;
  badgeType: string;
  iconUrl?: string;
  earnedAt?: string;
}

interface UserBadgeDisplayProps {
  username: string;
  profileId?: string; // For fetching badges automatically
  badges?: Badge[]; // Optional: provide badges directly
  maxBadges?: number; // Maximum number of badges to show
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const getDefaultBadgeIcon = (badgeType: string): string => {
  // Fallback icons using emojis or simple text representations
  const typeIconMap: Record<string, string> = {
    'group_creation': '👥',
    'voting_participation': '🗳️', 
    'voting_winner': '🏆',
    'meal_creation': '👨‍🍳'
  };

  return typeIconMap[badgeType] || '🏅';
};

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8'
};

export function UserBadgeDisplay({ 
  username, 
  profileId,
  badges: providedBadges,
  maxBadges = 3, 
  size = 'md',
  showTooltip = true,
  className = '' 
}: UserBadgeDisplayProps) {
  // Fetch badges automatically if profileId is provided and badges are not provided
  const { badges: fetchedBadges } = useUserDisplayBadges(
    providedBadges ? undefined : profileId
  );
  
  // Use provided badges or fetched badges
  const badges = providedBadges || fetchedBadges;
  const displayBadges = badges.slice(0, maxBadges);
  const remainingCount = Math.max(0, badges.length - maxBadges);

  if (badges.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="font-medium">{username}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-medium">{username}</span>
      
      {/* Badge icons */}
      <div className="flex items-center gap-1">
        {displayBadges.map((badge) => {
          // Use iconUrl from database if available, otherwise show default emoji
          const hasCustomIcon = badge.iconUrl && badge.iconUrl.trim() !== '';
          
          return (
            <div
              key={badge.BadgeID}
              className={`relative ${sizeClasses[size]} flex-shrink-0`}
              title={showTooltip ? `${badge.name}: ${badge.description}` : undefined}
            >
              {hasCustomIcon ? (
                <Image
                  src={badge.iconUrl!}
                  alt={badge.name}
                  width={size === 'sm' ? 16 : size === 'md' ? 24 : 32}
                  height={size === 'sm' ? 16 : size === 'md' ? 24 : 32}
                  className="rounded-full border border-gray-200 bg-white p-0.5"
                  onError={(e) => {
                    // If Supabase image fails, show emoji fallback
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="flex items-center justify-center ${sizeClasses[size]} text-center">${getDefaultBadgeIcon(badge.badgeType)}</div>`;
                    }
                  }}
                />
              ) : (
                <div className={`flex items-center justify-center ${sizeClasses[size]} text-center bg-gray-100 rounded-full border border-gray-200`}>
                  {getDefaultBadgeIcon(badge.badgeType)}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Show count if there are more badges */}
        {remainingCount > 0 && (
          <div 
            className={`${sizeClasses[size]} flex items-center justify-center bg-gray-100 text-gray-600 rounded-full text-xs font-medium border`}
            title={showTooltip ? `+${remainingCount} more badges` : undefined}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserBadgeDisplay;
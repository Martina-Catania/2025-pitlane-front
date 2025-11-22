'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { usePrimaryBadge } from '@/lib/hooks/usePrimaryBadge';
import { BadgeDetailsModal } from './BadgeDetailsModal';

interface PrimaryBadgeDisplayProps {
  profileId: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  clickable?: boolean;
}

const getDefaultBadgeIcon = (badgeType: string): string => {
  const typeIconMap: Record<string, string> = {
    'group_creation': '👥',
    'voting_participation': '🗳️', 
    'voting_winner': '🏆',
    'meal_creation': '👨‍🍳'
  };
  return typeIconMap[badgeType] || '🏅';
};

const sizeConfig = {
  sm: { container: 'w-6 h-6', text: 'text-sm', spacing: 'gap-1' },
  md: { container: 'w-8 h-8', text: 'text-base', spacing: 'gap-2' },
  lg: { container: 'w-10 h-10', text: 'text-lg', spacing: 'gap-2' }
};

export function PrimaryBadgeDisplay({ 
  profileId, 
  showName = false, 
  size = 'md',
  className = '',
  clickable = true
}: PrimaryBadgeDisplayProps) {
  const { primaryBadge, loading } = usePrimaryBadge(profileId);
  const [showModal, setShowModal] = useState(false);

  if (loading || !primaryBadge) {
    return null;
  }

  const handleClick = () => {
    if (clickable) {
      setShowModal(true);
    }
  };

  const config = sizeConfig[size];
  const hasCustomIcon = primaryBadge.iconUrl && primaryBadge.iconUrl.trim() !== '';

  return (
    <>
      <div 
        className={`flex items-center ${config.spacing} ${className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={handleClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
      >
        <div className={`relative ${config.container}`}>
        {hasCustomIcon ? (
          <Image
            src={primaryBadge.iconUrl!}
            alt={primaryBadge.name}
            width={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
            height={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
            className="rounded-full border border-gray-200 bg-white p-0.5"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const parent = target.parentElement;
              if (parent) {
                const iconSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg';
                parent.innerHTML = `<div class="flex items-center justify-center ${config.container} ${iconSize} bg-gray-100 rounded-full border border-gray-200">${getDefaultBadgeIcon(primaryBadge.badgeType)}</div>`;
              }
            }}
          />
        ) : (
          <div className={`flex items-center justify-center ${config.container} ${config.text} bg-gray-100 rounded-full border border-gray-200`}>
            {getDefaultBadgeIcon(primaryBadge.badgeType)}
          </div>
        )}
      </div>
      
        {showName && (
          <Badge variant="secondary" className={`${config.text} bg-amber-100 text-amber-800 border-amber-300`}>
            {primaryBadge.name}
          </Badge>
        )}
      </div>

      <BadgeDetailsModal 
        badge={primaryBadge}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
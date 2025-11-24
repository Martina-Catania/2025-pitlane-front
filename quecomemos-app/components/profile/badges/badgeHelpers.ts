/**
 * Badge Helper Functions and Constants
 * Centralized utilities for badge display and management
 */

export interface Badge {
  BadgeID: number;
  name: string;
  description: string;
  badgeType: string;
  iconUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface LevelConfig {
  name: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  particle: string;
  solidBg?: string;
  iconColor?: string;
}

export const LEVEL_CONFIG: Record<BadgeLevel, LevelConfig> = {
  bronze: { 
    name: 'Bronze', 
    color: 'text-amber-400', 
    bg: 'bg-amber-950/40', 
    border: 'border-amber-500',
    glow: '',
    particle: '#f59e0b',
    solidBg: 'bg-amber-600',
    iconColor: 'text-amber-500'
  },
  silver: { 
    name: 'Silver', 
    color: 'text-gray-300', 
    bg: 'bg-gray-900/40', 
    border: 'border-gray-400',
    glow: '',
    particle: '#9ca3af',
    solidBg: 'bg-gray-500',
    iconColor: 'text-gray-400'
  },
  gold: { 
    name: 'Gold', 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-950/40', 
    border: 'border-yellow-500',
    glow: '',
    particle: '#eab308',
    solidBg: 'bg-yellow-600',
    iconColor: 'text-yellow-500'
  },
  diamond: { 
    name: 'Diamond', 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-950/40', 
    border: 'border-cyan-400',
    glow: 'shadow-cyan-400/50',
    particle: '#22d3ee',
    solidBg: 'bg-cyan-600',
    iconColor: 'text-cyan-400'
  }
};

export const LEVEL_COLORS: Record<BadgeLevel, { border: string }> = {
  bronze: { border: 'border-amber-500' },
  silver: { border: 'border-gray-400' },
  gold: { border: 'border-yellow-500' },
  diamond: { border: 'border-cyan-400' }
};

export const getDefaultBadgeIcon = (badgeType: string): string => {
  const typeIconMap: Record<string, string> = {
    'group_creation': '👥',
    'voting_participation': '🗳️', 
    'voting_winner': '🏆',
    'meal_creation': '👨‍🍳'
  };
  return typeIconMap[badgeType] || '🏅';
};

export const getTierSpecificBadgeName = (
  badgeType: string, 
  level: BadgeLevel, 
  baseName: string
): string => {
  const tierNames: Record<string, Record<BadgeLevel, string>> = {
    'meal_creation': {
      'bronze': 'Apprentice Chef',
      'silver': 'Skilled Chef',
      'gold': 'Master Chef',
      'diamond': 'Culinary Visionary'
    },
    'group_creation': {
      'bronze': 'Community Builder',
      'silver': 'Group Organizer',
      'gold': 'Social Architect',
      'diamond': 'Unity Catalyst'
    },
    'voting_participation': {
      'bronze': 'Civic Participant',
      'silver': 'Active Voter',
      'gold': 'Democracy Champion',
      'diamond': 'Voice of the People'
    },
    'voting_winner': {
      'bronze': 'Taste Explorer',
      'silver': 'Flavor Curator',
      'gold': 'Culinary Influencer',
      'diamond': 'Legendary Taste Maker'
    }
  };
  
  return tierNames[badgeType]?.[level] || baseName;
};

export const getBadgeTypeLabel = (badgeType: string): string => {
  const typeLabels: Record<string, string> = {
    'group_creation': 'Group Creator',
    'voting_participation': 'Democracy Enthusiast', 
    'voting_winner': 'Taste Maker',
    'meal_creation': 'Chef'
  };
  return typeLabels[badgeType] || badgeType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const BADGE_TYPE_LABELS: Record<string, string> = {
  'group_creation': 'Group Creator',
  'voting_participation': 'Voter', 
  'meal_creation': 'Chef',
  'voting_winner': 'Winner'
};

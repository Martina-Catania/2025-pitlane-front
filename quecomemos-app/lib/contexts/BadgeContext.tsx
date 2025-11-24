"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { useNotification } from '@/lib/hooks/useNotification';

export interface Badge {
  BadgeID: number;
  name: string;
  description: string;
  badgeType: string;
  iconUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  requirements?: BadgeRequirement[];
}

export interface BadgeRequirement {
  BadgeRequirementID: number;
  badgeId: number;
  level: 'bronze' | 'silver' | 'gold' | 'diamond';
  requiredCount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface BadgeProgress {
  badge: Badge;
  currentLevel: 'bronze' | 'silver' | 'gold' | 'diamond' | null;
  progress: number;
  isCompleted: boolean;
  earnedAt: string | null;
  lastUpgraded: string | null;
  currentLevelRequirement: BadgeRequirement | null;
  nextLevelRequirement: BadgeRequirement | null;
  hasEarned: boolean;
}

export interface UserBadge extends Badge {
  currentLevel: 'bronze' | 'silver' | 'gold' | 'diamond';
  earnedAt: string;
  lastUpgraded: string | null;
  progress: number;
  isCompleted: boolean;
}

interface BadgeContextType {
  // Badge data
  userBadges: UserBadge[];
  badgeProgress: BadgeProgress[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchUserBadges: () => Promise<void>;
  fetchBadgeProgress: () => Promise<void>;
  checkForNewBadges: (action: string, data?: Record<string, unknown>) => Promise<Badge[]>;
  
  // Helpers
  getBadgeByType: (badgeType: string) => UserBadge | undefined;
  hasCompletedBadge: (badgeType: string) => boolean;
  getBadgeProgress: (badgeType: string) => BadgeProgress | undefined;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

interface BadgeProviderProps {
  children: ReactNode;
  profileId?: string;
}

export function BadgeProvider({ children, profileId }: BadgeProviderProps) {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess } = useNotification();

  /**
   * Fetch badges earned by the user
   */
  const fetchUserBadges = useCallback(async () => {
    if (!profileId) {
      setUserBadges([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/badges/user/${profileId}`, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user badges: ${response.statusText}`);
      }

      const badges = await response.json();
      setUserBadges(badges);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch badges';
      setError(errorMessage);
      console.error('Error fetching user badges:', err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  /**
   * Fetch badge progress (including incomplete badges)
   */
  const fetchBadgeProgress = useCallback(async () => {
    if (!profileId) {
      setBadgeProgress([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/badges/user/${profileId}/progress`, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch badge progress: ${response.statusText}`);
      }

      const data = await response.json();
      
      setBadgeProgress(data as BadgeProgress[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch badge progress';
      setError(errorMessage);
      console.error('Error fetching badge progress:', err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  /**
   * Check for newly earned badges after an action
   * @param action - The action type (e.g., 'group_created', 'meal_created')
   * @param data - Optional additional data about the action
   * @returns Array of newly earned badges
   */
  const checkForNewBadges = useCallback(async (action: string, data?: Record<string, unknown>): Promise<Badge[]> => {
    if (!profileId) {
      console.log('[BadgeContext] No profileId, skipping badge check');
      return [];
    }

    console.log('[BadgeContext] Checking for badges:', { profileId, action, data });

    try {
      const response = await fetch(`${API_BASE_URL}/badges/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action, data })
      });

      if (!response.ok) {
        console.error('[BadgeContext] Badge check failed:', response.statusText);
        return [];
      }

      const result = await response.json();
      console.log('[BadgeContext] Badge check result:', result);
      const badgeNotifications = result.badgeNotifications || [];

      // Show badge achievement notification for each new badge or level up
      if (badgeNotifications.length > 0) {
        console.log('[BadgeContext] Showing notifications for', badgeNotifications.length, 'achievements');
        for (const notification of badgeNotifications) {
          const { badge, level, isNewBadge, isLevelUp } = notification;
          
          console.log('[BadgeContext] Processing notification:', { badgeName: badge.name, level, isNewBadge, isLevelUp });
          
          if (isNewBadge) {
            showSuccess('🏆 Badge Unlocked!', `You earned: ${badge.name} (${level})`);
          } else if (isLevelUp) {
            showSuccess('⬆️ Badge Upgraded!', `${badge.name} upgraded to ${level}!`);
          }
        }

        // Refresh badge data after earning new badges
        console.log('[BadgeContext] Refreshing badge data...');
        await Promise.all([fetchUserBadges(), fetchBadgeProgress()]);
      } else {
        console.log('[BadgeContext] No badge notifications to show');
      }

      return badgeNotifications.map((n: { badge: Badge }) => n.badge);
    } catch (err) {
      console.error('[BadgeContext] Error checking for new badges:', err);
      return [];
    }
  }, [profileId, showSuccess, fetchUserBadges, fetchBadgeProgress]);

  /**
   * Get a specific badge by badge type
   */
  const getBadgeByType = useCallback((badgeType: string): UserBadge | undefined => {
    return userBadges.find(badge => badge.badgeType === badgeType);
  }, [userBadges]);

  /**
   * Check if user has completed a specific badge
   */
  const hasCompletedBadge = useCallback((badgeType: string): boolean => {
    return userBadges.some(badge => badge.badgeType === badgeType);
  }, [userBadges]);

  /**
   * Get progress for a specific badge type
   */
  const getBadgeProgress = useCallback((badgeType: string): BadgeProgress | undefined => {
    return badgeProgress.find(bp => bp.badge.badgeType === badgeType);
  }, [badgeProgress]);

  // Initial data fetch
  useEffect(() => {
    if (profileId) {
      fetchUserBadges();
      fetchBadgeProgress();
    }
  }, [profileId, fetchUserBadges, fetchBadgeProgress]);

  const value: BadgeContextType = {
    userBadges,
    badgeProgress,
    loading,
    error,
    fetchUserBadges,
    fetchBadgeProgress,
    checkForNewBadges,
    getBadgeByType,
    hasCompletedBadge,
    getBadgeProgress
  };

  return (
    <BadgeContext.Provider value={value}>
      {children}
    </BadgeContext.Provider>
  );
}

/**
 * Hook to access badge context
 */
export function useBadges() {
  const context = useContext(BadgeContext);
  if (context === undefined) {
    throw new Error('useBadges must be used within a BadgeProvider');
  }
  return context;
}

/**
 * Optional hook that returns undefined if not within provider
 */
export function useBadgesOptional() {
  return useContext(BadgeContext);
}

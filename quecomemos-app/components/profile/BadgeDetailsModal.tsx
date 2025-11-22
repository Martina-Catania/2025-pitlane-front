'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Award, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BadgeDetails {
  BadgeID: number;
  name: string;
  description: string;
  badgeType: string;
  iconUrl?: string | null;
  tierLevel?: number;
  requirement?: number;
  earnedAt?: string;
  currentProgress?: number;
}

interface BadgeDetailsModalProps {
  badge: BadgeDetails | null;
  isOpen: boolean;
  onClose: () => void;
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

const getBadgeTypeLabel = (badgeType: string): string => {
  const typeLabels: Record<string, string> = {
    'group_creation': 'Group Creation',
    'voting_participation': 'Voting Participation', 
    'voting_winner': 'Voting Winner',
    'meal_creation': 'Meal Creation'
  };
  return typeLabels[badgeType] || badgeType;
};

const getTierColor = (tier: number): string => {
  switch (tier) {
    case 1: return 'bg-amber-600 text-white';
    case 2: return 'bg-gray-400 text-white';
    case 3: return 'bg-yellow-500 text-white';
    case 4: return 'bg-purple-600 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const getTierName = (tier: number): string => {
  switch (tier) {
    case 1: return 'Bronze';
    case 2: return 'Silver';
    case 3: return 'Gold';
    case 4: return 'Diamond';
    default: return 'Tier ' + tier;
  }
};

export function BadgeDetailsModal({ badge, isOpen, onClose }: BadgeDetailsModalProps) {
  if (!isOpen || !badge) return null;

  const hasCustomIcon = badge.iconUrl && badge.iconUrl.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Award className="w-5 h-5 text-amber-500" />
              Badge Details
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Badge Icon and Name */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative w-24 h-24">
              {hasCustomIcon ? (
                <Image
                  src={badge.iconUrl!}
                  alt={badge.name}
                  width={96}
                  height={96}
                  className="rounded-full border-4 border-amber-500/30 bg-muted p-1"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="flex items-center justify-center w-24 h-24 text-4xl bg-muted rounded-full border-4 border-amber-500/30">${getDefaultBadgeIcon(badge.badgeType)}</div>`;
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-24 h-24 text-4xl bg-muted rounded-full border-4 border-amber-500/30">
                  {getDefaultBadgeIcon(badge.badgeType)}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-card-foreground">{badge.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
            </div>
          </div>

          {/* Badge Information */}
          <div className="space-y-3 pt-4 border-t border-border">
            {/* Badge Type */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" />
                Badge Type
              </span>
              <Badge variant="outline" className="bg-muted">
                {getBadgeTypeLabel(badge.badgeType)}
              </Badge>
            </div>

            {/* Tier Level */}
            {badge.tierLevel !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Tier Level
                </span>
                <Badge className={getTierColor(badge.tierLevel!)}>
                  {getTierName(badge.tierLevel!)} (Tier {badge.tierLevel})
                </Badge>
              </div>
            )}

            {/* Requirement */}
            {badge.requirement !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Requirement</span>
                <span className="text-sm font-medium text-card-foreground">
                  {badge.requirement} {badge.badgeType.replace('_', ' ')}
                </span>
              </div>
            )}

            {/* Earned Date */}
            {badge.earnedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Earned On
                </span>
                <span className="text-sm font-medium text-card-foreground">
                  {new Date(badge.earnedAt!).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}

            {/* Current Progress (if available) */}
            {badge.currentProgress !== undefined && badge.requirement && (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Progress</span>
                  <span className="text-sm font-medium text-card-foreground">
                    {badge.currentProgress} / {badge.requirement}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-amber-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((badge.currentProgress / badge.requirement!) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Achievement Message */}
          <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 mt-4">
            <p className="text-sm text-amber-200 text-center">
              🎉 Congratulations on earning this badge!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

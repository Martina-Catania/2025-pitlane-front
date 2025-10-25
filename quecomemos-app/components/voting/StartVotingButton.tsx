'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vote, Clock, Users, Play } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { VotingService } from './VotingService';
import type { Group } from '../groups/index';

interface StartVotingButtonProps {
  group: Group;
  onVotingStarted?: () => void;
  disabled?: boolean;
  className?: string;
}

export function StartVotingButton({ group, onVotingStarted, disabled = false, className = '' }: StartVotingButtonProps) {
  const { userData } = useUser();
  const { showSuccess, showError } = useGlobalNotification();
  const [loading, setLoading] = useState(false);

  const userId = userData?.profile?.id;
  const isGroupMember = group.members?.some(member => member.profile.id === userId) || false;

  const handleStartVoting = async () => {
    if (!userId || !isGroupMember) {
      showError('Access Denied', 'You must be a member of this group to start a voting session.');
      return;
    }

    setLoading(true);
    try {
      await VotingService.startVotingSession({
        initiatorId: userId,
        groupId: group.GroupID,
        title: `Meal Vote - ${new Date().toLocaleDateString()}`,
        description: `Group meal voting session for ${group.name}`
      });

      showSuccess(
        'Voting Session Started!',
        'Members can now propose meals for the next 5 minutes.'
      );

      onVotingStarted?.();
    } catch (error) {
      showError(
        'Failed to Start Voting',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isGroupMember) {
    return null;
  }

  return (
    <Button
      onClick={handleStartVoting}
      disabled={disabled || loading}
      className={`bg-amber-600 hover:bg-amber-700 text-white ${className}`}
    >
      <Vote className="w-4 h-4 mr-2" />
      {loading ? 'Starting...' : 'Start Group Vote'}
    </Button>
  );
}

interface VotingInfoCardProps {
  className?: string;
}

export function VotingInfoCard({ className = '' }: VotingInfoCardProps) {
  return (
    <Card className={`bg-gradient-to-br from-blue-800/30 to-blue-900/30 border-blue-700/50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-200">
          <Vote className="w-5 h-5" />
          How Group Voting Works
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
              1
            </div>
            <div>
              <h4 className="font-medium text-blue-200">Start Voting Session</h4>
              <p className="text-sm text-gray-300">Any group member can initiate a meal voting session.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
              2
            </div>
            <div>
              <h4 className="font-medium text-blue-200 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Propose Meals (5 minutes)
              </h4>
              <p className="text-sm text-gray-300">Members can propose meals for the group to vote on.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
              3
            </div>
            <div>
              <h4 className="font-medium text-blue-200 flex items-center gap-1">
                <Users className="w-4 h-4" />
                Vote on Proposals
              </h4>
              <p className="text-sm text-gray-300">Everyone votes on their preferred meals from the proposed options.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
              4
            </div>
            <div>
              <h4 className="font-medium text-blue-200 flex items-center gap-1">
                <Play className="w-4 h-4" />
                Winner Selection
              </h4>
              <p className="text-sm text-gray-300">The meal with the most votes becomes the group&apos;s meal choice.</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
          <p className="text-xs text-blue-200">
            <strong>Pro tip:</strong> All proposed meals are filtered based on the group&apos;s dietary restrictions 
            to ensure everyone can enjoy the winning meal!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
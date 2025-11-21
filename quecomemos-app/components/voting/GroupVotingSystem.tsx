'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vote, ChefHat, Users, Clock } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { useVoting } from '@/lib/contexts/VotingContext';
import { 
  VotingSessionCard, 
  StartVotingButton,
  VotingResultsModal,
} from '@/components/voting';
import type { Group } from '@/components/groups/index';

interface GroupVotingSystemProps {
  group: Group;
  onVotingComplete?: () => void;
  className?: string;
}

export function GroupVotingSystem({ group, onVotingComplete, className = '' }: GroupVotingSystemProps) {
  const { userData } = useUser();
  const { 
    activeSession, 
    loading, 
    startSession, 
    showResultsModal, 
    setShowResultsModal, 
    isOffline, 
    forceSyncNow, 
    lastSyncTime 
  } = useVoting();

  const userId = userData?.profile?.id;
  const isGroupMember = group.members?.some(member => member.profile.id === userId) || false;

  console.debug('[GroupVotingSystem] render: group=', group.GroupID, 'loading=', loading, 'activeSession=', activeSession?.VotingSessionID, 'showResultsModal=', showResultsModal, 'isOffline=', isOffline);

  const handleVotingStarted = () => {
    console.debug('[GroupVotingSystem] handleVotingStarted called');
    // Refresh the context to get the new session
    startSession();
  };

  const handleCloseResults = () => {
    console.debug('[GroupVotingSystem] handleCloseResults called');
    setShowResultsModal(false);
  };

  if (loading) {
    console.debug('[GroupVotingSystem] rendering: LOADING STATE');
    return (
      <Card className={`bg-gradient-to-br from-blue-800/30 to-blue-900/30 border-blue-700/50 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-blue-200">Loading voting system...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Enhanced connection status indicator with manual sync
  const ConnectionStatusIndicator = () => {
    const formatTime = (date: Date | null) => {
      if (!date) return 'Never';
      return date.toLocaleTimeString();
    };

    if (isOffline) {
      return (
        <div className="mb-4 p-4 bg-yellow-900/50 border border-yellow-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-yellow-200">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3 animate-pulse"></div>
              <div>
                <div className="text-sm font-medium">Connection Issues Detected</div>
                <div className="text-xs text-yellow-300 mt-1">
                  Showing last known state. Last sync: {formatTime(lastSyncTime)}
                </div>
              </div>
            </div>
            <button
              onClick={forceSyncNow}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-yellow-100 text-xs rounded-md transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Now
            </button>
          </div>
        </div>
      );
    }

    // Always show connection status when online; keep Refresh button persistently available
    return (
      <div className="mb-4 p-3 bg-green-900/30 border border-green-700/50 rounded-lg">
        <div className="flex items-center justify-between text-green-200">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
            <span className="text-sm">Connected • Last sync: {formatTime(lastSyncTime)}</span>
          </div>
          <button
            onClick={forceSyncNow}
            className="px-2 py-1 text-green-300 hover:text-green-100 text-xs opacity-70 hover:opacity-100 transition-opacity"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  };

  // If there's an active voting session, show the voting interface
  if (activeSession) {
    console.debug('[GroupVotingSystem] rendering: ACTIVE SESSION');
    return (
      <>
        <div className={`space-y-4 ${className}`}>
          {/* Connection status indicator */}
          <ConnectionStatusIndicator />
          
          <VotingSessionCard
            session={activeSession}
            onVotingComplete={onVotingComplete}
            className="border-blue-700/50"
          />
        </div>
        
        {/* Results modal displayed independently at group level */}
        {showResultsModal && activeSession && (
          <VotingResultsModal
            isOpen={showResultsModal}
            onClose={handleCloseResults}
            onViewMeal={() => {
              console.debug('[GroupVotingSystem] onViewMeal called');
              handleCloseResults();
            }}
            session={activeSession}
            winnerProposal={activeSession.proposals?.find(p => p.mealId === activeSession.winnerMealId)}
          />
        )}
      </>
    );
  }

  // No active session - show the start voting interface
  console.debug('[GroupVotingSystem] rendering: NO ACTIVE SESSION');
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection status indicator */}
      <ConnectionStatusIndicator />
      
      <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-200">
            <Vote className="w-5 h-5 mr-2" />
            Group Meal Voting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="bg-amber-600/20 p-4 rounded-full">
                <Vote className="w-12 h-12 text-amber-600" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-200">
              Ready to Decide What to Eat?
            </h3>
            
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Start a group voting session to let everyone propose and vote on meals. 
              The most popular choice wins!
            </p>

            <div className="space-y-4">
              {isGroupMember ? (
                <StartVotingButton
                  group={group}
                  onVotingStarted={handleVotingStarted}
                  className="px-8 py-3 text-lg"
                />
              ) : (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <Users className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                  <p className="text-gray-400">You must be a member of this group to start voting sessions.</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>5 min proposals</span>
                </div>
                <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Democratic voting</span>
                </div>
                <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <ChefHat className="w-4 h-4" />
                  <span>Automatic registration</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
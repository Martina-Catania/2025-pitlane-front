'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vote, ChefHat, Users, Clock } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { 
  VotingSessionCard, 
  StartVotingButton, 
  VotingInfoCard,
  VotingService,
  type VotingSession 
} from '@/components/voting';
import type { Group } from '@/components/groups/index';

interface GroupVotingSystemProps {
  group: Group;
  onVotingComplete?: () => void;
  className?: string;
}

export function GroupVotingSystem({ group, onVotingComplete, className = '' }: GroupVotingSystemProps) {
  const { userData } = useUser();
  const { showError } = useGlobalNotification();
  
  const [activeSession, setActiveSession] = useState<VotingSession | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = userData?.profile?.id;
  const isGroupMember = group.members?.some(member => member.profile.id === userId) || false;

  // Fetch active voting session
  const fetchActiveSession = useCallback(async (showLoader = true) => {
    if (!group.GroupID) return;
    
    try {
      if (showLoader) setLoading(true);
      
      const sessions = await VotingService.getActiveVotingSessions(group.GroupID);
      const session = sessions.length > 0 ? sessions[0] : null;
      setActiveSession(session);
    } catch (error) {
      // No active session is expected, so we don't show an error for 404
      if (error instanceof Error && !error.message.includes('404')) {
        showError('Failed to Load Voting Session', error.message);
      }
      setActiveSession(null);
    } finally {
      setLoading(false);
    }
  }, [group.GroupID, showError]);

  // Initial fetch on mount and when group changes
  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  // Polling effect for active sessions - runs when we have an active session ID
  useEffect(() => {
    if (!activeSession?.VotingSessionID) return;

    // Only poll if session is in an active state (not completed)
    if (activeSession.status === 'completed' || activeSession.status === 'cancelled') {
      return; // Don't poll for completed sessions
    }

    const pollInterval = setInterval(async () => {
      // Use the latest group ID from the function scope
      if (group.GroupID) {
        try {
          const sessions = await VotingService.getActiveVotingSessions(group.GroupID);
          const session = sessions.length > 0 ? sessions[0] : null;
          
          // Only update if there are meaningful changes
          if (!session && activeSession) {
            // Session completed or ended - refresh fully
            fetchActiveSession(false);
          } else if (session && (
            !activeSession || 
            activeSession.status !== session.status ||
            activeSession.proposals?.length !== session.proposals?.length
          )) {
            // Meaningful changes detected
            setActiveSession(session);
          }
        } catch {
          // Ignore errors during polling - session might have completed
          if (activeSession) {
            setActiveSession(null);
          }
        }
      }
    }, 15000); // Increased to 15 seconds to reduce load

    return () => clearInterval(pollInterval);
  }, [activeSession?.VotingSessionID, activeSession?.status, group.GroupID, activeSession, fetchActiveSession]);

  const handleVotingStarted = () => {
    fetchActiveSession();
  };

  if (loading) {
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

  // If there's an active voting session, show the voting interface
  if (activeSession) {
    return (
      <div className={`space-y-4 ${className}`}>
        <VotingSessionCard
          session={activeSession}
          onUpdate={() => fetchActiveSession(false)}
          onVotingComplete={onVotingComplete}
          className="border-blue-700/50"
        />
      </div>
    );
  }

  // No active session - show the start voting interface
  return (
    <div className={`space-y-4 ${className}`}>
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

      {/* Information card for new users */}
      <VotingInfoCard />
    </div>
  );
}
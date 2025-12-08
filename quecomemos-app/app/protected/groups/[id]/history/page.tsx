'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Gamepad2 } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { API_BASE_URL } from '@/lib/config/api';
import { VotingService } from '@/components/voting/VotingService';
import { GameHistoryService } from '@/components/games/clicker-game/GameHistoryService';
import { SessionDetailsModal } from '@/components/session/SessionDetailsModal';
import { RecentActivity } from '@/components/groups/RecentActivity';

interface MealConsumption {
  MealConsumptionID: number;
  name: string;
  consumedAt: string;
  portionFraction?: number;
  totalKcal?: number;
  source?: 'individual' | 'voting' | 'game' | 'group';
  meal?: {
    MealID: number;
    name: string;
    description?: string;
  };
  profile?: {
    id: string;
    username: string;
  };
  votingSession?: {
    VotingSessionID: number;
  };
  gameSession?: {
    GameSessionID: number;
    gameType: string;
  };
}

interface Group {
  GroupID: number;
  name: string;
  description?: string;
  mealConsumptions?: MealConsumption[];
}

function GroupHistorySkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6 border border-amber-700/50 rounded-lg bg-gradient-to-br from-amber-800/10 to-amber-900/10">
      {/* Header skeleton */}
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
        <div className="flex-1">
          <div className="w-48 h-8 bg-muted rounded animate-pulse mb-2"></div>
          <div className="w-96 h-4 bg-muted/70 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Filters skeleton */}
      <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 h-10 bg-muted rounded animate-pulse"></div>
            <div className="w-32 h-10 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* History cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50 animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 bg-muted rounded animate-pulse"></div>
                <div className="w-20 h-4 bg-muted/70 rounded animate-pulse"></div>
              </div>
              <div className="w-3/4 h-6 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="w-full h-4 bg-muted/70 rounded animate-pulse"></div>
              <div className="w-2/3 h-4 bg-muted/70 rounded animate-pulse"></div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted/70 rounded animate-pulse"></div>
                <div className="w-32 h-4 bg-muted/70 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted/70 rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-muted/70 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function GroupHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [mealConsumptions, setMealConsumptions] = useState<MealConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Voting and game history
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [votingSessions, setVotingSessions] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gameSessions, setGameSessions] = useState<any[]>([]);
  const [votingLoading, setVotingLoading] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  
  // Session details modal
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<'voting' | 'game'>('voting');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Context hooks
  const { userData } = useUser();

  const fetchGroupHistory = useCallback(async () => {
    try {
      setLoading(true);
      console.debug('Fetching group history', `${API_BASE_URL}/groups/${groupId}`);
      const res = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.debug('Group history payload', data);
      setGroup(data);
      setMealConsumptions(data.mealConsumptions || []);
    } catch (err) {
      console.debug('Error fetching group history', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [groupId]);
  
  const fetchVotingHistory = useCallback(async () => {
    try {
      setVotingLoading(true);
      const profileId = userData?.profile?.id;
      if (!profileId) return;
      
      const response = await VotingService.getVotingHistory(profileId, parseInt(groupId));
      setVotingSessions(response.sessions.slice(0, 5)); // Show last 5 voting sessions
    } catch (err) {
      console.error('Error fetching voting history:', err);
    } finally {
      setVotingLoading(false);
    }
  }, [groupId, userData?.profile?.id]);
  
  const fetchGameHistory = useCallback(async () => {
    try {
      setGameLoading(true);
      const profileId = userData?.profile?.id;
      if (!profileId) return;
      
      const response = await GameHistoryService.getGameHistory(profileId, parseInt(groupId));
      setGameSessions(response.sessions.slice(0, 5)); // Show last 5 game sessions
    } catch (err) {
      console.error('Error fetching game history:', err);
    } finally {
      setGameLoading(false);
    }
  }, [groupId, userData?.profile?.id]);

  useEffect(() => {
    fetchGroupHistory();
    fetchVotingHistory();
    fetchGameHistory();
  }, [fetchGroupHistory, fetchVotingHistory, fetchGameHistory]);
  
  const handleViewSessionDetails = (sessionId: number, type: 'voting' | 'game') => {
    setSelectedSessionId(sessionId);
    setSelectedSessionType(type);
    setIsModalOpen(true);
  };

  if (loading) {
    return <GroupHistorySkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <Card>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={fetchGroupHistory}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 border border-amber-700/50 rounded-lg bg-gradient-to-br from-amber-800/10 to-amber-900/10">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">Activity History</h1>
          <p className="text-muted-foreground mt-1">
            Complete meal consumption history for {group?.name}
          </p>
        </div>
      </div>
      
      {/* Voting & Game History Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Voting Sessions */}
        <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-200">
              <Trophy className="w-5 h-5" />
              Recent Voting Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {votingLoading ? (
              <div className="text-center py-4 text-gray-400">Loading...</div>
            ) : votingSessions.length > 0 ? (
              <div className="space-y-2">
                {votingSessions.map((session) => (
                  <button
                    key={session.sessionId}
                    onClick={() => handleViewSessionDetails(session.sessionId, 'voting')}
                    className="w-full text-left p-3 rounded-lg border border-amber-700/30 bg-neutral-800/50 hover:bg-neutral-800/70 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-neutral-100">
                          {session.winnerMeal?.name || 'No winner meal'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(session.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-xs text-gray-400">
                        <span>{session.participantCount} participants</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No voting sessions yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Game Sessions */}
        <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-200">
              <Gamepad2 className="w-5 h-5" />
              Recent Game Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gameLoading ? (
              <div className="text-center py-4 text-gray-400">Loading...</div>
            ) : gameSessions.length > 0 ? (
              <div className="space-y-2">
                {gameSessions.map((session) => {
                  const isRoulette = session.gameType === 'roulette';
                  const isClicker = session.gameType === 'egg_clicker';
                  
                  return (
                    <button
                      key={session.sessionId}
                      onClick={() => handleViewSessionDetails(session.sessionId, 'game')}
                      className="w-full text-left p-3 rounded-lg border border-amber-700/30 bg-neutral-800/50 hover:bg-neutral-800/70 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-neutral-100">
                            {session.winningMeal?.name || 'No winning meal'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(session.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs text-gray-400">
                          {isRoulette && (
                            <>
                              <span>{session.participantCount} options</span>
                              <span className="text-amber-500">
                                {((1 / session.participantCount) * 100).toFixed(1)}% chance
                              </span>
                            </>
                          )}
                          {isClicker && session.winner && (
                            <span>{session.winner.clickCount || 0} clicks</span>
                          )}
                          {!isRoulette && !isClicker && (
                            <span>{session.participantCount} participants</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No game sessions yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meal Consumption History */}
      <RecentActivity
        mealConsumptions={mealConsumptions}
        loading={loading}
        showFilters={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        groupedByDate={true}
        emptyMessage={searchTerm ? 'No matching activities found' : 'No activity history'}
        emptyDescription={searchTerm 
          ? `No activities match "${searchTerm}". Try adjusting your search terms.`
          : 'This group has no recorded meal consumption history yet.'}
      />
      
      {/* Session Details Modal */}
      <SessionDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSessionId(null);
        }}
        sessionId={selectedSessionId}
        sessionType={selectedSessionType}
        onPortionRegistered={() => {
          fetchGroupHistory();
          fetchVotingHistory();
          fetchGameHistory();
        }}
      />
    </div>
  );
}
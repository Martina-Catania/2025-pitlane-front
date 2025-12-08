'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Clock, ChevronRight, Gamepad2, Egg } from 'lucide-react';
import { useState, useEffect } from 'react';
import { GameHistoryService } from './GameHistoryService';
import { SessionDetailsModal } from '@/components/session/SessionDetailsModal';

interface GameHistoryItem {
  sessionId: number;
  gameType: string;
  duration: number;
  createdAt: string;
  startTime: string;
  endTime: string;
  status: string;
  winner: {
    id: string;
    username: string;
    clickCount: number;
  };
  winningMeal: {
    mealId: number;
    name: string;
    description: string;
  } | null;
  participantCount: number;
}

interface GameHistorySectionProps {
  groupId: number;
  className?: string;
  onRefresh?: () => void;
}

export function GameHistorySection({ groupId, className = '', onRefresh }: GameHistorySectionProps) {
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GameHistoryService.getGroupGameHistory(groupId, 10, 0);
      setHistory(data.sessions || []);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to load game history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load game history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGameIcon = (gameType: string) => {
    switch (gameType) {
      case 'egg_clicker':
        return <Egg className="h-4 w-4 text-amber-400" />;
      default:
        return <Gamepad2 className="h-4 w-4 text-amber-400" />;
    }
  };

  const getGameName = (gameType: string) => {
    switch (gameType) {
      case 'egg_clicker':
        return 'Egg Clicker';
      default:
        return gameType;
    }
  };

  if (loading) {
    return (
      <Card className={`bg-gradient-to-br from-amber-900/20 to-amber-950/40 border-amber-700/50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-amber-400">
            <Gamepad2 className="w-5 h-5 mr-2" /> Game History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-gradient-to-br from-amber-900/20 to-amber-950/40 border-amber-700/50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-amber-400">
            <Gamepad2 className="w-5 h-5 mr-2" /> Game History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-sm text-red-400">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadHistory}
              className="mt-3 border-red-500/50 text-red-400 hover:bg-red-900/30"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`bg-gradient-to-br from-amber-900/20 to-amber-950/40 border-amber-700/50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-amber-400">
            <Gamepad2 className="w-5 h-5 mr-2" /> Game History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-3">
              {/* Scrollable container for game history */}
              <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                {history.map((session) => {
                  const isRoulette = session.gameType === 'roulette';
                  const isClicker = session.gameType === 'egg_clicker';
                  
                  return (
                    <button
                      key={session.sessionId}
                      onClick={() => handleViewDetails(session.sessionId)}
                      className="w-full text-left p-3 rounded-lg border border-amber-700/30 bg-neutral-800/50 hover:bg-neutral-800/70 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-neutral-100">
                            {session.winningMeal?.name || 'No winning meal'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(session.createdAt)}
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
                          {isClicker && (
                            <span>{session.winner.clickCount} clicks</span>
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

              {/* Load more button (if needed) */}
              {history.length >= 10 && (
                <Button
                  variant="outline"
                  className="w-full border-amber-600 text-amber-400 hover:bg-amber-900/30"
                  onClick={loadHistory}
                >
                  Load More
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Gamepad2 className="h-12 w-12 mx-auto mb-3 text-amber-600 opacity-50" />
              <p>No games played yet</p>
              <p className="text-sm mt-1">Start a game to see history here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game session details modal */}
      {selectedSessionId && (
        <SessionDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSessionId(null);
          }}
          sessionId={selectedSessionId}
          sessionType="game"
          onPortionRegistered={loadHistory}
        />
      )}
    </>
  );
}


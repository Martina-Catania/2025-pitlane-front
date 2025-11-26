'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, Egg, RotateCw, Users } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { GameService, GameSession } from '@/lib/services/GameService';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';

export default function GamePlayPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = parseInt(params.id as string);
  const gameSessionId = parseInt(params.gameSessionId as string);
  const { userData } = useUser();
  const { showError } = useGlobalNotification();

  const [loading, setLoading] = useState(true);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [eggShaking, setEggShaking] = useState(false);
  const [eggCracks, setEggCracks] = useState(0);
  const [spinning, setSpinning] = useState(false);
  
  const clickCountRef = useRef(0);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for game updates
  const pollGameSession = useCallback(async () => {
    try {
      const updated = await GameService.getGameSession(gameSessionId);
      setGameSession(updated);

      // Navigate to results when completed
      if (updated.status === 'completed') {
        router.push(`/protected/groups/${groupId}/game/${gameSessionId}/results`);
      }
    } catch (error) {
      console.error('Error polling game session:', error);
    }
  }, [gameSessionId, groupId, router]);

  useEffect(() => {
    const interval = setInterval(pollGameSession, 2000);
    return () => clearInterval(interval);
  }, [pollGameSession]);

  // Load game session
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        const game = await GameService.getGameSession(gameSessionId);
        setGameSession(game);

        // If game is already completed, navigate to results
        if (game.status === 'completed') {
          router.push(`/protected/groups/${groupId}/game/${gameSessionId}/results`);
          return;
        }

        // If game hasn't started, go back to lobby
        if (game.status === 'waiting' || game.status === 'ready') {
          router.push(`/protected/groups/${groupId}/game`);
          return;
        }
      } catch {
        showError('Error', 'Failed to load game');
        router.push(`/protected/groups/${groupId}/game`);
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameSessionId, groupId, router, showError]);

  // Handle countdown phase (used by egg_clicker; roulette can skip to playing or host can spin)
  useEffect(() => {
    if (gameSession?.status === 'countdown') {
      setCountdown(3);
      
      countdownTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
            }
            // Transition to playing
            GameService.startGamePlaying(gameSessionId).catch(console.error);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
      };
    }
  }, [gameSession?.status, gameSessionId]);

  // Submit clicks function (egg_clicker only)
  const submitClicks = useCallback(async () => {
    if (!userData?.profile?.id || hasSubmitted) return;

    setHasSubmitted(true);

    try {
      await GameService.submitClickCount(
        gameSessionId,
        userData.profile.id,
        clickCountRef.current
      );
    } catch (error) {
      console.error('Error submitting clicks:', error);
      showError('Error', 'Failed to submit your score');
    }
  }, [gameSessionId, userData?.profile?.id, hasSubmitted, showError]);

  const handleForceComplete = async () => {
    if (!userData?.profile?.id || gameSession?.hostId !== userData.profile.id) return;

    try {
      await GameService.forceCompleteGame(gameSessionId, userData.profile.id);
    } catch (error) {
      console.error('Error forcing game completion:', error);
      showError('Error', 'Failed to force complete game');
    }
  };

  // Spin roulette (host only)
  const handleSpinRoulette = async () => {
    if (!userData?.profile?.id || gameSession?.hostId !== userData.profile.id) return;
    if (gameSession?.gameType !== 'roulette') return;

    try {
      setSpinning(true);
      await GameService.spinRoulette(gameSessionId, userData.profile.id);
    } catch (error) {
      console.error('Error spinning roulette:', error);
      showError('Error', 'Failed to spin roulette');
    } finally {
      setSpinning(false);
    }
  };

  // Handle playing phase
  useEffect(() => {
    if (gameSession?.status === 'playing' && gameSession.startTime) {
      const duration = gameSession.duration * 1000;
      const startTime = new Date(gameSession.startTime).getTime();
      const endTime = startTime + duration;

      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        setTimeRemaining(Math.ceil(remaining / 1000));

        if (remaining <= 0) {
          if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current);
          }
          // Time's up, transition to submitting state then submit clicks
          GameService.endGameTime(gameSessionId)
            .then(() => submitClicks())
            .catch(console.error);
        }
      };

      updateTimer();
      gameTimerRef.current = setInterval(updateTimer, 100);

      return () => {
        if (gameTimerRef.current) {
          clearInterval(gameTimerRef.current);
        }
      };
    }
  }, [gameSession?.status, gameSession?.startTime, gameSession?.duration, submitClicks, gameSessionId]);

  const handleEggClick = () => {
    if (gameSession?.status !== 'playing' || hasSubmitted) return;

    clickCountRef.current += 1;
    setClickCount(clickCountRef.current);
    
    // Visual feedback
    setEggShaking(true);
    setTimeout(() => setEggShaking(false), 100);

    // Add crack every 10 clicks (max 5 cracks)
    if (clickCountRef.current % 10 === 0 && eggCracks < 5) {
      setEggCracks(prev => Math.min(prev + 1, 5));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (countdown !== null && gameSession?.gameType === 'egg_clicker') {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh] space-y-8">
        <h2 className="text-4xl font-bold text-amber-400">Get Ready!</h2>
        <div className="text-9xl font-bold text-green-400 animate-pulse">
          {countdown}
        </div>
        <p className="text-xl text-gray-300">Click as fast as you can!</p>
      </div>
    );
  }

  if ((gameSession?.status === 'submitting' || hasSubmitted) && gameSession?.gameType === 'egg_clicker') {
    const isHost = gameSession?.hostId === userData?.profile?.id;
    
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh] space-y-6">
        <Trophy className="w-24 h-24 text-amber-400" />
        <h2 className="text-4xl font-bold text-amber-400">Time&apos;s Up!</h2>
        <Card className="bg-gradient-to-br from-green-900/40 to-green-950/60 border-green-700/50 max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-6xl font-bold text-green-400">{clickCount}</p>
            <p className="text-xl text-gray-300">clicks</p>
            <div className="text-sm text-gray-400 mt-4">
              {gameSession?.participants.filter(p => p.hasSubmitted).length} / {gameSession?.participants.length} players submitted
            </div>
            <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto mt-4" />
            <p className="text-sm text-gray-400">Waiting for all players...</p>
            
            {isHost && gameSession?.participants.some(p => p.hasSubmitted) && (
              <Button
                onClick={handleForceComplete}
                variant="outline"
                className="mt-4 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
              >
                Force Complete (Skip Waiting)
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render gameplay based on game type
  if (gameSession?.gameType === 'roulette') {
    const isHost = gameSession?.hostId === userData?.profile?.id;
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Card className="bg-gradient-to-r from-purple-900/40 to-purple-950/60 border-purple-700/50 px-6 py-3">
            <div className="flex items-center gap-3">
              <RotateCw className="w-6 h-6 text-purple-300" />
              <div>
                <p className="text-xs text-gray-400">Roulette</p>
                <p className="text-3xl font-bold text-purple-300">Proposed Meals</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-r from-amber-900/40 to-amber-950/60 border-amber-700/50 px-6 py-3">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-amber-400" />
              <div>
                <p className="text-xs text-gray-400">Players</p>
                <p className="text-3xl font-bold text-amber-400">{gameSession?.participants.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Proposed meals list */}
        <Card className="bg-zinc-900/60 border-zinc-700/50">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-2 gap-3">
              {gameSession?.participants.map((p) => (
                <div key={p.GameParticipantID} className="p-3 rounded-lg bg-zinc-800/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-gray-200">{p.profile.username}</span>
                    {p.meal ? (
                      <span className="text-xs text-purple-300 mt-1">🍽️ {p.meal.name}</span>
                    ) : (
                      <span className="text-xs text-gray-500 mt-1">No meal proposed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spin button for host */}
        {isHost && (
          <div className="flex justify-center">
            <Button
              onClick={handleSpinRoulette}
              disabled={spinning || !gameSession?.participants.some(p => p.mealId)}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {spinning ? 'Spinning...' : 'Spin Roulette'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Timer and Score Header */}
      <div className="flex justify-between items-center">
        <Card className="bg-gradient-to-r from-amber-900/40 to-amber-950/60 border-amber-700/50 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 text-2xl font-bold">⏱️</span>
            <div>
              <p className="text-xs text-gray-400">Time Remaining</p>
              <p className="text-3xl font-bold text-amber-400">
                {timeRemaining !== null ? timeRemaining : gameSession?.duration}s
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-900/40 to-green-950/60 border-green-700/50 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-green-400 text-2xl font-bold">🏆</span>
            <div>
              <p className="text-xs text-gray-400">Your Score</p>
              <p className="text-3xl font-bold text-green-400">{clickCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Egg Clicker Area */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <h2 className="text-3xl font-bold text-amber-400">Click the Egg!</h2>
        
        <div className="relative">
          <Button
            onClick={handleEggClick}
            disabled={gameSession?.status !== 'playing'}
            className={`w-64 h-64 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 hover:from-amber-200 hover:to-amber-400 
                       border-4 border-amber-600 shadow-2xl transition-all duration-100 relative overflow-hidden
                       ${eggShaking ? 'scale-95' : 'scale-100'}`}
            style={{
              boxShadow: '0 10px 40px rgba(251, 191, 36, 0.4)',
            }}
          >
            <Egg className="w-32 h-32 text-amber-800" />
            
            {/* Crack effects */}
            {Array.from({ length: eggCracks }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(${45 + i * 30}deg, transparent 48%, #422006 48%, #422006 52%, transparent 52%)`,
                  opacity: 0.6,
                }}
              />
            ))}
          </Button>

          {/* Click ripple effect */}
          {eggShaking && (
            <div className="absolute inset-0 rounded-full border-8 border-green-400 animate-ping opacity-75" />
          )}
        </div>

        <p className="text-gray-400 text-lg">
          Tap rapidly to break the egg!
        </p>

        {/* Players list */}
        <Card className="bg-zinc-900/60 border-zinc-700/50 max-w-md w-full">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-amber-200 mb-3">Players</h3>
            <div className="space-y-2">
              {gameSession?.participants.map((participant) => (
                <div
                  key={participant.GameParticipantID}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-300">{participant.profile.username}</span>
                  <span className="text-gray-500">Playing...</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

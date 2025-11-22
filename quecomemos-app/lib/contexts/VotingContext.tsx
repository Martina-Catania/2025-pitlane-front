'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { VotingService } from '@/components/voting/VotingService';
import { votingSocket } from '@/lib/services/votingSocket';
import type { VotingSession } from '@/components/voting/types';

interface VotingContextType {
  // Current active session for a group
  activeSession: VotingSession | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshSession: () => Promise<void>;
  startSession: () => Promise<void>;
  clearSession: () => void;
  
  // Notify when a voting session completes
  notifyVotingCompleted: (sessionId: number) => void;
  onVotingCompleted: (callback: (sessionId: number) => void) => () => void;
  
  // Connection status
  isOffline: boolean;
  
  // Manual sync control
  forceSyncNow: () => Promise<void>;
  lastSyncTime: Date | null;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

interface VotingProviderProps {
  children: React.ReactNode;
  groupId: number;
}

export function VotingProvider({ children, groupId }: VotingProviderProps) {
  const [activeSession, setActiveSession] = useState<VotingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const mountedRef = useRef(true);
  const previousStatusRef = useRef<string | null>(null);
  const completionListenersRef = useRef<Set<(sessionId: number) => void>>(new Set());

  // CRITICAL FIX: Set mountedRef to true on every mount
  useEffect(() => {
    console.debug('[VotingContext] Setting mountedRef to true on mount');
    mountedRef.current = true;
    return () => {
      console.debug('[VotingContext] Setting mountedRef to false on unmount');
      mountedRef.current = false;
    };
  }, []);

  // Socket.IO connection status monitoring
  useEffect(() => {
    // Check if socket is connected
    const checkConnection = () => {
      const connected = votingSocket.isConnected();
      setIsOffline(!connected);
    };

    // Initial check
    checkConnection();

    // Set up interval to check connection periodically
    const intervalId = setInterval(checkConnection, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Fetch active voting session for this group (initial load only)
  const fetchActiveSession = useCallback(async (showLoader = true) => {
    if (!mountedRef.current) {
      console.debug('[VotingContext] fetchActiveSession: component not mounted, returning');
      return;
    }
    if (typeof groupId !== 'number' || Number.isNaN(groupId)) {
      console.debug('[VotingContext] fetchActiveSession: invalid groupId', groupId);
      setActiveSession(null);
      setError(null);
      setLoading(false);
      return;
    }
    
    try {
      console.debug('[VotingContext] fetchActiveSession: start', { groupId, showLoader });
      if (showLoader) {
        setLoading(true);
      }
      
      console.debug('[VotingContext] fetchActiveSession: calling VotingService.getInitialActiveSession');
      const sessions = await VotingService.getInitialActiveSession(groupId);
      console.debug('[VotingContext] fetchActiveSession: received sessions', { count: sessions?.length, sessions });
      
      const session = sessions && sessions.length > 0 ? sessions[0] : null;
      console.debug('[VotingContext] fetchActiveSession: extracted first session', { session });
      
      if (!mountedRef.current) {
        console.debug('[VotingContext] fetchActiveSession: component unmounted after fetch, skipping state update');
        return;
      }
      
      setLastSyncTime(new Date());
      setIsOffline(false);
      
      previousStatusRef.current = session?.status || null;
      console.debug('[VotingContext] fetchActiveSession: success, setting session state', { session });
      setActiveSession(session);
      setError(null);
    } catch (err) {
      console.error('[VotingContext] fetchActiveSession: CATCH BLOCK', err);
      if (!mountedRef.current) {
        console.debug('[VotingContext] fetchActiveSession: component unmounted during error handling, skipping state update');
        return;
      }
      
      if (err instanceof Error) {
        console.error('[VotingContext] fetchActiveSession: error details', { message: err.message });
        
        if (err.message.includes('404')) {
          console.debug('[VotingContext] fetchActiveSession: 404 error (no active session), clearing session');
          setActiveSession(null);
          setError(null);
          setIsOffline(false);
        } else if (err.message.includes('timeout') || err.name === 'AbortError' || 
                   err.message.includes('fetch') || err.message.includes('network')) {
          console.debug('[VotingContext] fetchActiveSession: network/timeout error, marking offline');
          setIsOffline(true);
          setError(`Connection issue: ${err.message}`);
        } else {
          console.error('[VotingContext] fetchActiveSession: other error, setting error state');
          setError(err.message);
          setIsOffline(false);
        }
      } else {
        console.error('[VotingContext] fetchActiveSession: unknown error type', err);
        setError('Unknown error occurred');
        setIsOffline(true);
      }
    } finally {
      if (mountedRef.current) {
        console.debug('[VotingContext] fetchActiveSession: FINALLY block - setting loading to false');
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual refresh function
  const refreshSession = useCallback(async () => {
    console.debug('[VotingContext] refreshSession called', { groupId });
    if (typeof groupId !== 'number' || Number.isNaN(groupId)) {
      console.debug('[VotingContext] refreshSession: invalid groupId', groupId);
      return;
    }
    console.debug('[VotingContext] refreshSession: calling fetchActiveSession');
    await fetchActiveSession(false);
  }, [fetchActiveSession, groupId]);

  // Force sync now function - manual refresh with user feedback
  const forceSyncNow = useCallback(async () => {
    console.debug('[VotingContext] forceSyncNow called');
    if (typeof groupId !== 'number' || Number.isNaN(groupId)) {
      console.debug('[VotingContext] forceSyncNow: invalid groupId', groupId);
      return;
    }
    
    try {
      console.debug('[VotingContext] forceSyncNow: starting manual sync with loader');
      await fetchActiveSession(true); // Show loader for manual sync
      console.debug('[VotingContext] forceSyncNow: sync complete');
    } catch (error) {
      console.error('[VotingContext] forceSyncNow: error', error);
      const msg = error instanceof Error ? error.message : String(error || 'Manual sync failed');
      setError(msg);
    }
  }, [fetchActiveSession, groupId]);

  // Start a new session
  const startSession = useCallback(async () => {
    console.debug('[VotingContext] startSession called', { groupId });
    if (typeof groupId !== 'number' || Number.isNaN(groupId)) {
      console.debug('[VotingContext] startSession: invalid groupId', groupId);
      return;
    }
    console.debug('[VotingContext] startSession: calling fetchActiveSession');
    await fetchActiveSession(true);
  }, [fetchActiveSession, groupId]);

  // Clear session (e.g., when leaving group page)
  const clearSession = useCallback(() => {
    console.debug('[VotingContext] clearSession called');
    setActiveSession(null);

    setError(null);
    console.debug('[VotingContext] clearSession: state cleared');
  }, []);

  // Notify all listeners that a voting session has completed
  const notifyVotingCompleted = useCallback((sessionId: number) => {
    console.debug('[VotingContext] notifyVotingCompleted:', sessionId, 'listeners:', completionListenersRef.current.size);
    completionListenersRef.current.forEach(callback => {
      try {
        callback(sessionId);
      } catch (err) {
        console.error('[VotingContext] Error in completion listener:', err);
      }
    });
  }, []);

  // Register a listener for voting completion events
  const onVotingCompleted = useCallback((callback: (sessionId: number) => void) => {
    console.debug('[VotingContext] onVotingCompleted: registering listener');
    completionListenersRef.current.add(callback);
    
    // Return cleanup function
    return () => {
      console.debug('[VotingContext] onVotingCompleted: unregistering listener');
      completionListenersRef.current.delete(callback);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    console.debug('[VotingContext] useEffect (initial fetch): starting, groupId=', groupId);
    fetchActiveSession(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchActiveSession]);

  // Socket.IO setup and real-time event listeners
  useEffect(() => {
    if (!groupId || typeof groupId !== 'number' || Number.isNaN(groupId)) {
      console.debug('[VotingContext] Socket setup: invalid groupId', groupId);
      return;
    }

    console.debug('[VotingContext] Socket setup: initializing for group', groupId);
    
    // Connect to Socket.IO (will reuse existing connection if already connected)
    votingSocket.connect();

    // Subscribe to group events
    votingSocket.subscribeToGroup(groupId);
    console.debug('[VotingContext] Socket setup: subscribed to group', groupId);

    // Listen for session created
    const unsubscribeCreated = votingSocket.onSessionCreated((session) => {
      if (!mountedRef.current || session.groupId !== groupId) return;
      
      console.log('[VotingContext] Socket event: voting:session:created', session);
      setActiveSession(session);
      previousStatusRef.current = session.status;
      setLastSyncTime(new Date());
    });

    // Listen for session updated
    const unsubscribeUpdated = votingSocket.onSessionUpdated((session) => {
      if (!mountedRef.current || session.groupId !== groupId) return;
      
      console.log('[VotingContext] Socket event: voting:session:updated', session);
      
      // Check if session completed
      const wasVoting = previousStatusRef.current === 'voting_phase';
      const nowCompleted = session.status === 'completed';
      
      if (wasVoting && nowCompleted) {
        console.log('[VotingContext] Socket: Session completed, showing results');

        // Notify completion listeners
        completionListenersRef.current.forEach(callback => {
          try {
            callback(session.VotingSessionID);
          } catch (err) {
            console.error('[VotingContext] Error in completion listener:', err);
          }
        });
      }
      
      setActiveSession(session);
      previousStatusRef.current = session.status;
      setLastSyncTime(new Date());
    });

    // Listen for voting phase started
    const unsubscribePhaseStarted = votingSocket.onVotingPhaseStarted((session) => {
      if (!mountedRef.current || session.groupId !== groupId) return;
      
      console.log('[VotingContext] Socket event: voting:phase:started', session);
      setActiveSession(session);
      previousStatusRef.current = session.status;
      setLastSyncTime(new Date());
    });

    // Listen for voting completed
    const unsubscribeCompleted = votingSocket.onVotingCompleted((result) => {
      if (!mountedRef.current || result.groupId !== groupId) return;
      
      console.log('[VotingContext] Socket event: voting:completed', result);
      setActiveSession(result);
      previousStatusRef.current = result.status;
      setLastSyncTime(new Date());
      
      // Notify completion listeners
      completionListenersRef.current.forEach(callback => {
        try {
          callback(result.VotingSessionID);
        } catch (err) {
          console.error('[VotingContext] Error in completion listener:', err);
        }
      });
    });

    // Listen for meal proposed
    const unsubscribeMealProposed = votingSocket.onMealProposed(async (proposal) => {
      if (!mountedRef.current) return;
      
      console.log('[VotingContext] Socket event: voting:meal:proposed', proposal);
      // Refresh session to get updated proposals list
      await fetchActiveSession(false);
      setLastSyncTime(new Date());
    });

    // Listen for vote cast
    const unsubscribeVoteCast = votingSocket.onVoteCast(async (data) => {
      if (!mountedRef.current) return;
      
      console.log('[VotingContext] Socket event: voting:vote:cast', data);
      // Refresh session to get updated vote counts
      await fetchActiveSession(false);
      setLastSyncTime(new Date());
    });

    // Listen for user confirmations
    const unsubscribeConfirmedReady = votingSocket.onUserConfirmedReady(async (confirmation) => {
      if (!mountedRef.current) return;
      console.log('[VotingContext] Socket event: voting:user:confirmed-ready', confirmation);
      // Refresh session to get updated confirmation counts
      await fetchActiveSession(false);
      setLastSyncTime(new Date());
    });

    const unsubscribeConfirmedVotes = votingSocket.onUserConfirmedVotes(async (confirmation) => {
      if (!mountedRef.current) return;
      console.log('[VotingContext] Socket event: voting:user:confirmed-votes', confirmation);
      // Refresh session to get updated confirmation counts
      await fetchActiveSession(false);
      setLastSyncTime(new Date());
    });

    // Cleanup on unmount
    return () => {
      console.debug('[VotingContext] Socket cleanup: unsubscribing from group', groupId);
      
      // Unsubscribe from all events
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribePhaseStarted();
      unsubscribeCompleted();
      unsubscribeMealProposed();
      unsubscribeVoteCast();
      unsubscribeConfirmedReady();
      unsubscribeConfirmedVotes();
      
      // Unsubscribe from group
      votingSocket.unsubscribeFromGroup(groupId);
    };
  }, [groupId, fetchActiveSession]);

  console.debug('[VotingContext] Provider rendering, state=', { groupId, activeSession: activeSession?.VotingSessionID, loading, error: error?.substring(0, 50) });

  const value: VotingContextType = {
    activeSession,
    loading,
    error,
    refreshSession,
    startSession,
    clearSession,
    notifyVotingCompleted,
    onVotingCompleted,
    isOffline,
    forceSyncNow,
    lastSyncTime,
  };

  return (
    <VotingContext.Provider value={value}>
      {children}
    </VotingContext.Provider>
  );
}

export function useVoting() {
  const context = useContext(VotingContext);
  if (context === undefined) {
    console.error('[useVoting] ERROR: useVoting must be used within a VotingProvider');
    throw new Error('useVoting must be used within a VotingProvider');
  }
  console.debug('[useVoting] hook called, context state=', { 
    activeSession: context.activeSession?.VotingSessionID, 
    loading: context.loading,
    error: context.error?.substring(0, 50)
  });
  return context;
}

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { VotingService } from '@/components/voting/VotingService';
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
  
  // Results modal state (persists across re-renders)
  showResultsModal: boolean;
  setShowResultsModal: (show: boolean) => void;
  
  // Notify when a voting session completes
  notifyVotingCompleted: (sessionId: number) => void;
  onVotingCompleted: (callback: (sessionId: number) => void) => () => void;
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
  const [showResultsModal, setShowResultsModal] = useState(false);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
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

  // Fetch active voting session for this group
  // NOTE: Do NOT include fetchActiveSession in any useEffect deps except initial fetch
  const fetchActiveSession = useCallback(async (showLoader = true) => {
    // If groupId is not a valid number, bail out and clear loading so UI isn't stuck
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
        console.debug('[VotingContext] fetchActiveSession: setting loading to true');
        setLoading(true);
      }
      
      console.debug('[VotingContext] fetchActiveSession: calling VotingService.getActiveVotingSessions');
      const sessions = await VotingService.getActiveVotingSessions(groupId);
      console.debug('[VotingContext] fetchActiveSession: received sessions', { count: sessions?.length, sessions });
      
      const session = sessions && sessions.length > 0 ? sessions[0] : null;
      console.debug('[VotingContext] fetchActiveSession: extracted first session', { session });
      
      if (!mountedRef.current) {
        console.debug('[VotingContext] fetchActiveSession: component unmounted after fetch, skipping state update');
        return;
      }
      
      // Detect status changes
      if (session?.status !== previousStatusRef.current) {
        console.debug('[VotingContext] fetchActiveSession: status changed', { previous: previousStatusRef.current, current: session?.status });
        // If session just completed, show results modal
        if (previousStatusRef.current === 'voting_phase' && session?.status === 'completed') {
          console.debug('[VotingContext] fetchActiveSession: session completed from voting_phase, showing results modal');
          setShowResultsModal(true);
        } else if (session?.status === 'completed' && !previousStatusRef.current?.includes('completed')) {
          // Also catch completion if we didn't see the voting_phase (in case we missed a poll)
          console.debug('[VotingContext] fetchActiveSession: session completed (not from voting_phase), showing results modal');
          setShowResultsModal(true);
        }
        previousStatusRef.current = session?.status || null;
      } else {
        console.debug('[VotingContext] fetchActiveSession: status unchanged', { status: session?.status });
      }
      
      console.debug('[VotingContext] fetchActiveSession: success, setting session state', { session });
      setActiveSession(session);
      setError(null);
    } catch (err) {
      console.error('[VotingContext] fetchActiveSession: CATCH BLOCK', err);
      if (!mountedRef.current) {
        console.debug('[VotingContext] fetchActiveSession: component unmounted during error handling, skipping state update');
        return;
      }
      
      // No active session is expected, so we don't set error for 404
      if (err instanceof Error) {
        console.error('[VotingContext] fetchActiveSession: error details', { message: err.message, includes404: err.message.includes('404') });
        if (!err.message.includes('404')) {
          console.error('[VotingContext] fetchActiveSession: setting error state', err.message);
          setError(err.message);
        } else {
          console.debug('[VotingContext] fetchActiveSession: 404 error (no active session), ignoring');
        }
      }
      setActiveSession(null);
    } finally {
      if (mountedRef.current) {
        console.debug('[VotingContext] fetchActiveSession: FINALLY block - setting loading to false');
        setLoading(false);
      } else {
        console.debug('[VotingContext] fetchActiveSession: FINALLY block - component not mounted, NOT setting loading');
      }
    }
  }, [groupId]);  // Manual refresh function
  const refreshSession = useCallback(async () => {
    console.debug('[VotingContext] refreshSession called', { groupId });
    if (typeof groupId !== 'number' || Number.isNaN(groupId)) {
      console.debug('[VotingContext] refreshSession: invalid groupId', groupId);
      return;
    }
    console.debug('[VotingContext] refreshSession: calling fetchActiveSession');
    await fetchActiveSession(false);
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
    setShowResultsModal(false);
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
    console.debug('[VotingContext] useEffect (initial fetch): calling fetchActiveSession(true)');
    fetchActiveSession(true).then(() => {
      console.debug('[VotingContext] useEffect (initial fetch): fetchActiveSession promise resolved');
    }).catch((err) => {
      console.error('[VotingContext] useEffect (initial fetch): fetchActiveSession promise rejected', err);
    });
    console.debug('[VotingContext] useEffect (initial fetch): completed (async call started)');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchActiveSession]);

  // Smart polling - only for detecting session lifecycle changes
  useEffect(() => {
    console.debug('[VotingContext] useEffect (polling setup): starting, groupId=', groupId);
    
    // Clear any existing interval
    if (pollIntervalRef.current) {
      console.debug('[VotingContext] polling: clearing existing interval');
      clearInterval(pollIntervalRef.current);
    }

    // Only poll if we might need to detect changes
    // We poll less frequently for lifecycle changes (session start/end)
    pollIntervalRef.current = setInterval(async () => {
      if (!mountedRef.current) {
        console.debug('[VotingContext] polling interval: component not mounted, skipping');
        return;
      }
      if (!groupId) {
        console.debug('[VotingContext] polling interval: no groupId, skipping');
        return;
      }
      
      console.debug('[VotingContext] polling interval: fetching sessions, groupId=', groupId);
      try {
        const sessions = await VotingService.getActiveVotingSessions(groupId);
        const session = sessions.length > 0 ? sessions[0] : null;
        
        console.debug('[VotingContext] polling interval: fetch result', { sessionId: session?.VotingSessionID, status: session?.status });
        
        if (!mountedRef.current) {
          console.debug('[VotingContext] polling interval: component unmounted after fetch, skipping state update');
          return;
        }
        
        // Only update if:
        // 1. Session appeared (was null, now exists)
        // 2. Session disappeared (existed, now null)
        // 3. Different session (different ID)
        // 4. Status changed (proposal -> voting -> completed)
        const shouldUpdate = 
          (!activeSession && session) ||
          (activeSession && !session) ||
          (activeSession && session && activeSession.VotingSessionID !== session.VotingSessionID) ||
          (activeSession && session && activeSession.status !== session.status) ||
          (activeSession && session && activeSession.proposals?.length !== session.proposals?.length);
        
        console.debug('[VotingContext] polling interval: shouldUpdate=', shouldUpdate, { 
          had: activeSession?.VotingSessionID, 
          now: session?.VotingSessionID,
          hadStatus: activeSession?.status,
          nowStatus: session?.status
        });
        
        if (shouldUpdate) {
          console.debug('[VotingContext] polling interval: updating session state');
          // Detect completion
          if (activeSession?.status === 'voting_phase' && session?.status === 'completed') {
            console.debug('[VotingContext] polling interval: session completed from voting_phase, showing results modal');
            setShowResultsModal(true);
          } else if (session?.status === 'completed' && activeSession?.status !== 'completed') {
            console.debug('[VotingContext] polling interval: session completed (status changed to completed), showing results modal');
            setShowResultsModal(true);
          }
          
          setActiveSession(session);
          previousStatusRef.current = session?.status || null;
        }
      } catch (err) {
        console.error('[VotingContext] polling interval: error', err);
      }
    }, 2000); // Poll every 20 seconds for lifecycle changes
    
    console.debug('[VotingContext] useEffect (polling setup): interval set up');

    return () => {
      console.debug('[VotingContext] useEffect (polling cleanup): cleaning up interval');
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);
  // CRITICAL FIX: We intentionally exclude activeSession and nested props from deps to prevent infinite loop.
  // The polling interval should only be set up once per groupId, not re-created when activeSession data changes.
  // We access activeSession via closure to capture its current state without triggering re-setup.

  // Cleanup on unmount
  useEffect(() => {
    console.debug('[VotingContext] useEffect (cleanup): setting up interval cleanup');
    return () => {
      console.debug('[VotingContext] useEffect (cleanup): running cleanup, clearing interval');
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        console.debug('[VotingContext] useEffect (cleanup): interval cleared');
      }
    };
  }, []);

  console.debug('[VotingContext] Provider rendering, state=', { groupId, activeSession: activeSession?.VotingSessionID, loading, error: error?.substring(0, 50) });

  const value: VotingContextType = {
    activeSession,
    loading,
    error,
    refreshSession,
    startSession,
    clearSession,
    showResultsModal,
    setShowResultsModal,
    notifyVotingCompleted,
    onVotingCompleted,
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

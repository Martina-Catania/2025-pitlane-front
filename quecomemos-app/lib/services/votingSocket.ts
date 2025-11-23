import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/config/api';
import type { VotingSession, MealProposal, Vote } from '@/components/voting/types';

/**
 * Socket.IO client service for real-time voting updates
 */
class VotingSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Initialize socket connection
   */
  connect(): Socket {
    if (this.socket?.connected) {
      console.log('[VotingSocket] Already connected');
      return this.socket;
    }

    // Extract base URL without /api if present
    const baseUrl = API_BASE_URL.replace('/api', '');
    
    // Socket.IO doesn't work on Vercel - return a mock that won't try to connect
    const isVercel = baseUrl.includes('vercel.app');
    
    if (isVercel) {
      console.warn('[VotingSocket] ⚠️  Vercel deployment detected - Socket.IO not supported');
      console.warn('[VotingSocket] Using REST API polling instead');
      
      // Create a mock socket that won't try to connect
      // Must implement all Socket.IO methods to prevent errors
      this.socket = {
        connected: false,
        id: 'mock-socket-vercel',
        on: () => this.socket!,
        once: () => this.socket!,
        off: () => this.socket!,
        emit: () => this.socket!,
        connect: () => this.socket!,
        disconnect: () => this.socket!,
        removeListener: () => this.socket!,
        removeAllListeners: () => this.socket!,
        listeners: () => [],
        io: { 
          engine: { 
            transport: { name: 'none' } 
          } 
        }
      } as unknown as Socket;
      
      return this.socket;
    }
    
    // Only use Socket.IO for non-Vercel deployments
    const transports = ['websocket', 'polling'];
    
    console.log('[VotingSocket] 🔌 Connecting to:', baseUrl);
    console.log('[VotingSocket] Environment:', process.env.NODE_ENV);
    console.log('[VotingSocket] Using transports:', transports);

    this.socket = io(baseUrl, {
      path: '/socket.io',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transports: transports as any,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true,
      forceNew: false,
      withCredentials: false,
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('[VotingSocket] ✅ Connected successfully:', this.socket?.id);
      console.log('[VotingSocket] Transport:', this.socket?.io.engine.transport.name);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[VotingSocket] ❌ Disconnected:', reason);
      if (reason === 'io server disconnect') {
        console.log('[VotingSocket] Server disconnected, attempting to reconnect...');
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[VotingSocket] ⚠️ Connection error:', error.message);
      console.error('[VotingSocket] Full error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[VotingSocket] 🚨 Max reconnection attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[VotingSocket] Reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[VotingSocket] Reconnection attempt', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('[VotingSocket] Reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[VotingSocket] Reconnection failed');
    });

    return this.socket;
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      console.log('[VotingSocket] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Subscribe to a group's voting events
   */
  subscribeToGroup(groupId: number) {
    if (!this.socket) {
      console.warn('[VotingSocket] Cannot subscribe - socket not initialized');
      return;
    }

    // If not connected yet, wait for connection then subscribe
    if (!this.socket.connected) {
      console.log('[VotingSocket] Socket not connected yet, waiting for connection before subscribing to group:', groupId);
      this.socket.once('connect', () => {
        console.log('[VotingSocket] Connected! Now subscribing to group:', groupId);
        this.socket!.emit('subscribe:group', groupId);
      });
      return;
    }

    console.log('[VotingSocket] Subscribing to group:', groupId);
    this.socket.emit('subscribe:group', groupId);
  }

  /**
   * Unsubscribe from a group's voting events
   */
  unsubscribeFromGroup(groupId: number) {
    if (!this.socket?.connected) {
      return;
    }

    console.log('[VotingSocket] Unsubscribing from group:', groupId);
    this.socket.emit('unsubscribe:group', groupId);
  }

  /**
   * Subscribe to a specific voting session
   */
  subscribeToSession(sessionId: number) {
    if (!this.socket?.connected) {
      console.warn('[VotingSocket] Cannot subscribe - not connected');
      return;
    }

    console.log('[VotingSocket] Subscribing to session:', sessionId);
    this.socket.emit('subscribe:voting-session', sessionId);
  }

  /**
   * Unsubscribe from a specific voting session
   */
  unsubscribeFromSession(sessionId: number) {
    if (!this.socket?.connected) {
      return;
    }

    console.log('[VotingSocket] Unsubscribing from session:', sessionId);
    this.socket.emit('unsubscribe:voting-session', sessionId);
  }

  /**
   * Listen for voting session created events
   */
  onSessionCreated(callback: (session: VotingSession) => void) {
    if (!this.socket) {
      console.warn('[VotingSocket] Cannot listen - socket not initialized');
      return () => {};
    }

    console.log('[VotingSocket] Listening for voting:session:created');
    this.socket.on('voting:session:created', callback);

    // Return cleanup function
    return () => {
      this.socket?.off('voting:session:created', callback);
    };
  }

  /**
   * Listen for voting session updated events
   */
  onSessionUpdated(callback: (session: VotingSession) => void) {
    if (!this.socket) {
      console.warn('[VotingSocket] Cannot listen - socket not initialized');
      return () => {};
    }

    console.log('[VotingSocket] Listening for voting:session:updated');
    this.socket.on('voting:session:updated', callback);

    return () => {
      this.socket?.off('voting:session:updated', callback);
    };
  }

  /**
   * Listen for meal proposed events
   */
  onMealProposed(callback: (proposal: MealProposal) => void) {
    if (!this.socket) {
      console.warn('[VotingSocket] Cannot listen - socket not initialized');
      return () => {};
    }

    console.log('[VotingSocket] Listening for voting:meal:proposed');
    this.socket.on('voting:meal:proposed', callback);

    return () => {
      this.socket?.off('voting:meal:proposed', callback);
    };
  }

  /**
   * Listen for voting phase started events
   */
  onVotingPhaseStarted(callback: (session: VotingSession) => void) {
    if (!this.socket) {
      console.warn('[VotingSocket] Cannot listen - socket not initialized');
      return () => {};
    }

    console.log('[VotingSocket] Listening for voting:phase:started');
    this.socket.on('voting:phase:started', callback);

    return () => {
      this.socket?.off('voting:phase:started', callback);
    };
  }

  /**
   * Listen for vote cast events
   */
  onVoteCast(callback: (data: { vote: Vote; proposal: MealProposal }) => void) {
    if (!this.socket) {
      console.warn('[VotingSocket] Cannot listen - socket not initialized');
      return () => {};
    }

    console.log('[VotingSocket] Listening for voting:vote:cast');
    this.socket.on('voting:vote:cast', callback);

    return () => {
      this.socket?.off('voting:vote:cast', callback);
    };
  }

  /**
   * Listen for voting completed events
   */
  onVotingCompleted(callback: (result: VotingSession) => void) {
    if (!this.socket) {
      console.warn('[VotingSocket] Cannot listen - socket not initialized');
      return () => {};
    }

    console.log('[VotingSocket] Listening for voting:completed');
    this.socket.on('voting:completed', callback);

    return () => {
      this.socket?.off('voting:completed', callback);
    };
  }

  /**
   * Listen for user confirmed ready events
   */
  onUserConfirmedReady(callback: (confirmation: Record<string, unknown>) => void) {
    if (!this.socket) {
      console.warn('[VotingSocket] Cannot listen - socket not initialized');
      return () => {};
    }

    console.log('[VotingSocket] Listening for voting:user:confirmed-ready');
    this.socket.on('voting:user:confirmed-ready', callback);

    return () => {
      this.socket?.off('voting:user:confirmed-ready', callback);
    };
  }

  /**
   * Listen for user confirmed votes events
   */
  onUserConfirmedVotes(callback: (confirmation: Record<string, unknown>) => void) {
    if (!this.socket) {
      console.warn('[VotingSocket] Cannot listen - socket not initialized');
      return () => {};
    }

    console.log('[VotingSocket] Listening for voting:user:confirmed-votes');
    this.socket.on('voting:user:confirmed-votes', callback);

    return () => {
      this.socket?.off('voting:user:confirmed-votes', callback);
    };
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    // On Vercel, we use REST polling instead, so always return false
    if (this.socket?.id === 'mock-socket-vercel') {
      return false;
    }
    return this.socket?.connected ?? false;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Force reconnect
   */
  forceReconnect() {
    console.log('[VotingSocket] 🔄 Force reconnecting...');
    if (this.socket) {
      this.socket.disconnect();
      this.reconnectAttempts = 0;
      setTimeout(() => {
        this.socket?.connect();
      }, 500);
    } else {
      this.connect();
    }
  }

  /**
   * Get connection status details
   */
  getConnectionStatus() {
    return {
      connected: this.socket?.connected ?? false,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      transport: this.socket?.io?.engine?.transport?.name
    };
  }
}

// Export singleton instance
export const votingSocket = new VotingSocketService();

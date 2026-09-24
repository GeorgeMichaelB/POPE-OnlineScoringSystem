// Real-time Multi-Device Class Synchronization Service
// Enables instant data propagation across all servants' phones, tablets, and laptops in the same class

export type SyncEventType =
  | 'STUDENTS_UPDATED'
  | 'ATTENDANCE_UPDATED'
  | 'DARS_KTAB_UPDATED'
  | 'MAL3AB_UPDATED'
  | 'SUMMER_CLUB_UPDATED'
  | 'SUMMER_CLUB_SETTINGS_UPDATED'
  | 'CONFESSIONS_UPDATED'
  | 'CUSTOM_EVENTS_UPDATED'
  | 'VISITS_UPDATED'
  | 'POINT_SETTINGS_UPDATED'
  | 'CUSTOM_POINTS_UPDATED'
  | 'CLASS_HEROES_UPDATED'
  | 'AUDIT_LOGS_UPDATED'
  | 'CLASSES_UPDATED'
  | 'USERS_UPDATED'
  | 'TIMER_STATE_UPDATED'
  | 'FULL_SYNC';

export interface SyncMessage<T = unknown> {
  id: string;
  classId: string;
  type: SyncEventType;
  data: T;
  senderUsername: string;
  senderName: string;
  clientId: string;
  timestamp: number;
  description?: string;
}

export type SyncConnectionStatus = 'connected' | 'connecting' | 'offline';

type SyncMessageListener = (msg: SyncMessage) => void;
export type StatusListener = (status: SyncConnectionStatus, clientCount?: number) => void;
function getApiUrl(endpoint: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return endpoint;
  }
  return `http://localhost:5173${endpoint}`;
}

export class RealtimeSyncService {
  private activeClassId = 'class_popesaweros';
  public clientId: string;
  private currentUser: { username: string; name: string } | null = null;
  private eventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private status: SyncConnectionStatus = 'connecting';
  private connectedServantsCount = 1;
  private lastSyncTime: number | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageListeners = new Set<SyncMessageListener>();
  private statusListeners = new Set<StatusListener>();
  private recentMessageIds = new Set<string>();

  constructor(customClientId?: string) {
    this.clientId = customClientId || (typeof window !== 'undefined'
      ? `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      : `server_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

    if (typeof window !== 'undefined') {
      // Listen to cross-window storage events as fallback
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('pss_sync_signal_') && e.newValue) {
          try {
            const msg: SyncMessage = JSON.parse(e.newValue);
            this.handleIncomingMessage(msg);
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }

  /**
   * Initializes or switches the synchronization channel for the active class
   */
  init(classId: string, user?: { username: string; name: string } | null) {
    if (user) {
      this.currentUser = { username: user.username, name: user.name };
    }

    if (this.activeClassId === classId && this.eventSource) {
      return;
    }

    this.activeClassId = classId;
    this.setupBroadcastChannel();
    this.connectSSE();
  }

  /**
   * Updates the current servant user profile for outgoing updates
   */
  setCurrentUser(user: { username: string; name: string } | null) {
    this.currentUser = user;
  }

  getActiveClassId(): string {
    return this.activeClassId;
  }

  getStatus(): SyncConnectionStatus {
    return this.status;
  }

  getConnectedServantsCount(): number {
    return this.connectedServantsCount;
  }

  getLastSyncTime(): number | null {
    return this.lastSyncTime;
  }

  /**
   * Local cross-tab BroadcastChannel for sub-millisecond sync on the same device
   */
  private setupBroadcastChannel() {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {
        // Ignore close error
      }
    }

    try {
      this.broadcastChannel = new BroadcastChannel(`pss_sync_${this.activeClassId}`);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && typeof event.data === 'object') {
          this.handleIncomingMessage(event.data as SyncMessage);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not available, falling back to network/storage sync:', e);
    }
  }

  /**
   * Connects to Server-Sent Events (SSE) endpoint for multi-device sync
   */
  private connectSSE() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {
        // Ignore close error
      }
      this.eventSource = null;
    }

    this.updateStatus('connecting');

    try {
      const sseUrl = getApiUrl(`/api/sync/events?classId=${encodeURIComponent(this.activeClassId)}&clientId=${encodeURIComponent(this.clientId)}`);
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.addEventListener('handshake', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          this.connectedServantsCount = payload.connectedServantsCount || 1;
          this.updateStatus('connected', this.connectedServantsCount);
          this.lastSyncTime = Date.now();
        } catch {
          this.updateStatus('connected', 1);
        }
      });

      this.eventSource.addEventListener('message', (e: MessageEvent) => {
        try {
          const msg: SyncMessage = JSON.parse(e.data);
          this.handleIncomingMessage(msg);
        } catch (err) {
          console.warn('Error parsing incoming sync packet:', err);
        }
      });

      this.eventSource.onopen = () => {
        this.updateStatus('connected');
        this.lastSyncTime = Date.now();
      };

      this.eventSource.onerror = () => {
        this.updateStatus('offline');
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        // Auto-reconnect after 3 seconds
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connectSSE();
        }, 3000);
      };
    } catch (e) {
      console.warn('Failed to initialize SSE connection:', e);
      this.updateStatus('offline');
    }
  }

  private updateStatus(newStatus: SyncConnectionStatus, count?: number) {
    this.status = newStatus;
    if (count !== undefined) {
      this.connectedServantsCount = count;
    }
    this.statusListeners.forEach((listener) => {
      try {
        listener(this.status, this.connectedServantsCount);
      } catch (err) {
        console.warn('Error in sync status listener:', err);
      }
    });
  }

  /**
   * Internal dispatcher for incoming sync messages
   */
  private handleIncomingMessage(msg: SyncMessage) {
    if (!msg || !msg.id) return;

    // Ignore messages generated by this same tab/client
    if (msg.clientId === this.clientId) return;

    // Verify class scope
    if (msg.classId && msg.classId !== this.activeClassId && msg.type !== 'CLASSES_UPDATED' && msg.type !== 'USERS_UPDATED') {
      return;
    }

    // Deduplicate packets received over multiple channels (SSE + BroadcastChannel)
    if (this.recentMessageIds.has(msg.id)) return;
    this.recentMessageIds.add(msg.id);
    if (this.recentMessageIds.size > 200) {
      // Keep set bounded
      const it = this.recentMessageIds.values();
      this.recentMessageIds.delete(it.next().value as string);
    }

    this.lastSyncTime = Date.now();

    // Dispatch to all component subscribers
    this.messageListeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.warn('Error in sync message listener:', err);
      }
    });
  }

  /**
   * Broadcasts an action immediately to all other servants in the same class
   */
  async publish<T = unknown>(params: {
    classId?: string;
    type: SyncEventType;
    data: T;
    senderUsername?: string;
    senderName?: string;
    description?: string;
  }): Promise<void> {
    const classId = params.classId || this.activeClassId;
    const msg: SyncMessage<T> = {
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      classId,
      type: params.type,
      data: params.data,
      senderUsername: params.senderUsername || this.currentUser?.username || 'servant',
      senderName: params.senderName || this.currentUser?.name || 'Servant',
      clientId: this.clientId,
      timestamp: Date.now(),
      description: params.description,
    };

    // Mark as seen by self to avoid echo
    this.recentMessageIds.add(msg.id);

    // 1. Instant local BroadcastChannel (<1ms)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (e) {
        console.warn('Error broadcasting locally:', e);
      }
    }

    // 2. Storage event fallback
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`pss_sync_signal_${classId}`, JSON.stringify(msg));
      } catch {
        // Safe fallback
      }
    }

    // 3. Network SSE/HTTP broadcast across all devices
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      try {
        await fetch(getApiUrl('/api/sync/publish'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Id': this.clientId,
          },
          body: JSON.stringify(msg),
        });
      } catch (err) {
        console.warn('Network sync publish warning (will rely on local channels):', err);
      }
    }
  }

  /**
   * Directly dispatches a remote message to local listeners (used for testing or P2P bridges)
   */
  dispatchRemoteMessage(msg: SyncMessage) {
    this.handleIncomingMessage(msg);
  }

  /**
   * Subscribe to incoming real-time sync events from other servants
   */
  subscribe(listener: SyncMessageListener): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  /**
   * Subscribe to network connection state changes
   */
  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    // Fire current status immediately
    listener(this.status, this.connectedServantsCount);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Fetches latest state snapshot from server (useful on first load or reconnect)
   */
  async fetchSnapshot(classId = this.activeClassId): Promise<Record<string, unknown> | null> {
    if (typeof fetch === 'undefined') return null;
    try {
      const res = await fetch(getApiUrl(`/api/sync/snapshot?classId=${encodeURIComponent(classId)}`));
      if (res.ok) {
        const json = await res.json();
        return json.snapshot || null;
      }
    } catch {
      // Safe fallback
    }
    return null;
  }
}

export const syncService = new RealtimeSyncService();

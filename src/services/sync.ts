// Real-time Multi-Device Class Synchronization Service
// Enables instant data propagation across all servants' phones, tablets, and laptops in the same class
// Combines Firebase Cloud Firestore (cross-device/internet) + Local BroadcastChannel + Network SSE fallback

import { cloudSync, type CloudSyncStatus } from './firebase';

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

export const SYNC_EVENT_TO_SECTION: Record<SyncEventType, string> = {
  STUDENTS_UPDATED: 'students',
  ATTENDANCE_UPDATED: 'attendance',
  DARS_KTAB_UPDATED: 'darsKtab',
  MAL3AB_UPDATED: 'mal3ab',
  SUMMER_CLUB_UPDATED: 'summerClub',
  SUMMER_CLUB_SETTINGS_UPDATED: 'summerClubSettings',
  CONFESSIONS_UPDATED: 'confessions',
  CUSTOM_EVENTS_UPDATED: 'customEvents',
  VISITS_UPDATED: 'visits',
  POINT_SETTINGS_UPDATED: 'pointSettings',
  CUSTOM_POINTS_UPDATED: 'customPoints',
  CLASS_HEROES_UPDATED: 'classHeroes',
  AUDIT_LOGS_UPDATED: 'auditLogs',
  CLASSES_UPDATED: 'classes',
  USERS_UPDATED: 'users',
  TIMER_STATE_UPDATED: 'timer',
  FULL_SYNC: 'fullSync',
};

export const SECTION_TO_SYNC_EVENT: Record<string, SyncEventType> = {
  students: 'STUDENTS_UPDATED',
  pss_students_v3: 'STUDENTS_UPDATED',
  attendance: 'ATTENDANCE_UPDATED',
  pss_attendance_v2: 'ATTENDANCE_UPDATED',
  darsKtab: 'DARS_KTAB_UPDATED',
  pss_dars_ktab_v2: 'DARS_KTAB_UPDATED',
  mal3ab: 'MAL3AB_UPDATED',
  pss_mal3ab_v2: 'MAL3AB_UPDATED',
  summerClub: 'SUMMER_CLUB_UPDATED',
  pss_summer_club_v2: 'SUMMER_CLUB_UPDATED',
  summerClubSettings: 'SUMMER_CLUB_SETTINGS_UPDATED',
  pss_summer_club_settings_v1: 'SUMMER_CLUB_SETTINGS_UPDATED',
  confessions: 'CONFESSIONS_UPDATED',
  pss_confessions_v2: 'CONFESSIONS_UPDATED',
  customEvents: 'CUSTOM_EVENTS_UPDATED',
  pss_custom_events_v2: 'CUSTOM_EVENTS_UPDATED',
  visits: 'VISITS_UPDATED',
  pss_visits_v2: 'VISITS_UPDATED',
  pointSettings: 'POINT_SETTINGS_UPDATED',
  pss_point_settings_v1: 'POINT_SETTINGS_UPDATED',
  customPoints: 'CUSTOM_POINTS_UPDATED',
  pss_custom_points_v2: 'CUSTOM_POINTS_UPDATED',
  classHeroes: 'CLASS_HEROES_UPDATED',
  pss_class_heroes_v2: 'CLASS_HEROES_UPDATED',
  auditLogs: 'AUDIT_LOGS_UPDATED',
  pss_audit_logs_v2: 'AUDIT_LOGS_UPDATED',
  classes: 'CLASSES_UPDATED',
  pss_saas_classes_v1: 'CLASSES_UPDATED',
  users: 'USERS_UPDATED',
  pss_users_v3: 'USERS_UPDATED',
};

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
  private unsubCloudClass: (() => void) | null = null;
  private unsubCloudUsers: (() => void) | null = null;
  private unsubCloudClasses: (() => void) | null = null;

  constructor(customClientId?: string) {
    this.clientId =
      customClientId ||
      (typeof window !== 'undefined'
        ? `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        : `server_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

    if (typeof window !== 'undefined') {
      // Listen to cross-window storage events as fallback for same-browser tabs
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

      // Listen to cloud status changes
      cloudSync.onStatusChange((cloudStatus: CloudSyncStatus) => {
        if (cloudStatus === 'connected') {
          this.updateStatus('connected');
        } else if (cloudStatus === 'connecting') {
          this.updateStatus('connecting');
        } else if (cloudStatus === 'error') {
          // If local server is not connected either, set offline
          if (!this.eventSource || this.eventSource.readyState !== EventSource.OPEN) {
            this.updateStatus('offline');
          }
        }
      });
    }
  }

  /**
   * Initializes or switches the synchronization channel for the active class
   */
  async init(classId: string, user?: { username: string; name: string } | null) {
    if (user) {
      this.currentUser = { username: user.username, name: user.name };
      cloudSync.setServant(user.username, user.name);
    }

    this.activeClassId = classId;
    this.setupBroadcastChannel();
    this.connectSSE();
    await this.setupCloudSync(classId);
  }

  /**
   * Sets up real-time listener with Google Cloud Firestore
   */
  private async setupCloudSync(classId: string) {
    if (this.unsubCloudClass) {
      this.unsubCloudClass();
      this.unsubCloudClass = null;
    }
    if (this.unsubCloudUsers) {
      this.unsubCloudUsers();
      this.unsubCloudUsers = null;
    }
    if (this.unsubCloudClasses) {
      this.unsubCloudClasses();
      this.unsubCloudClasses = null;
    }

    if (!cloudSync.isConfigured()) {
      return;
    }

    try {
      // 1. Subscribe to class sections
      this.unsubCloudClass = await cloudSync.subscribeToClass(
        classId,
        (sectionKey: string, data: unknown, senderName?: string) => {
          const syncType = SECTION_TO_SYNC_EVENT[sectionKey];
          if (syncType) {
            const msg: SyncMessage = {
              id: `cloud_${sectionKey}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              classId,
              type: syncType,
              data,
              senderUsername: 'remote_servant',
              senderName: senderName || 'Servant',
              clientId: 'cloud_firestore',
              timestamp: Date.now(),
            };
            this.handleIncomingMessage(msg);
          }
        }
      );

      // 2. Subscribe to global users (so new accounts & password changes propagate)
      this.unsubCloudUsers = await cloudSync.subscribeToGlobal('users', (usersData: unknown) => {
        const msg: SyncMessage = {
          id: `cloud_users_${Date.now()}`,
          classId: 'global',
          type: 'USERS_UPDATED',
          data: usersData,
          senderUsername: 'cloud_sync',
          senderName: 'Cloud Sync',
          clientId: 'cloud_firestore',
          timestamp: Date.now(),
        };
        this.handleIncomingMessage(msg);
      });

      // 3. Subscribe to global classes
      this.unsubCloudClasses = await cloudSync.subscribeToGlobal('classes', (classesData: unknown) => {
        const msg: SyncMessage = {
          id: `cloud_classes_${Date.now()}`,
          classId: 'global',
          type: 'CLASSES_UPDATED',
          data: classesData,
          senderUsername: 'cloud_sync',
          senderName: 'Cloud Sync',
          clientId: 'cloud_firestore',
          timestamp: Date.now(),
        };
        this.handleIncomingMessage(msg);
      });

      this.updateStatus('connected');
    } catch (err) {
      console.warn('Failed to attach Cloud Firestore listeners:', err);
    }
  }

  /**
   * Updates the current servant user profile for outgoing updates
   */
  setCurrentUser(user: { username: string; name: string } | null) {
    this.currentUser = user;
    if (user) {
      cloudSync.setServant(user.username, user.name);
    }
  }

  getActiveClassId(): string {
    return this.activeClassId;
  }

  getStatus(): SyncConnectionStatus {
    if (cloudSync.isConfigured() && cloudSync.getStatus().status === 'connected') {
      return 'connected';
    }
    return this.status;
  }

  isCloudConfigured(): boolean {
    return cloudSync.isConfigured();
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
   * Connects to Server-Sent Events (SSE) endpoint if local Vite server is running
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

    try {
      const sseUrl = getApiUrl(
        `/api/sync/events?classId=${encodeURIComponent(this.activeClassId)}&clientId=${encodeURIComponent(this.clientId)}`
      );
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
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        // Only mark offline if cloud is not connected
        if (!cloudSync.isConfigured() || cloudSync.getStatus().status !== 'connected') {
          this.updateStatus('offline');
        }

        // Auto-reconnect SSE after 5 seconds
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connectSSE();
        }, 5000);
      };
    } catch {
      // Safe fallback
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
    if (
      msg.classId &&
      msg.classId !== this.activeClassId &&
      msg.type !== 'CLASSES_UPDATED' &&
      msg.type !== 'USERS_UPDATED'
    ) {
      return;
    }

    // Deduplicate packets received over multiple channels (Firestore + SSE + BroadcastChannel)
    if (this.recentMessageIds.has(msg.id)) return;
    this.recentMessageIds.add(msg.id);
    if (this.recentMessageIds.size > 200) {
      const it = this.recentMessageIds.values();
      this.recentMessageIds.delete(it.next().value as string);
    }

    this.lastSyncTime = Date.now();

    // Dispatch to all component subscribers (App.tsx, etc.)
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
   * Sends locally, via network SSE, and pushes directly to Firebase Cloud Firestore!
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

    // 3. Network SSE/HTTP broadcast (if running Vite server)
    if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
      fetch(getApiUrl('/api/sync/publish'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': this.clientId,
        },
        body: JSON.stringify(msg),
      }).catch(() => {
        // Safe fallback if static hosting
      });
    }

    // 4. Google Cloud Firestore Realtime Sync (across all devices & networks!)
    if (cloudSync.isConfigured()) {
      try {
        if (params.type === 'CLASSES_UPDATED') {
          await cloudSync.saveGlobal('classes', params.data);
        } else if (params.type === 'USERS_UPDATED') {
          await cloudSync.saveGlobal('users', params.data);
        } else {
          const sectionKey = SYNC_EVENT_TO_SECTION[params.type];
          if (sectionKey) {
            await cloudSync.saveClassSection(classId, sectionKey, params.data);
          }
        }
      } catch (cloudErr) {
        console.warn('Cloud sync write warning:', cloudErr);
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
    listener(this.getStatus(), this.connectedServantsCount);
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

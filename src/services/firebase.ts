// Firebase Cloud Realtime Synchronization Engine
// Connects Sunday School classes across all servants' devices (phones, tablets, PCs)
// Provides instant cross-device data propagation via Firestore or Realtime Database with offline caching

import { FIREBASE_CONFIG, type FirebaseConfig } from '../config/firebase';

export { type FirebaseConfig };
export type CloudSyncStatus = 'connected' | 'connecting' | 'error' | 'not_configured';
export type CloudBackendType = 'firestore' | 'rtdb' | 'none';

type DataChangeListener = (key: string, data: unknown, senderName?: string) => void;
type GlobalChangeListener = (data: unknown) => void;
type StatusListener = (status: CloudSyncStatus, details?: string) => void;

const FIREBASE_CONFIG_STORAGE_KEY = 'pss_firebase_config_v1';

// Canonical section mapping between local storage keys and clean cloud document names
export const CANONICAL_SECTION_MAP: Record<string, string> = {
  pss_students_v3: 'students',
  students: 'students',
  pss_attendance_v2: 'attendance',
  attendance: 'attendance',
  pss_dars_ktab_v2: 'darsKtab',
  darsKtab: 'darsKtab',
  pss_mal3ab_v2: 'mal3ab',
  mal3ab: 'mal3ab',
  pss_summer_club_v2: 'summerClub',
  summerClub: 'summerClub',
  pss_summer_club_settings_v1: 'summerClubSettings',
  summerClubSettings: 'summerClubSettings',
  pss_confessions_v2: 'confessions',
  confessions: 'confessions',
  pss_custom_events_v2: 'customEvents',
  customEvents: 'customEvents',
  pss_visits_v2: 'visits',
  visits: 'visits',
  pss_point_settings_v1: 'pointSettings',
  pointSettings: 'pointSettings',
  pss_custom_points_v2: 'customPoints',
  customPoints: 'customPoints',
  pss_class_heroes_v2: 'classHeroes',
  classHeroes: 'classHeroes',
  pss_audit_logs_v2: 'auditLogs',
  auditLogs: 'auditLogs',
};

export function normalizeSectionKey(key: string): string {
  return CANONICAL_SECTION_MAP[key] || key;
}

export interface CloudDiagnosticInfo {
  status: CloudSyncStatus;
  message: string;
  backendType: CloudBackendType;
  projectId: string;
  databaseURL?: string;
  clientId: string;
  currentUser: string;
  lastSyncTime: number | null;
  errorDetails?: string;
  fixUrl?: string;
}

class FirebaseService {
  private config: FirebaseConfig | null = null;
  private app: any = null;
  private firestoreDb: any = null;
  private rtdbInstance: any = null;
  private backendType: CloudBackendType = 'none';
  private status: CloudSyncStatus = 'not_configured';
  private statusMessage = '';
  private statusListeners = new Set<StatusListener>();
  private activeSubscriptions = new Map<string, () => void>();
  private globalSubscriptions = new Map<string, () => void>();
  private isInitializing = false;
  private currentServantName = 'Servant';
  private currentUsername = 'servant';
  private clientId = '';
  private lastSyncTime: number | null = null;
  private lastErrorDetails = '';
  private fixUrl = '';

  constructor() {
    this.loadSavedConfig();
  }

  setServant(username: string, name: string) {
    this.currentUsername = username;
    this.currentServantName = name;
  }

  setClientId(id: string) {
    this.clientId = id;
  }

  getClientId(): string {
    return this.clientId;
  }

  getSavedConfig(): FirebaseConfig | null {
    return this.config;
  }

  isConfigured(): boolean {
    return Boolean(this.config?.projectId && this.config?.apiKey);
  }

  getAppInstance(): any {
    return this.app;
  }

  getBackendType(): CloudBackendType {
    return this.backendType;
  }

  getStatus(): { status: CloudSyncStatus; message: string; backendType: CloudBackendType } {
    return { status: this.status, message: this.statusMessage, backendType: this.backendType };
  }

  getDiagnosticInfo(): CloudDiagnosticInfo {
    return {
      status: this.status,
      message: this.statusMessage,
      backendType: this.backendType,
      projectId: this.config?.projectId || '',
      databaseURL: this.config?.databaseURL,
      clientId: this.clientId,
      currentUser: `${this.currentServantName} (${this.currentUsername})`,
      lastSyncTime: this.lastSyncTime,
      errorDetails: this.lastErrorDetails,
      fixUrl: this.fixUrl,
    };
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status, this.statusMessage);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private updateStatus(status: CloudSyncStatus, message = '', errorDetails = '', fixUrl = '') {
    this.status = status;
    this.statusMessage = message;
    if (errorDetails) this.lastErrorDetails = errorDetails;
    if (fixUrl) this.fixUrl = fixUrl;

    this.statusListeners.forEach((l) => {
      try {
        l(status, message);
      } catch (err) {
        console.warn('Error in cloud status listener:', err);
      }
    });
  }

  private loadSavedConfig() {
    // 1. Direct configuration in src/config/firebase.ts (Primary & Recommended)
    if (FIREBASE_CONFIG && FIREBASE_CONFIG.projectId?.trim() && FIREBASE_CONFIG.apiKey?.trim()) {
      this.config = {
        apiKey: FIREBASE_CONFIG.apiKey.trim(),
        authDomain: FIREBASE_CONFIG.authDomain?.trim() || `${FIREBASE_CONFIG.projectId.trim()}.firebaseapp.com`,
        projectId: FIREBASE_CONFIG.projectId.trim(),
        storageBucket: FIREBASE_CONFIG.storageBucket?.trim() || `${FIREBASE_CONFIG.projectId.trim()}.appspot.com`,
        messagingSenderId: FIREBASE_CONFIG.messagingSenderId?.trim() || '',
        appId: FIREBASE_CONFIG.appId?.trim() || '',
        measurementId: FIREBASE_CONFIG.measurementId?.trim() || '',
        databaseURL: FIREBASE_CONFIG.databaseURL?.trim(),
      };
      return;
    }

    if (typeof window === 'undefined') return;

    // 2. Try Vite environment variables if available
    try {
      const env = (import.meta as any).env;
      if (env?.VITE_FIREBASE_PROJECT_ID && env?.VITE_FIREBASE_API_KEY) {
        this.config = {
          apiKey: env.VITE_FIREBASE_API_KEY,
          authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
          projectId: env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
          messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
          appId: env.VITE_FIREBASE_APP_ID || '',
          measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
          databaseURL: env.VITE_FIREBASE_DATABASE_URL,
        };
        return;
      }
    } catch {
      // Safe fallback
    }

    // 3. Fallback to localStorage if previously saved
    try {
      const stored = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.projectId && parsed.apiKey) {
          this.config = parsed;
        }
      }
    } catch {
      // Ignore parse error
    }
  }

  async saveConfig(newConfig: FirebaseConfig): Promise<{ success: boolean; message: string }> {
    if (!newConfig.projectId || !newConfig.apiKey) {
      return { success: false, message: 'Both Project ID and API Key are required.' };
    }

    this.disconnect();

    this.config = {
      apiKey: newConfig.apiKey.trim(),
      authDomain: newConfig.authDomain?.trim() || `${newConfig.projectId.trim()}.firebaseapp.com`,
      projectId: newConfig.projectId.trim(),
      storageBucket: newConfig.storageBucket?.trim() || `${newConfig.projectId.trim()}.appspot.com`,
      messagingSenderId: newConfig.messagingSenderId?.trim() || '',
      appId: newConfig.appId?.trim() || '',
      measurementId: newConfig.measurementId?.trim() || '',
      databaseURL: newConfig.databaseURL?.trim(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    }

    return await this.init(true);
  }

  clearConfig() {
    this.disconnect();
    this.config = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
    }
    this.updateStatus('not_configured', 'Cloud database not configured. Operating in local mode.');
  }

  private disconnect() {
    this.activeSubscriptions.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
    this.activeSubscriptions.clear();

    this.globalSubscriptions.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
    this.globalSubscriptions.clear();

    this.app = null;
    this.firestoreDb = null;
    this.rtdbInstance = null;
    this.backendType = 'none';
  }

  /**
   * Initializes Firebase using dynamic CDN import.
   * Tests Cloud Firestore first, falls back to Realtime Database if configured,
   * and provides actionable diagnostics if neither is enabled in the Firebase Console.
   */
  async init(forceRefresh = false): Promise<{ success: boolean; message: string; backend: CloudBackendType }> {
    if (!this.config || !this.config.projectId) {
      this.updateStatus('not_configured', 'Firebase config missing');
      return { success: false, message: 'Firebase configuration is missing', backend: 'none' };
    }

    if (!forceRefresh && (this.firestoreDb || this.rtdbInstance) && this.backendType !== 'none') {
      return { success: true, message: `Connected to Firebase (${this.backendType})`, backend: this.backendType };
    }

    if (this.isInitializing) {
      return { success: true, message: 'Connecting...', backend: this.backendType };
    }

    this.isInitializing = true;
    this.updateStatus('connecting', 'Connecting to Google Firebase Cloud...');

    try {
      // Dynamic import of Firebase App from Google CDN
      // @ts-ignore
      const firebaseApp = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');

      const appName = `pss_${this.config.projectId}`;
      let app;
      try {
        app = firebaseApp.getApp(appName);
      } catch {
        app = firebaseApp.initializeApp(this.config, appName);
      }
      this.app = app;

      // Strategy 1: Attempt Cloud Firestore
      let firestoreError: any = null;
      try {
        // @ts-ignore
        const firestore = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const db = firestore.getFirestore(app);
        this.firestoreDb = db;

        // Fast probe to verify Firestore is enabled and rules allow read
        const probeDoc = firestore.doc(db, 'system', 'ping');
        await firestore.getDoc(probeDoc);

        this.backendType = 'firestore';
        this.isInitializing = false;
        this.lastSyncTime = Date.now();
        this.updateStatus('connected', 'Live Cloud Sync Active (Cloud Firestore)');
        return { success: true, message: 'Connected successfully to Firebase Cloud Firestore!', backend: 'firestore' };
      } catch (err: any) {
        firestoreError = err;
        console.warn('Firestore probe check result:', err?.message || err);
      }

      // Strategy 2: If Firestore fails, check if Realtime Database is configured and accessible
      if (this.config.databaseURL) {
        try {
          // @ts-ignore
          const rtdb = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js');
          const db = rtdb.getDatabase(app, this.config.databaseURL);
          this.rtdbInstance = db;

          // Probe RTDB
          const pingRef = rtdb.ref(db, 'system/ping');
          await rtdb.get(pingRef);

          this.backendType = 'rtdb';
          this.isInitializing = false;
          this.lastSyncTime = Date.now();
          this.updateStatus('connected', 'Live Cloud Sync Active (Realtime Database)');
          return { success: true, message: 'Connected successfully to Firebase Realtime Database!', backend: 'rtdb' };
        } catch (rtdbErr: any) {
          console.warn('Realtime Database probe check result:', rtdbErr?.message || rtdbErr);
        }
      }

      // If we got here, neither database is enabled or accessible in the Firebase Console
      this.isInitializing = false;
      const errMsg = firestoreError?.message || 'Database not initialized';
      const isFirestoreDisabled =
        errMsg.includes('has not been used') ||
        errMsg.includes('disabled') ||
        errMsg.includes('PERMISSION_DENIED') ||
        errMsg.includes('permission-denied');

      const projectId = this.config.projectId;
      const firestoreConsoleUrl = `https://console.firebase.google.com/project/${projectId}/firestore`;

      let userFriendlyMessage = 'Firebase database setup required in Firebase Console.';
      if (isFirestoreDisabled) {
        userFriendlyMessage = `Cloud Firestore is not activated in project "${projectId}". In Firebase Console, go to Firestore Database and click "Create database" in Test Mode.`;
      }

      this.updateStatus('error', userFriendlyMessage, errMsg, firestoreConsoleUrl);
      return { success: false, message: userFriendlyMessage, backend: 'none' };
    } catch (err: any) {
      console.warn('Firebase initialization error:', err);
      this.isInitializing = false;
      const errMsg = err?.message || 'Failed to initialize Firebase.';
      this.updateStatus('error', errMsg, errMsg);
      return { success: false, message: errMsg, backend: 'none' };
    }
  }

  /**
   * Diagnostic connection test run on-demand by the user
   */
  async testConnection(): Promise<{
    success: boolean;
    backend: CloudBackendType;
    message: string;
    details?: string;
    fixUrl?: string;
  }> {
    const res = await this.init(true);
    return {
      success: res.success,
      backend: res.backend,
      message: res.message,
      details: this.lastErrorDetails,
      fixUrl: this.fixUrl,
    };
  }

  /**
   * Save a specific section for a class (e.g. attendance, students)
   * Broadcasts to Cloud Firestore or Realtime Database.
   * Includes sender clientId so that the sending device ignores self-echo,
   * but other devices logged into the SAME user account sync instantly!
   */
  async saveClassSection(classId: string, sectionKey: string, data: unknown, messageId?: string): Promise<void> {
    if (!this.isConfigured()) return;
    const canonicalKey = normalizeSectionKey(sectionKey);

    const payload = {
      data,
      updatedAt: Date.now(),
      updatedBy: this.currentUsername,
      updatedByName: this.currentServantName,
      clientId: this.clientId,
      messageId: messageId || `sync_${canonicalKey}_${Date.now()}`,
    };

    try {
      if (this.backendType === 'firestore' || (!this.rtdbInstance && this.firestoreDb)) {
        // @ts-ignore
        const firestore = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const docRef = firestore.doc(this.firestoreDb, 'classes', classId, 'sections', canonicalKey);
        await firestore.setDoc(docRef, payload);
        this.lastSyncTime = Date.now();
        return;
      }

      if (this.backendType === 'rtdb' && this.rtdbInstance) {
        // @ts-ignore
        const rtdb = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js');
        const ref = rtdb.ref(this.rtdbInstance, `classes/${classId}/sections/${canonicalKey}`);
        await rtdb.set(ref, payload);
        this.lastSyncTime = Date.now();
        return;
      }
    } catch (err: any) {
      console.warn(`Failed to save cloud section [${classId}/${canonicalKey}]:`, err);
    }
  }

  /**
   * Fetch a specific section for a class
   */
  async getClassSection<T>(classId: string, sectionKey: string): Promise<T | null> {
    if (!this.isConfigured()) return null;
    const canonicalKey = normalizeSectionKey(sectionKey);

    try {
      if (this.backendType === 'firestore' || (!this.rtdbInstance && this.firestoreDb)) {
        // @ts-ignore
        const firestore = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        // Try canonical key first
        let docRef = firestore.doc(this.firestoreDb, 'classes', classId, 'sections', canonicalKey);
        let snapshot = await firestore.getDoc(docRef);
        if (snapshot.exists()) {
          const val = snapshot.data();
          this.lastSyncTime = Date.now();
          return (val?.data as T) ?? null;
        }

        // Fallback to raw key if different
        if (canonicalKey !== sectionKey) {
          docRef = firestore.doc(this.firestoreDb, 'classes', classId, 'sections', sectionKey);
          snapshot = await firestore.getDoc(docRef);
          if (snapshot.exists()) {
            const val = snapshot.data();
            this.lastSyncTime = Date.now();
            return (val?.data as T) ?? null;
          }
        }
        return null;
      }

      if (this.backendType === 'rtdb' && this.rtdbInstance) {
        // @ts-ignore
        const rtdb = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js');
        const ref = rtdb.ref(this.rtdbInstance, `classes/${classId}/sections/${canonicalKey}`);
        const snap = await rtdb.get(ref);
        if (snap.exists()) {
          const val = snap.val();
          this.lastSyncTime = Date.now();
          return (val?.data as T) ?? null;
        }
        return null;
      }
    } catch (err) {
      console.warn(`Failed to fetch cloud section [${classId}/${canonicalKey}]:`, err);
    }
    return null;
  }

  /**
   * Save global dataset (e.g. classes, users)
   */
  async saveGlobal(key: 'classes' | 'users', data: unknown): Promise<void> {
    if (!this.isConfigured()) return;
    const payload = {
      data,
      updatedAt: Date.now(),
      updatedBy: this.currentUsername,
      updatedByName: this.currentServantName,
      clientId: this.clientId,
    };

    try {
      if (this.backendType === 'firestore' || (!this.rtdbInstance && this.firestoreDb)) {
        // @ts-ignore
        const firestore = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const docRef = firestore.doc(this.firestoreDb, 'global', key);
        await firestore.setDoc(docRef, payload);
        this.lastSyncTime = Date.now();
        return;
      }

      if (this.backendType === 'rtdb' && this.rtdbInstance) {
        // @ts-ignore
        const rtdb = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js');
        const ref = rtdb.ref(this.rtdbInstance, `global/${key}`);
        await rtdb.set(ref, payload);
        this.lastSyncTime = Date.now();
        return;
      }
    } catch (err) {
      console.warn(`Failed to save global cloud document [${key}]:`, err);
    }
  }

  /**
   * Fetch global dataset (e.g. classes, users)
   */
  async getGlobal<T>(key: 'classes' | 'users'): Promise<T | null> {
    if (!this.isConfigured()) return null;
    try {
      if (this.backendType === 'firestore' || (!this.rtdbInstance && this.firestoreDb)) {
        // @ts-ignore
        const firestore = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const docRef = firestore.doc(this.firestoreDb, 'global', key);
        const snapshot = await firestore.getDoc(docRef);
        if (snapshot.exists()) {
          const val = snapshot.data();
          this.lastSyncTime = Date.now();
          return (val?.data as T) ?? null;
        }
        return null;
      }

      if (this.backendType === 'rtdb' && this.rtdbInstance) {
        // @ts-ignore
        const rtdb = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js');
        const ref = rtdb.ref(this.rtdbInstance, `global/${key}`);
        const snap = await rtdb.get(ref);
        if (snap.exists()) {
          const val = snap.val();
          this.lastSyncTime = Date.now();
          return (val?.data as T) ?? null;
        }
        return null;
      }
    } catch (err) {
      console.warn(`Failed to fetch global cloud document [${key}]:`, err);
    }
    return null;
  }

  /**
   * Subscribes to real-time changes on all sections of a class.
   * CRITICAL FIX: Only ignores updates if dataObj.clientId === this.clientId.
   * Allows real-time sync across devices logged into the SAME user account!
   */
  async subscribeToClass(classId: string, callback: DataChangeListener): Promise<() => void> {
    if (!this.isConfigured()) {
      return () => {};
    }

    // Ensure connection is initialized
    if (this.backendType === 'none') {
      await this.init();
    }

    try {
      if (this.backendType === 'firestore' && this.firestoreDb) {
        // @ts-ignore
        const firestore = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const collRef = firestore.collection(this.firestoreDb, 'classes', classId, 'sections');

        const unsubscribe = firestore.onSnapshot(
          collRef,
          (querySnapshot: any) => {
            querySnapshot.docChanges().forEach((change: any) => {
              if (change.type === 'added' || change.type === 'modified') {
                const docId = change.doc.id;
                const dataObj = change.doc.data();

                // Only ignore if the change was published by THIS exact browser tab
                if (dataObj.clientId && this.clientId && dataObj.clientId === this.clientId) {
                  return;
                }

                this.lastSyncTime = Date.now();
                callback(docId, dataObj.data, dataObj.updatedByName || dataObj.updatedBy);
              }
            });
          },
          (error: any) => {
            console.warn(`Firestore class subscription error for [${classId}]:`, error);
            this.updateStatus(
              'error',
              'Cloud sync interrupted. Check Firebase rules & connection.',
              error?.message
            );
          }
        );

        this.activeSubscriptions.set(classId, unsubscribe);
        return () => {
          unsubscribe();
          this.activeSubscriptions.delete(classId);
        };
      }

      if (this.backendType === 'rtdb' && this.rtdbInstance) {
        // @ts-ignore
        const rtdb = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js');
        const sectionsRef = rtdb.ref(this.rtdbInstance, `classes/${classId}/sections`);

        const handleData = (snapshot: any) => {
          const docId = snapshot.key;
          const dataObj = snapshot.val();
          if (!dataObj) return;

          // Only ignore if the change was published by THIS exact browser tab
          if (dataObj.clientId && this.clientId && dataObj.clientId === this.clientId) {
            return;
          }

          this.lastSyncTime = Date.now();
          callback(docId, dataObj.data, dataObj.updatedByName || dataObj.updatedBy);
        };

        const unsubChanged = rtdb.onChildChanged(sectionsRef, handleData);
        const unsubAdded = rtdb.onChildAdded(sectionsRef, handleData);

        const unsubscribe = () => {
          unsubChanged();
          unsubAdded();
        };

        this.activeSubscriptions.set(classId, unsubscribe);
        return () => {
          unsubscribe();
          this.activeSubscriptions.delete(classId);
        };
      }
    } catch (err: any) {
      console.warn('Failed to start class subscription:', err);
    }
    return () => {};
  }

  /**
   * Subscribes to real-time changes on global data (users or classes)
   */
  async subscribeToGlobal(key: 'classes' | 'users', callback: GlobalChangeListener): Promise<() => void> {
    if (!this.isConfigured()) {
      return () => {};
    }

    if (this.backendType === 'none') {
      await this.init();
    }

    try {
      if (this.backendType === 'firestore' && this.firestoreDb) {
        // @ts-ignore
        const firestore = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const docRef = firestore.doc(this.firestoreDb, 'global', key);

        const unsubscribe = firestore.onSnapshot(
          docRef,
          (snapshot: any) => {
            if (snapshot.exists()) {
              const dataObj = snapshot.data();
              if (dataObj.clientId && this.clientId && dataObj.clientId === this.clientId) {
                return;
              }
              this.lastSyncTime = Date.now();
              callback(dataObj.data);
            }
          },
          (error: any) => {
            console.warn(`Firestore global subscription error for [${key}]:`, error);
          }
        );

        this.globalSubscriptions.set(key, unsubscribe);
        return () => {
          unsubscribe();
          this.globalSubscriptions.delete(key);
        };
      }

      if (this.backendType === 'rtdb' && this.rtdbInstance) {
        // @ts-ignore
        const rtdb = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js');
        const ref = rtdb.ref(this.rtdbInstance, `global/${key}`);

        const unsubscribe = rtdb.onValue(ref, (snapshot: any) => {
          if (snapshot.exists()) {
            const dataObj = snapshot.val();
            if (dataObj.clientId && this.clientId && dataObj.clientId === this.clientId) {
              return;
            }
            this.lastSyncTime = Date.now();
            callback(dataObj.data);
          }
        });

        this.globalSubscriptions.set(key, unsubscribe);
        return () => {
          unsubscribe();
          this.globalSubscriptions.delete(key);
        };
      }
    } catch (err: any) {
      console.warn(`Failed to start global subscription for [${key}]:`, err);
    }
    return () => {};
  }

  /**
   * Upload all local class data and global users/classes to Firebase Cloud in one go
   */
  async uploadLocalDataToCloud(
    classId: string,
    localSnapshot: {
      classes?: unknown[];
      users?: unknown[];
      sections: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; count: number; message: string }> {
    const initRes = await this.init();
    if (!initRes.success) {
      return { success: false, count: 0, message: initRes.message };
    }

    try {
      let count = 0;
      // 1. Upload classes
      if (localSnapshot.classes && localSnapshot.classes.length > 0) {
        await this.saveGlobal('classes', localSnapshot.classes);
        count++;
      }

      // 2. Upload users
      if (localSnapshot.users && localSnapshot.users.length > 0) {
        await this.saveGlobal('users', localSnapshot.users);
        count++;
      }

      // 3. Upload all class sections under canonical keys
      for (const [key, value] of Object.entries(localSnapshot.sections)) {
        if (value !== undefined && value !== null) {
          const canonical = normalizeSectionKey(key);
          await this.saveClassSection(classId, canonical, value);
          count++;
        }
      }

      return {
        success: true,
        count,
        message: `Successfully uploaded ${count} data categories to Firebase Cloud! All other devices (phones, laptops) will now load this data immediately.`,
      };
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        message: err?.message || 'Failed to upload local data to cloud',
      };
    }
  }
}

export const cloudSync = new FirebaseService();

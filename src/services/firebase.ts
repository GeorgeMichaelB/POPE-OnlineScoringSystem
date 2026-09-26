// Firebase Cloud Realtime Synchronization Engine
// Connects Sunday School classes across all servants' devices (phones, tablets, PCs)
// Provides instant cross-device data propagation via Firestore with offline caching

import { FIREBASE_CONFIG, type FirebaseConfig } from '../config/firebase';

export { type FirebaseConfig };
export type CloudSyncStatus = 'connected' | 'connecting' | 'error' | 'not_configured';

type DataChangeListener = (key: string, data: unknown, senderName?: string) => void;
type GlobalChangeListener = (data: unknown) => void;
type StatusListener = (status: CloudSyncStatus, details?: string) => void;

const FIREBASE_CONFIG_STORAGE_KEY = 'pss_firebase_config_v1';

// Dynamic Firebase module loader using official Google CDN
// Avoids heavy local npm installation timeouts and works seamlessly in static deployments (Vercel, Netlify, GitHub Pages)
class FirebaseService {
  private config: FirebaseConfig | null = null;
  private app: any = null;
  private db: any = null;
  private status: CloudSyncStatus = 'not_configured';
  private statusMessage = '';
  private statusListeners = new Set<StatusListener>();
  private activeSubscriptions = new Map<string, () => void>();
  private globalSubscriptions = new Map<string, () => void>();
  private isInitializing = false;
  private currentServantName = 'Servant';
  private currentUsername = 'servant';

  constructor() {
    this.loadSavedConfig();
  }

  setServant(username: string, name: string) {
    this.currentUsername = username;
    this.currentServantName = name;
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

  getStatus(): { status: CloudSyncStatus; message: string } {
    return { status: this.status, message: this.statusMessage };
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status, this.statusMessage);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private updateStatus(status: CloudSyncStatus, message = '') {
    this.status = status;
    this.statusMessage = message;
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

    // Clean up current connections
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

    const test = await this.init();
    if (test.success) {
      this.updateStatus('connected', 'Connected to Firebase Cloud Firestore');
    } else {
      this.updateStatus('error', test.message);
    }
    return test;
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
    this.db = null;
  }

  /**
   * Initializes Firebase using dynamic CDN import
   */
  async init(): Promise<{ success: boolean; message: string }> {
    if (!this.config || !this.config.projectId) {
      this.updateStatus('not_configured', 'Firebase config missing');
      return { success: false, message: 'Firebase configuration is missing' };
    }

    if (this.db) {
      return { success: true, message: 'Already connected' };
    }

    if (this.isInitializing) {
      return { success: true, message: 'Connecting...' };
    }

    this.isInitializing = true;
    this.updateStatus('connecting', 'Connecting to Google Cloud Firestore...');

    try {
      // Dynamic import from Google CDN
      // @ts-ignore
      const firebaseApp = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
      // @ts-ignore
      const firestore = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

      // Initialize or get existing app
      const appName = `pss_${this.config.projectId}`;
      let app;
      try {
        app = firebaseApp.getApp(appName);
      } catch {
        app = firebaseApp.initializeApp(this.config, appName);
      }

      const db = firestore.getFirestore(app);

      this.app = app;
      this.db = db;
      this.updateStatus('connected', 'Live Cloud Sync Active');
      this.isInitializing = false;
      return { success: true, message: 'Connected successfully to Firebase Firestore!' };
    } catch (err: any) {
      console.warn('Firebase CDN initialization error:', err);
      this.isInitializing = false;
      const errMsg = err?.message || 'Failed to connect to Firebase. Check internet and credentials.';
      this.updateStatus('error', errMsg);
      return { success: false, message: errMsg };
    }
  }

  private async getFirestoreModules() {
    if (!this.db) {
      const res = await this.init();
      if (!res.success || !this.db) {
        throw new Error(res.message || 'Firebase not initialized');
      }
    }
    // @ts-ignore
    const firestore = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    return { firestore, db: this.db };
  }

  /**
   * Save a specific section for a class (e.g. attendance, students)
   */
  async saveClassSection(classId: string, sectionKey: string, data: unknown): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      const { firestore, db } = await this.getFirestoreModules();
      const docRef = firestore.doc(db, 'classes', classId, 'sections', sectionKey);
      await firestore.setDoc(docRef, {
        data,
        updatedAt: Date.now(),
        updatedBy: this.currentUsername,
        updatedByName: this.currentServantName,
      });
    } catch (err) {
      console.warn(`Failed to save cloud section [${classId}/${sectionKey}]:`, err);
    }
  }

  /**
   * Fetch a specific section for a class
   */
  async getClassSection<T>(classId: string, sectionKey: string): Promise<T | null> {
    if (!this.isConfigured()) return null;
    try {
      const { firestore, db } = await this.getFirestoreModules();
      const docRef = firestore.doc(db, 'classes', classId, 'sections', sectionKey);
      const snapshot = await firestore.getDoc(docRef);
      if (snapshot.exists()) {
        const val = snapshot.data();
        return (val?.data as T) ?? null;
      }
      return null;
    } catch (err) {
      console.warn(`Failed to fetch cloud section [${classId}/${sectionKey}]:`, err);
      return null;
    }
  }

  /**
   * Save global dataset (e.g. classes, users)
   */
  async saveGlobal(key: 'classes' | 'users', data: unknown): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      const { firestore, db } = await this.getFirestoreModules();
      const docRef = firestore.doc(db, 'global', key);
      await firestore.setDoc(docRef, {
        data,
        updatedAt: Date.now(),
        updatedBy: this.currentUsername,
        updatedByName: this.currentServantName,
      });
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
      const { firestore, db } = await this.getFirestoreModules();
      const docRef = firestore.doc(db, 'global', key);
      const snapshot = await firestore.getDoc(docRef);
      if (snapshot.exists()) {
        const val = snapshot.data();
        return (val?.data as T) ?? null;
      }
      return null;
    } catch (err) {
      console.warn(`Failed to fetch global cloud document [${key}]:`, err);
      return null;
    }
  }

  /**
   * Subscribes to real-time changes on all sections of a class
   */
  async subscribeToClass(
    classId: string,
    callback: DataChangeListener
  ): Promise<() => void> {
    if (!this.isConfigured()) {
      return () => {};
    }

    try {
      const { firestore, db } = await this.getFirestoreModules();
      const collRef = firestore.collection(db, 'classes', classId, 'sections');

      const unsubscribe = firestore.onSnapshot(
        collRef,
        (querySnapshot: any) => {
          querySnapshot.docChanges().forEach((change: any) => {
            if (change.type === 'added' || change.type === 'modified') {
              const docId = change.doc.id; // e.g. "attendance", "students"
              const dataObj = change.doc.data();
              // Skip if this change originated from this exact client tab/user within last 1.5 seconds
              if (
                dataObj.updatedBy === this.currentUsername &&
                Date.now() - (dataObj.updatedAt || 0) < 1500
              ) {
                return;
              }
              callback(docId, dataObj.data, dataObj.updatedByName || dataObj.updatedBy);
            }
          });
        },
        (error: any) => {
          console.warn(`Firestore class subscription error for [${classId}]:`, error);
          this.updateStatus('error', 'Cloud sync interrupted');
        }
      );

      this.activeSubscriptions.set(classId, unsubscribe);
      return () => {
        unsubscribe();
        this.activeSubscriptions.delete(classId);
      };
    } catch (err) {
      console.warn('Failed to start Firestore class subscription:', err);
      return () => {};
    }
  }

  /**
   * Subscribes to real-time changes on global data (users or classes)
   */
  async subscribeToGlobal(
    key: 'classes' | 'users',
    callback: GlobalChangeListener
  ): Promise<() => void> {
    if (!this.isConfigured()) {
      return () => {};
    }

    try {
      const { firestore, db } = await this.getFirestoreModules();
      const docRef = firestore.doc(db, 'global', key);

      const unsubscribe = firestore.onSnapshot(
        docRef,
        (snapshot: any) => {
          if (snapshot.exists()) {
            const dataObj = snapshot.data();
            if (
              dataObj.updatedBy === this.currentUsername &&
              Date.now() - (dataObj.updatedAt || 0) < 1500
            ) {
              return;
            }
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
    } catch (err) {
      console.warn(`Failed to start Firestore global subscription for [${key}]:`, err);
      return () => {};
    }
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

      // 3. Upload all class sections
      for (const [key, value] of Object.entries(localSnapshot.sections)) {
        if (value !== undefined && value !== null) {
          await this.saveClassSection(classId, key, value);
          count++;
        }
      }

      return {
        success: true,
        count,
        message: `Successfully uploaded ${count} data categories to Firebase Cloud! All other devices will now load this data immediately.`,
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

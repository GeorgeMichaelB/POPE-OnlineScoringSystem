// ============================================================================
// FIREBASE CLOUD CONFIGURATION (POPE SAWEROS SUNDAY SCHOOL)
// ============================================================================
// Paste your Firebase Web App configuration below.
// You get this from: Firebase Console -> Project Settings -> General -> Your apps -> Web app
//
// Once you paste your config here, real-time sync will automatically activate
// across all servants' phones, tablets, and laptops on both 4G data and Wi-Fi!
// ============================================================================

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  databaseURL?: string;
}

export const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: 'AIzaSyDeOhx2IsKOohXAMnZjmFQ4X-fkHUr4w3g',
  authDomain: 'pope-saweros-system.firebaseapp.com',
  databaseURL: "https://pope-saweros-system-default-rtdb.firebaseio.com",
  projectId: 'pope-saweros-system',
  storageBucket: 'pope-saweros-system.firebasestorage.app',
  messagingSenderId: '561435710381',
  appId: '1:561435710381:web:77a836197c067a11664724',
  measurementId: "G-5HL5LHY228",
};

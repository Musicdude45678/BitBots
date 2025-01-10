import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Debug information
const debugInfo = {
  apiKeyLength: import.meta.env.VITE_FIREBASE_API_KEY?.length || 0,
  authDomainLength: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.length || 0,
  projectIdLength: import.meta.env.VITE_FIREBASE_PROJECT_ID?.length || 0,
  envKeys: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')),
  buildTime: new Date().toISOString()
};

// Make debug info available globally
(window as any).FIREBASE_DEBUG = debugInfo;

console.log('Firebase Configuration Debug Info:', debugInfo);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log if any config values are missing
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    console.error(`Missing Firebase config value for: ${key}`);
  }
});

let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.error('Firebase config used:', {
    apiKeyPresent: !!firebaseConfig.apiKey,
    authDomainPresent: !!firebaseConfig.authDomain,
    projectIdPresent: !!firebaseConfig.projectId,
    storageBucketPresent: !!firebaseConfig.storageBucket,
    messagingSenderIdPresent: !!firebaseConfig.messagingSenderId,
    appIdPresent: !!firebaseConfig.appId
  });
  throw error;
}

export { auth, db };

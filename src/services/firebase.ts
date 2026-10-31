import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Ignore unfilled values copied from .env.example so the hardcoded fallback still applies.
const env = Object.fromEntries(
  Object.entries(import.meta.env).filter(([, v]) => typeof v === 'string' && !/^your-|change-me|^0+$|:0{6,}/.test(v)),
) as ImportMetaEnv;

// Firebase web config is public by design; access control lives in Firestore rules.
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyD-_E1hcHZ97uWQLypxiWJ6RaBDRyV1eCk',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'osintglobe.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'osintglobe',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'osintglobe.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1088350992202',
  appId: env.VITE_FIREBASE_APP_ID || '1:1088350992202:web:3553feab9b066c19b473b3',
};

export const app = getApps()[0] ?? initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

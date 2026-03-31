import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/** Firebase project configuration pulled from environment variables */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBtbU7NxYqX3W95NxFtzLAwV_IecVsXAk0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'grubed-95935.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'grubed-95935',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'grubed-95935.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '735633430795',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:735633430795:web:d08b031e2ce3639d3fea0e',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-S8PL45JRLH',
};

/**
 * Checks for missing required Firebase config fields.
 * @returns {string[]} Array of missing field messages
 */
export function getFirebaseConfigIssues() {
  const requiredFields = [
    ['apiKey', firebaseConfig.apiKey],
    ['authDomain', firebaseConfig.authDomain],
    ['projectId', firebaseConfig.projectId],
    ['appId', firebaseConfig.appId],
  ];

  return requiredFields
    .filter(([, value]) => !value)
    .map(([field]) => `Missing Firebase field: ${field}`);
}

/** Initialize Firebase app */
const app = initializeApp(firebaseConfig);

/** Firebase Authentication instance */
export const auth = getAuth(app);

/** Firebase Firestore instance */
export const db = getFirestore(app);

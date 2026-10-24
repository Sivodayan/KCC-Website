import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

/**
 * Firebase Client Configuration
 * Populate these in your .env or .env.local file:
 * VITE_FIREBASE_API_KEY=...
 * VITE_FIREBASE_AUTH_DOMAIN=...
 * VITE_FIREBASE_PROJECT_ID=...
 * VITE_FIREBASE_STORAGE_BUCKET=...
 * VITE_FIREBASE_MESSAGING_SENDER_ID=...
 * VITE_FIREBASE_APP_ID=...
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

export const firebaseProjectId = firebaseConfig.projectId || '';

let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
}

export { auth, googleProvider };

/**
 * Sign in using Google OAuth Popup
 */
export async function signInWithGoogle() {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    throw new Error('Firebase credentials are not configured. Please add your VITE_FIREBASE_* keys to .env');
  }
  return await signInWithPopup(auth, googleProvider);
}

/**
 * Sign in using Email and Password
 */
export async function signInWithEmail(email, password) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase credentials are not configured. Please add your VITE_FIREBASE_* keys to .env');
  }
  return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordReset(email) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase credentials are not configured. Please add your VITE_FIREBASE_* keys to .env');
  }
  return await sendPasswordResetEmail(auth, email);
}

/**
 * Sign out from Firebase Auth session
 */
export async function logOutFirebase() {
  if (auth) {
    return await signOut(auth);
  }
}

/**
 * Listen to auth state transitions
 */
export function subscribeToAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}


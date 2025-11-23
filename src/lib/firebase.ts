/**
 * Firebase Configuration and Initialization
 * Using Firebase Modular SDK (v9+)
 *
 * Firebase Realtime Database Structure:
 * =====================================
 *
 * /users/{uid}
 *   - profile: { name, email, photoURL, createdAt }
 *   - credits: number (default: 0)
 *   - subscription: { plan, status, startDate, endDate }
 *
 * /conversations/{conversationId}
 *   - participants: { [uid]: true }
 *   - lastMessage: { text, senderId, createdAt }
 *   - createdAt: timestamp
 *   - updatedAt: timestamp
 *
 * /messages/{conversationId}/{messageId}
 *   - senderId: string (uid)
 *   - text: string
 *   - createdAt: timestamp
 *   - type: 'text' | 'image' | 'file'
 *   - storageRef?: string (for images/files)
 *   - metadata?: { fileName, fileSize, mimeType }
 *
 * /user_status/{uid}
 *   - state: 'online' | 'offline'
 *   - lastChanged: timestamp
 */

import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
} from 'firebase/auth';
import type { Auth, UserCredential } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import type { Database } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize services
export const auth: Auth = getAuth(app);
export const rtdb: Database = getDatabase(app);
export const firestore: Firestore = getFirestore(app);
export const db: Firestore = firestore; // Alias for compatibility

// Auth Functions
export const signUpWithEmailPassword = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithEmailPassword = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  return firebaseSendPasswordResetEmail(auth, email);
};

export default app;

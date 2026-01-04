import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
// Get this from Firebase Console > Project Settings > General > Your apps
// Add a Web app to your Firebase project to get these values
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredConfigKeys.filter((key) => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  console.error(
    '❌ Firebase configuration is missing the following environment variables:\n' +
    missingKeys.map((key) => `  - EXPO_PUBLIC_FIREBASE_${key.toUpperCase().replace(/([A-Z])/g, '_$1')}`).join('\n') +
    '\n\n📝 To fix this:\n' +
    '1. Go to Firebase Console > Project Settings > General\n' +
    '2. Scroll down to "Your apps" and click the Web icon (</>)\n' +
    '3. Register your app and copy the config values\n' +
    '4. Create a .env file in your project root with:\n' +
    '   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key\n' +
    '   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com\n' +
    '   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id\n' +
    '   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com\n' +
    '   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id\n' +
    '   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id\n' +
    '5. Restart your development server'
  );
  
  throw new Error(
    `Firebase configuration is incomplete. Missing: ${missingKeys.join(', ')}. ` +
    'Please set the required EXPO_PUBLIC_FIREBASE_* environment variables. See console for details.'
  );
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Initialize Auth with platform-specific persistence
  // getReactNativePersistence is only available on native platforms, not web
  try {
    if (Platform.OS !== 'web') {
      // React Native (iOS/Android) - use AsyncStorage persistence
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      // Web platform - use default persistence (localStorage)
      auth = getAuth(app);
    }
  } catch (error: any) {
    // If auth is already initialized, get the existing instance
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
  db = getFirestore(app);
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };


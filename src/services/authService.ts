import { COLLECTIONS } from '@/src/constants';
import { User } from '@/src/types';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Complete auth session for Google OAuth
WebBrowser.maybeCompleteAuthSession();

/**
 * Sign up a new user
 */
export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create user document in Firestore
  const userDoc: Omit<User, 'id'> = {
    name,
    email,
    familyId: '',
    role: 'admin',
  };

  await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
    ...userDoc,
    createdAt: serverTimestamp(),
  });

  return user;
}

/**
 * Sign in existing user
 */
export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Get current user from Firestore
 */
export async function getCurrentUserData(uid: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  if (!userDoc.exists()) {
    return null;
  }
  return { id: userDoc.id, ...userDoc.data() } as User;
}

/**
 * Sign in with Google using OAuth 2.0
 * 
 * This uses the authorization code flow with proper handling for Expo
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  // Get the Web Client ID from Firebase project settings
  // This should be the Web Client ID (not iOS/Android client ID)
  // You can find this in Firebase Console > Authentication > Sign-in method > Google > Web SDK configuration
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

  if (!webClientId) {
    throw new Error(
      'Google Web Client ID is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your environment variables. ' +
      'You can find this in Firebase Console > Authentication > Sign-in method > Google > Web SDK configuration'
    );
  }

  // Create the redirect URI - this must match what's registered in Google Cloud Console
  // useProxy uses Expo's proxy server for OAuth
  const redirectUri = AuthSession.makeRedirectUri({
    // @ts-ignore - useProxy is valid but not in types
    useProxy: true, // Uses Expo's proxy: https://auth.expo.io
  });
  
  console.log('🔗 OAuth Redirect URI:', redirectUri);
  console.log('💡 Add this exact URI to Google Cloud Console > Credentials > Authorized redirect URIs');

  // Use the useAuthRequest pattern but create it manually to have more control
  // We'll use the code flow which is more reliable
  // Note: Using only basic scopes that don't require app verification
  const request = new AuthSession.AuthRequest({
    clientId: webClientId,
    scopes: ['openid', 'profile', 'email'], // Basic scopes - no sensitive data
    responseType: AuthSession.ResponseType.Code,
    redirectUri,
    // @ts-ignore - useProxy is valid but not in types
    useProxy: true,
  });

  // Google OAuth discovery endpoints  
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  };

  // Start the OAuth flow
  const result = await request.promptAsync(discovery);

  if (result.type !== 'success') {
    if (result.type === 'cancel') {
      throw new Error('Google Sign-In was cancelled');
    }
    throw new Error(`Google Sign-In failed: ${result.type}`);
  }

  // Get the authorization code from the result
  const { code } = result.params as { code?: string };

  if (!code) {
    throw new Error('Failed to get authorization code from Google');
  }

  // Exchange the authorization code for tokens
  // Note: expo-auth-session automatically includes the code_verifier for PKCE
  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId: webClientId,
      code,
      redirectUri,
      extraParams: {},
    },
    discovery
  );

  // Get the ID token from the token response
  const idToken = tokenResponse.idToken;

  if (!idToken) {
    throw new Error('Failed to get ID token from Google. Response: ' + JSON.stringify(tokenResponse));
  }

  // Create a Google credential with the ID token
  const credential = GoogleAuthProvider.credential(idToken);

  // Sign in to Firebase with the Google credential
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;

  // Check if user document exists, if not create it
  const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // Create user document in Firestore for new Google sign-in users
    const userDocData: Omit<User, 'id'> = {
      name: user.displayName || 'User',
      email: user.email || '',
      familyId: '',
      role: 'admin',
    };

    await setDoc(userDocRef, {
      ...userDocData,
      createdAt: serverTimestamp(),
    });
  }

  return user;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}


# Firebase & Google Sign-In Setup Guide

## Step 1: Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ > **Project Settings**
4. Scroll down to **"Your apps"** section
5. Click the **Web icon** (`</>`) to add a Web app
6. Register your app (you can name it "FamilyHQ Web")
7. Copy the Firebase configuration values

## Step 2: Create Environment File

Create a `.env` file in your project root (`/Users/denniskibet/Desktop/Projects/FamilyHQ/.env`):

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

**Replace all the placeholder values with your actual Firebase config values.**

## Step 3: Enable Firebase Authentication

### Enable Email/Password Authentication:

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Email/Password** (the first option)
3. Toggle **Enable** to ON
4. Leave "Email link (passwordless sign-in)" OFF (unless you want it)
5. Click **Save**

### Enable Google Authentication (Optional):

1. Still in **Authentication** > **Sign-in method**
2. Click on **Google**
3. Toggle **Enable** to ON
4. Copy the **Web client ID** (this is your `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`)
5. Click **Save**

## Step 4: Configure Google OAuth Consent Screen (REQUIRED - Fix "OAuth 2.0 Policy" Error)

**This is critical!** Google requires OAuth apps to be configured properly, even for testing.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** > **OAuth consent screen**

### Configure OAuth Consent Screen:

4. **User Type**: Select **External** (unless you're using Google Workspace)
5. Click **Create**

6. **App Information**:
   - **App name**: `FamilyHQ` (or your app name)
   - **User support email**: Your email
   - **App logo**: (Optional) Upload a logo
   - **App domain**: (Optional) Leave blank for now
   - **Developer contact information**: Your email
   - Click **Save and Continue**

7. **Scopes**:
   - Click **Add or Remove Scopes**
   - Make sure these are selected (they should be by default):
     - `openid` ✅
     - `.../auth/userinfo.email` ✅
     - `.../auth/userinfo.profile` ✅
   - Click **Update** then **Save and Continue**

8. **Test users** (IMPORTANT for development):
   - Click **+ ADD USERS**
   - Add your Google account email (the one you'll use to test)
   - Add any other test user emails
   - Click **Add**
   - Click **Save and Continue**

9. **Summary**: Review and click **Back to Dashboard**

### Configure OAuth Credentials:

10. Navigate to **APIs & Services** > **Credentials**
11. Find your **OAuth 2.0 Client ID** (should be "Web application" type)
12. Click **Edit** (pencil icon)
13. In **Authorized redirect URIs**, add:
    - `https://auth.expo.io/@dekkiskibet/FamilyHQ`
    - (Or check your console for the exact URI when you run the app)
14. **Important**: The redirect URI must match EXACTLY (including `https://` and the full path)
15. Click **Save**

### Finding Your Exact Redirect URI

When you run the app and try Google Sign-In, check your console/terminal. You'll see:
```
🔗 OAuth Redirect URI: https://auth.expo.io/@username/app-slug
```

Copy that EXACT URI and add it to Google Cloud Console.

## Step 5: Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Start in **test mode** (for development)
4. Choose a location close to you
5. Click **Enable**

## Step 5.5: Enable Firebase Storage

1. In Firebase Console, go to **Storage**
2. Click **Get started**
3. Start in **test mode** (for development)
4. Choose a location (should match your Firestore location)
5. Click **Next** then **Done**

## Step 5.6: Set Firebase Storage Security Rules

1. In Firebase Console, go to **Storage** > **Rules**
2. Replace the rules with the contents of `storage.rules` file in your project
3. Or copy these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper function to get user's familyId from Firestore
    function getUserFamilyId() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.familyId;
    }
    
    // Helper function to check if user belongs to a family
    function belongsToFamily(familyId) {
      return request.auth != null && 
        getUserFamilyId() != null && 
        getUserFamilyId() != '' &&
        familyId != null &&
        getUserFamilyId() == familyId;
    }
    
    // Family hero images - allow authenticated users in the family to upload/read/delete
    match /families/{familyId}/hero/{imageId} {
      // Allow read if user belongs to the family
      allow read: if request.auth != null && belongsToFamily(familyId);
      
      // Allow write (upload/delete) if user belongs to the family
      allow write: if request.auth != null && belongsToFamily(familyId) &&
        request.resource.size < 10 * 1024 * 1024 && // 10MB limit
        request.resource.contentType.matches('image/.*');
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click **Publish**

## Step 6: Set Firestore Security Rules

1. In Firebase Console, go to **Firestore Database** > **Rules**
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to get user's familyId (safely handles missing user document and empty strings)
    function getUserFamilyId() {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
      let familyId = userDoc.exists && userDoc.data.familyId != null ? userDoc.data.familyId : null;
      // Return null if familyId is empty string (user hasn't joined a family yet)
      return familyId != null && familyId != '' ? familyId : null;
    }
    
    // Helper function to check if user belongs to a family
    function belongsToFamily(familyId) {
      return request.auth != null && getUserFamilyId() == familyId;
    }
    
    // Helper function to check if user belongs to the family in a document
    // This works for both individual document reads and queries
    function belongsToDocumentFamily() {
      return request.auth != null 
        && getUserFamilyId() != null 
        && resource.data.familyId != null
        && getUserFamilyId() == resource.data.familyId;
    }
    
    // Helper function to check if user can create a document with a specific familyId
    function canCreateForFamily(familyId) {
      return request.auth != null && getUserFamilyId() != null && getUserFamilyId() == familyId;
    }
    
    // Users can read/write their own user document
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false; // Prevent user deletion
    }
    
    // Family data
    match /families/{familyId} {
      // Allow reading families (needed for invite code lookup and joining)
      allow read: if request.auth != null;
      
      // Allow creating a new family (user doesn't have familyId yet)
      allow create: if request.auth != null;
      
      // Allow updating family if user belongs to it
      allow update: if request.auth != null && belongsToFamily(familyId);
      
      // Prevent deletion
      allow delete: if false;
    }
    
    // Shopping lists - subcollection of families
    match /families/{familyId}/shoppingLists/{listId} {
      allow read: if request.auth != null && belongsToFamily(familyId);
      allow create: if request.auth != null && belongsToFamily(familyId);
      allow update, delete: if request.auth != null && belongsToFamily(familyId);
      
      // Shopping items - subcollection of shopping lists
      match /items/{itemId} {
        allow read: if request.auth != null && belongsToFamily(familyId);
        allow create: if request.auth != null && belongsToFamily(familyId);
        allow update, delete: if request.auth != null && belongsToFamily(familyId);
      }
    }
    
    // Direct expenses - subcollection of families
    match /families/{familyId}/directExpenses/{expenseId} {
      allow read: if request.auth != null && belongsToFamily(familyId);
      allow create: if request.auth != null && belongsToFamily(familyId);
      allow update, delete: if request.auth != null && belongsToFamily(familyId);
    }
    
    // Legacy shopping items (for backward compatibility - can be removed if not needed)
    match /shopping/{itemId} {
      allow read: if belongsToDocumentFamily();
      allow create: if canCreateForFamily(request.resource.data.familyId);
      allow update, delete: if belongsToDocumentFamily();
    }
    
    // Budget categories - scoped to family
    match /budgets/{categoryId} {
      allow read: if belongsToDocumentFamily();
      allow create: if canCreateForFamily(request.resource.data.familyId);
      // For update, check both existing and new data to handle transactions
      allow update: if belongsToDocumentFamily() || canCreateForFamily(request.resource.data.familyId);
      allow delete: if belongsToDocumentFamily();
    }
    
    // Tasks - scoped to family
    match /tasks/{taskId} {
      allow read: if belongsToDocumentFamily();
      allow create: if canCreateForFamily(request.resource.data.familyId);
      allow update, delete: if belongsToDocumentFamily();
    }
    
    // Events - scoped to family
    match /events/{eventId} {
      allow read: if belongsToDocumentFamily();
      allow create: if canCreateForFamily(request.resource.data.familyId);
      allow update, delete: if belongsToDocumentFamily();
    }
  }
}
```

## Step 7: Restart Your Development Server

After creating the `.env` file:

```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm start
```

Or if using Expo:

```bash
expo start --clear
```

## Troubleshooting

### "auth/operation-not-allowed" Error

- ✅ **Most Common Fix**: Enable Email/Password authentication in Firebase Console
  1. Go to Firebase Console > Authentication > Sign-in method
  2. Click on **Email/Password**
  3. Toggle **Enable** to ON
  4. Click **Save**
  5. Try signing up again
- ✅ Make sure you're using the correct authentication method name
- ✅ Check that the sign-in provider is enabled in Firebase Console

### "auth/api-key-not-valid" Error

- ✅ Make sure your `.env` file exists in the project root
- ✅ Check that all `EXPO_PUBLIC_FIREBASE_*` variables are set
- ✅ Restart your development server after creating/updating `.env`
- ✅ Verify the API key in Firebase Console matches your `.env` file

### "OAuth 2.0 Policy" / "App Blocked" Error

- ✅ **Most Common Fix**: Add yourself as a test user in OAuth consent screen
  1. Go to Google Cloud Console > APIs & Services > OAuth consent screen
  2. Scroll to "Test users" section
  3. Click "+ ADD USERS"
  4. Add your Google account email
  5. Save and try again
- ✅ Make sure OAuth consent screen is configured (see Step 4 above)
- ✅ App must be in "Testing" mode (not "In production") for development
- ✅ Only test users can sign in until the app is verified by Google

### "Missing or Insufficient Permissions" Error (Firestore)

- ✅ **Most Common Fix**: Update Firestore security rules (see Step 6 above)
  1. Go to Firebase Console > Firestore Database > Rules
  2. Copy the updated rules from Step 6 in this guide
  3. Click **Publish**
  4. Wait a few seconds for rules to update
  5. Try creating a family again
- ✅ Make sure you're authenticated (signed in)
- ✅ Check that Firestore Database is enabled
- ✅ Verify the security rules allow creating families (see Step 6)

### "code_challenge_method" Error

- ✅ Make sure the redirect URI in Google Cloud Console matches EXACTLY
- ✅ The OAuth client must be type "Web application" (not iOS/Android)
- ✅ Check the console output for the exact redirect URI being used
- ✅ Wait a few minutes after updating redirect URIs (Google caches changes)

### Google Sign-In Not Working

- ✅ Verify Google Sign-In is enabled in Firebase Console > Authentication
- ✅ Check that `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set correctly
- ✅ Make sure you're using the "Web client ID" not iOS/Android client ID
- ✅ Verify the redirect URI is added to Google Cloud Console

## Need Help?

If you're still having issues:
1. Check the console/terminal for error messages
2. Verify all environment variables are set correctly
3. Make sure you restarted the development server
4. Check Firebase Console > Authentication > Users to see if sign-ups are working


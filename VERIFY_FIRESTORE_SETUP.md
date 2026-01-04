# Firestore Security Rules Verification Guide

## Step 1: Verify Rules Are Deployed

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. **Check the timestamp** - it should show when rules were last published
5. If the timestamp is old or you're not sure, copy the rules from `firestore.rules` and publish them

## Step 2: Verify Your User Document

1. In Firebase Console, go to **Firestore Database** → **Data**
2. Click on the `users` collection
3. Find your user document (it should have your user ID as the document ID)
4. **Check if it has a `familyId` field:**
   - If **YES**: Note the familyId value
   - If **NO**: You need to create or join a family first

## Step 3: Verify Your Family Document

1. In Firebase Console, go to **Firestore Database** → **Data**
2. Click on the `families` collection
3. Find the family document with the ID that matches your user's `familyId`
4. **Verify it exists** - if it doesn't, you need to create a family

## Step 4: Test the Rules

After updating rules in Firebase Console:

1. **Wait 30-60 seconds** for rules to propagate
2. **Restart your development server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm start
   # or
   expo start --clear
   ```
3. **Sign out and sign back in** to refresh auth state
4. **Check the console** - permission errors should stop

## Common Issues and Fixes

### Issue: "Missing or insufficient permissions" errors persist

**Possible Causes:**
1. Rules not deployed to Firebase Console
2. User document doesn't have `familyId` field
3. Family document doesn't exist
4. Rules haven't propagated yet (wait longer)

**Fix:**
1. Verify rules are published in Firebase Console (Step 1)
2. Verify your user document has `familyId` (Step 2)
3. If `familyId` is missing:
   - Sign out of the app
   - Sign back in
   - Create or join a family
   - This should update your user document with the `familyId`

### Issue: User document doesn't have familyId

**Fix:**
1. In the app, go to Settings or Home page
2. Click "Add Family" or "Create Family"
3. Create a new family or join an existing one using an invite code
4. This should automatically update your user document with the `familyId`

### Issue: Rules seem correct but still getting errors

**Debug Steps:**
1. Check Firebase Console → Firestore Database → Rules
2. Look for any syntax errors (red underlines)
3. Make sure you clicked "Publish" after updating
4. Check the Rules tab timestamp - it should be recent
5. Try signing out and back in
6. Clear app cache and restart

## Quick Test

To quickly test if rules are working:

1. Open Firebase Console → Firestore Database → Data
2. Try to manually read a document (you should see it if rules allow)
3. Check the browser console for any errors

## Still Having Issues?

If you're still getting permission errors after:
- ✅ Rules are published in Firebase Console
- ✅ User document has `familyId` field
- ✅ Family document exists
- ✅ Waited 30-60 seconds after publishing
- ✅ Restarted the app

Then check:
1. Are you signed in with the correct account?
2. Does the `familyId` in your user document match an existing family?
3. Are there any syntax errors in the rules (check Firebase Console)?


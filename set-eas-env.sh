#!/bin/bash
# Script to set EAS environment variables from .env file
# Usage: ./set-eas-env.sh

echo "🔧 Setting EAS Environment Variables..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your Firebase configuration."
    exit 1
fi

# Source the .env file
source .env

# Check if variables are set
if [ -z "$EXPO_PUBLIC_FIREBASE_API_KEY" ]; then
    echo "❌ Error: EXPO_PUBLIC_FIREBASE_API_KEY not found in .env file"
    exit 1
fi

echo "Setting environment variables..."
echo ""

# Set each environment variable for all environments (production, preview, development)
# EXPO_PUBLIC_ variables should use plaintext visibility (they're public by design)
echo "Setting EXPO_PUBLIC_FIREBASE_API_KEY..."
eas env:create --scope project --environment production --environment preview --environment development --name EXPO_PUBLIC_FIREBASE_API_KEY --value "$EXPO_PUBLIC_FIREBASE_API_KEY" --visibility plaintext --non-interactive --force

echo "Setting EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN..."
eas env:create --scope project --environment production --environment preview --environment development --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "$EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN" --visibility plaintext --non-interactive --force

echo "Setting EXPO_PUBLIC_FIREBASE_PROJECT_ID..."
eas env:create --scope project --environment production --environment preview --environment development --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "$EXPO_PUBLIC_FIREBASE_PROJECT_ID" --visibility plaintext --non-interactive --force

echo "Setting EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET..."
eas env:create --scope project --environment production --environment preview --environment development --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "$EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET" --visibility plaintext --non-interactive --force

echo "Setting EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID..."
eas env:create --scope project --environment production --environment preview --environment development --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "$EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" --visibility plaintext --non-interactive --force

echo "Setting EXPO_PUBLIC_FIREBASE_APP_ID..."
eas env:create --scope project --environment production --environment preview --environment development --name EXPO_PUBLIC_FIREBASE_APP_ID --value "$EXPO_PUBLIC_FIREBASE_APP_ID" --visibility plaintext --non-interactive --force

# Google Web Client ID is optional
if [ ! -z "$EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID" ]; then
    echo "Setting EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID..."
    eas env:create --scope project --environment production --environment preview --environment development --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "$EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID" --visibility plaintext --non-interactive --force
    echo "✅ Google Web Client ID set"
else
    echo "⚠️  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID not found in .env (optional)"
fi

echo ""
echo "✅ All environment variables set!"
echo ""
echo "Verifying..."
eas env:list --scope project --environment production 2>/dev/null || echo "Environment variables set (list may require interactive selection)"

echo ""
echo "🎉 Done! You can now rebuild your app:"
echo "   eas build --platform android --profile preview --clear-cache"


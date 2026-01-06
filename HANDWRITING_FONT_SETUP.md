# Handwriting Font Setup Guide

## Current Status
I've set up the shopping card to use handwriting fonts, but we need to add the actual font files.

## Option 1: Manual Download (Recommended)

1. **Download Dancing Script font:**
   - Go to: https://fonts.google.com/specimen/Dancing+Script
   - Click "Download family"
   - Extract the ZIP file

2. **Add fonts to project:**
   - Copy `DancingScript-Regular.ttf` to `assets/fonts/` folder
   - Copy `DancingScript-Bold.ttf` to `assets/fonts/` folder (optional)

3. **Update app.json** (already done):
   ```json
   [
     "expo-font",
     {
       "fonts": [
         "./assets/fonts/DancingScript-Regular.ttf",
         "./assets/fonts/DancingScript-Bold.ttf"
       ]
     }
   ]
   ```

4. **Rebuild the app:**
   ```bash
   eas build --platform android --profile preview --clear-cache
   ```

## Option 2: Use System Fonts (Current)

Currently using:
- iOS: `Chalkduster` (handwriting-style font)
- Android: `cursive` (system cursive font)

If these don't look good, we can switch to a custom font using Option 1.

## Testing

After adding the font files and rebuilding, the shopping list items should display with a handwriting-style font.


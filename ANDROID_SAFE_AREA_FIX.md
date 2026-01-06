# Android Safe Area Fix - Navigation Bar Overlap

## Problem
With `edgeToEdgeEnabled: true` in `app.json`, the app content extends under Android's system navigation bars (back/home buttons), causing UI elements to be covered or positioned incorrectly.

## Solution Applied

### 1. Added SafeAreaProvider to Root Layout
- Wrapped the entire app in `SafeAreaProvider` from `react-native-safe-area-context`
- This enables safe area insets throughout the app

### 2. Updated Tab Bar to Use Safe Area Insets
- Imported `useSafeAreaInsets` hook in tab layout
- Calculated dynamic bottom padding based on device's navigation bar height
- Updated tab bar height and padding to account for Android navigation bar

### Changes Made:

**`app/_layout.tsx`:**
- Added `SafeAreaProvider` wrapper around the entire app
- This provides safe area context to all child components

**`app/(tabs)/_layout.tsx`:**
- Added `useSafeAreaInsets` hook import
- Calculated `bottomPadding` using `Math.max(insets.bottom, 10)` for Android
- Updated `tabBarHeight` to include bottom inset: `72 + insets.bottom` for Android
- Updated `paddingBottom` in `tabBarStyle` to use calculated `bottomPadding`

## How It Works

1. **SafeAreaProvider**: Provides safe area insets to all components
2. **useSafeAreaInsets**: Hook that returns insets for top, bottom, left, right
3. **Dynamic Padding**: Tab bar now adjusts its bottom padding based on the actual navigation bar height
4. **Minimum Padding**: Uses `Math.max(insets.bottom, 10)` to ensure at least 10px padding even if insets are 0

## Testing

After rebuilding the app, verify:
1. ✅ Tab bar icons are not covered by navigation buttons
2. ✅ Tab bar has proper spacing above navigation bar
3. ✅ Content doesn't extend under navigation bar
4. ✅ Works on different Android devices with varying navigation bar heights

## Additional Notes

- The `edgeToEdgeEnabled: true` setting allows the app to use the full screen
- Safe area insets ensure content respects system UI boundaries
- This solution works for both gesture navigation and button navigation on Android
- iOS safe areas are already handled (StatusBar component handles top, tab bar handles bottom)

## If Issues Persist

If content is still being covered:

1. **Check individual screens**: Some screens might need `SafeAreaView` wrapper
2. **Floating elements**: FABs or floating buttons might need manual inset adjustments
3. **Custom components**: Components with absolute positioning may need safe area consideration

## Rebuild Required

After these changes, rebuild the app:
```bash
eas build --platform android --profile preview --clear-cache
```

Or test locally:
```bash
npx expo start
# Then press 'a' for Android emulator
```


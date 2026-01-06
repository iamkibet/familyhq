# Logo Replacement Guide

## Required Image Files

Replace the following image files in `assets/images/` with your new FamilyHQ logo:

### 1. App Icon (`icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Usage**: iOS app icon, general app icon
- **Content**: Your FamilyHQ logo (blue background with black H and orange Q)

### 2. Android Adaptive Icon Foreground (`android-icon-foreground.png`)
- **Size**: 1024x1024 pixels (will be cropped to 432x432 safe area)
- **Format**: PNG with transparency
- **Usage**: Android adaptive icon foreground
- **Content**: Your FamilyHQ logo (centered, with safe padding)
- **Note**: Keep important content within the center 432x432 area

### 3. Android Adaptive Icon Monochrome (`android-icon-monochrome.png`)
- **Size**: 432x432 pixels
- **Format**: PNG with transparency
- **Usage**: Android monochrome icon (for themed icons)
- **Content**: Monochrome version of your logo (single color, typically white or black)

### 4. Splash Screen Logo (`splashscreen_logo.png`)
- **Size**: 1242x2436 pixels (or similar high resolution)
- **Format**: PNG with transparency
- **Usage**: Splash screen when app launches
- **Content**: Your FamilyHQ logo (centered, with safe padding)
- **Note**: Will be displayed on blue background (#0a7ea4)

### 5. Favicon (`favicon.png`)
- **Size**: 48x48 pixels (or 16x16, 32x32, 96x96)
- **Format**: PNG or ICO
- **Usage**: Web browser favicon
- **Content**: Simplified version of your logo

## Current Configuration

The app is configured to use:
- **Splash Background Color**: `#0a7ea4` (blue - matches your logo background)
- **Android Icon Background**: `#E6F4FE` (light blue)
- **Dark Mode Splash Background**: `#1C1B1F` (dark)

## Steps to Replace Logos

1. **Prepare your logo images** in the sizes listed above
2. **Replace the files** in `assets/images/` directory:
   - `icon.png`
   - `android-icon-foreground.png`
   - `android-icon-monochrome.png`
   - `splashscreen_logo.png`
   - `favicon.png`

3. **Verify file paths** in `app.json` (already configured correctly)

4. **Test locally**:
   ```bash
   npx expo start
   ```

5. **Build**:
   ```bash
   eas build --platform android --profile preview
   ```

## Image Requirements Summary

| File | Size | Format | Notes |
|------|------|--------|-------|
| `icon.png` | 1024x1024 | PNG | Main app icon |
| `android-icon-foreground.png` | 1024x1024 | PNG | Keep content in center 432x432 |
| `android-icon-monochrome.png` | 432x432 | PNG | Single color version |
| `splashscreen_logo.png` | 1242x2436 | PNG | High resolution for splash |
| `favicon.png` | 48x48 | PNG | Web favicon |

## Design Notes

Based on your logo description:
- **Background**: Blue (#0a7ea4 or similar)
- **H Letter**: Black, serif typeface
- **Q Letter**: Orange (#FF6B35 or similar), rounded sans-serif
- **Text**: "FamilyHQ" - "Family" in white, "HQ" in orange

Make sure all images maintain the same visual style and branding!



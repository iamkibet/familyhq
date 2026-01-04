import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Request image picker permissions
 */
export async function requestImagePickerPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Pick an image from the device
 */
export async function pickImage(): Promise<string | null> {
  try {
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) {
      throw new Error('Permission to access media library is required');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error: any) {
    throw new Error(`Failed to pick image: ${error.message}`);
  }
}

/**
 * Convert image to base64 string (compressed for Firestore storage)
 * Firestore has a 1MB limit per field, so we compress the image
 */
export async function convertImageToBase64(
  localUri: string
): Promise<string> {
  try {
    // Compress and resize the image to reduce size
    const manipulatedImage = await manipulateAsync(
      localUri,
      [
        { resize: { width: 1200 } }, // Resize to max 1200px width
      ],
      {
        compress: 0.7, // 70% quality
        format: SaveFormat.JPEG,
      }
    );

    // Read the compressed image as base64
    const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Return data URI format
    return `data:image/jpeg;base64,${base64}`;
  } catch (error: any) {
    console.error('Convert image error details:', error);
    throw new Error(`Failed to convert image: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Save image to local file system for caching
 */
export async function saveImageLocally(
  base64Data: string,
  familyId: string
): Promise<string> {
  try {
    // Create a permanent directory for family images
    const familyDir = `${FileSystem.documentDirectory}families/${familyId}/`;
    
    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(familyDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(familyDir, { intermediates: true });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `hero_${timestamp}.jpg`;
    const permanentUri = `${familyDir}${filename}`;

    // Extract base64 data (remove data URI prefix if present)
    const base64String = base64Data.includes(',') 
      ? base64Data.split(',')[1] 
      : base64Data;

    // Write base64 to file
    await FileSystem.writeAsStringAsync(permanentUri, base64String, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return permanentUri;
  } catch (error: any) {
    console.error('Save image error details:', error);
    throw new Error(`Failed to save image: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Delete image from local file system
 */
export async function deleteLocalImage(imageUri: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(imageUri, { idempotent: true });
    }
  } catch (error: any) {
    console.warn('Failed to delete local image:', error);
    // Don't throw - it's okay if we can't delete the old image
  }
}

/**
 * Save hero image for a family (returns base64 data URI for Firestore)
 * Also saves a local cache copy
 */
export async function saveFamilyHeroImage(
  familyId: string,
  localUri: string
): Promise<string> {
  // Convert to base64 for Firestore storage (shared across all devices)
  const base64Data = await convertImageToBase64(localUri);
  
  // Also save locally for faster access
  try {
    await saveImageLocally(base64Data, familyId);
  } catch (error) {
    console.warn('Failed to save local cache, but continuing with base64:', error);
  }
  
  return base64Data;
}

/**
 * Get image URI from base64 data or local file path
 */
export function getImageUri(imageData: string): string {
  // If it's already a data URI or file URI, return as is
  if (imageData.startsWith('data:') || imageData.startsWith('file://') || imageData.startsWith('http://') || imageData.startsWith('https://')) {
    return imageData;
  }
  
  // If it's a local file path, add file:// prefix
  if (imageData.startsWith('/')) {
    return `file://${imageData}`;
  }
  
  // Otherwise assume it's base64 and return as data URI
  if (!imageData.startsWith('data:')) {
    return `data:image/jpeg;base64,${imageData}`;
  }
  
  return imageData;
}

/**
 * Delete hero image for a family from local storage
 */
export async function deleteFamilyHeroImage(familyId: string, imageData: string): Promise<void> {
  try {
    // Check if it's a local file URI
    if (imageData.startsWith('file://') || imageData.startsWith(FileSystem.documentDirectory || '')) {
      await deleteLocalImage(imageData);
    }
    // For base64 data stored in Firestore, we just remove it from Firestore
    // No need to delete local files as they're just cache
  } catch (error: any) {
    console.warn('Failed to delete hero image cache:', error);
    // Don't throw - it's okay if we can't delete the cache
  }
}


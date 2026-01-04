import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Conditionally import notifications - handle Expo Go gracefully
let Notifications: typeof import('expo-notifications') | null = null;

// Only try to import if not in Expo Go
if (Constants.executionEnvironment !== 'storeClient') {
  try {
    // Try to require notifications - will fail in Expo Go for push notifications
    Notifications = require('expo-notifications');
    // Configure how notifications are handled when app is in foreground
    if (Notifications && Notifications.setNotificationHandler) {
      try {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
      } catch (handlerError) {
        // Handler setup may fail in Expo Go - this is expected
      }
    }
  } catch (error) {
    // Notifications may not be fully available in Expo Go
    // This is expected and handled gracefully
    Notifications = null;
  }
}

/**
 * Request notification permissions
 * Note: Push notifications require a development build, not Expo Go
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) {
    console.warn('Notifications not available in this environment');
    return false;
  }
  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: false,
      },
    });
    return status === 'granted';
  } catch (error) {
    console.warn('Notification permissions not available (may require dev build):', error);
    return false;
  }
}

/**
 * Get current notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined' | null> {
  if (!Notifications) {
    return null;
  }
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    console.warn('Could not get notification permissions:', error);
    return null;
  }
}

/**
 * Schedule a local notification
 * Works in Expo Go for local notifications (not push)
 */
export async function scheduleNotification(
  title: string,
  body: string,
  trigger?: any
) {
  if (!Notifications) {
    console.warn('Notifications not available in this environment');
    return;
  }
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: trigger || null, // Show immediately if no trigger
    });
  } catch (error) {
    console.warn('Could not schedule notification (may require dev build):', error);
    throw error;
  }
}


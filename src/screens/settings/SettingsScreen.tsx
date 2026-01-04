import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { useAuthStore } from '@/src/stores/authStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { useCurrencyStore, CURRENCIES } from '@/src/stores/currencyStore';
import { useFamilyMembers } from '@/src/hooks/useFamilyMembers';
import Constants from 'expo-constants';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getNotificationPermissionStatus, requestNotificationPermissions } from '@/src/services/notificationService';
import * as storageService from '@/src/services/storageService';
import * as familyService from '@/src/services/familyService';
import { ActivityIndicator, Image } from 'react-native';

type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export default function SettingsScreen() {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const { userData, family, signOut, createFamily, joinFamily, loadFamilyData, loading: authLoading } = useAuthStore();
  const { colorScheme: themePreference, setColorScheme, initializeTheme } = useThemeStore();
  const { privacySettings, loadPrivacySettings, updatePrivacySettings } = useSettingsStore();
  const { currency, setCurrency, initializeCurrency } = useCurrencyStore();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('undetermined');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [familyModalVisible, setFamilyModalVisible] = useState(false);
  const [familyModalMode, setFamilyModalMode] = useState<'create' | 'join' | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [familyMembersExpanded, setFamilyMembersExpanded] = useState(false);
  const { members: familyMembers, getUserInitials } = useFamilyMembers();

  useEffect(() => {
    initializeTheme();
    initializeCurrency();
    checkNotificationPermission();
    loadPrivacySettings();
  }, []);

  const checkNotificationPermission = async () => {
    try {
      const status = await getNotificationPermissionStatus();
      setNotificationPermission((status as NotificationPermission) || 'undetermined');
    } catch (error) {
      // Handle case where notifications aren't available (e.g., Expo Go)
      console.warn('Notification permissions not available:', error);
      setNotificationPermission('undetermined');
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const granted = await requestNotificationPermissions();
      setShowNotificationModal(false);
      
      if (granted) {
        setNotificationPermission('granted');
        Alert.alert('Success', 'Notifications enabled! You will receive reminders for tasks and events.');
      } else {
        const status = await getNotificationPermissionStatus();
        setNotificationPermission((status as NotificationPermission) || 'denied');
        if (status === 'denied') {
          Alert.alert(
            'Permission Denied',
            'To enable notifications, please go to your device Settings > FamilyHQ > Notifications and enable them.'
          );
        } else {
          Alert.alert(
            'Notifications Unavailable',
            'Push notifications require a development build. This feature is not available in Expo Go. Please build the app using `npx expo run:android` or `npx expo run:ios` to enable notifications.'
          );
        }
      }
    } catch (error: any) {
      console.error('Notification permission error:', error);
      
      // Check if it's the Expo Go limitation
      if (error.message?.includes('expo go') || error.message?.includes('dev build')) {
        Alert.alert(
          'Development Build Required',
          'Push notifications require a development build. Local notifications for reminders will work once you create a development build.\n\nFor now, you can test other features of the app in Expo Go.'
        );
      } else {
        Alert.alert('Error', 'Failed to request notification permission. Please try again.');
      }
    }
  };

  const handleOpenNotificationSettings = () => {
    setShowNotificationModal(true);
  };

  const handleThemeSelect = async (theme: 'light' | 'dark' | 'auto') => {
    await setColorScheme(theme);
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert('Error', 'Please enter a family name');
      return;
    }
    try {
      await createFamily(familyName.trim());
      setFamilyModalVisible(false);
      setFamilyName('');
      setFamilyModalMode(null);
      Alert.alert('Success', 'Family created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create family');
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }
    try {
      await joinFamily(inviteCode.trim().toUpperCase());
      setFamilyModalVisible(false);
      setInviteCode('');
      setFamilyModalMode(null);
      Alert.alert('Success', 'Successfully joined family!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join family');
    }
  };

  const handleUploadHeroImage = async () => {
    if (!family?.id) {
      Alert.alert('Error', 'No family found');
      return;
    }

    try {
      setUploadingHeroImage(true);
      
      // Pick image
      const imageUri = await storageService.pickImage();
      if (!imageUri) {
        setUploadingHeroImage(false);
        return;
      }

      // Delete old image if exists
      if (family.heroImageUrl) {
        await storageService.deleteFamilyHeroImage(family.id, family.heroImageUrl);
      }

      // Save new image to local storage
      const savedImageUri = await storageService.saveFamilyHeroImage(family.id, imageUri);
      
      // Update family document with local URI
      await familyService.updateFamily(family.id, { heroImageUrl: savedImageUri });
      
      // Reload family data to update the UI
      await loadFamilyData();
      
      Alert.alert('Success', 'Hero image uploaded successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload hero image');
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const getNotificationStatusText = () => {
    switch (notificationPermission) {
      case 'granted':
        return 'Enabled';
      case 'denied':
        return 'Disabled';
      default:
        return 'Not Set';
    }
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>{title}</Text>
      <View style={[styles.sectionContent, isDark && styles.sectionContentDark]}>
        {children}
      </View>
    </View>
  );

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
    showArrow = true,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, isDark && styles.settingItemDark]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}>
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
          <IconSymbol name={icon} size={20} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
        </View>
        <View style={styles.settingItemText}>
          <Text style={[styles.settingItemTitle, isDark && styles.settingItemTitleDark]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingItemSubtitle, isDark && styles.settingItemSubtitleDark]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent || (showArrow && onPress && (
        <IconSymbol name="chevron.right" size={16} color={isDark ? '#938F99' : '#79747E'} />
      ))}
    </TouchableOpacity>
  );

  const ThemeOption = ({
    theme,
    label,
    icon,
    isSelected,
    onPress,
  }: {
    theme: 'light' | 'dark' | 'auto';
    label: string;
    icon: string;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        isDark && styles.themeOptionDark,
        isSelected && styles.themeOptionSelected,
        isSelected && isDark && styles.themeOptionSelectedDark,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[
        styles.themeOptionIconContainer,
        isDark && styles.themeOptionIconContainerDark,
        isSelected && styles.themeOptionIconContainerSelected,
      ]}>
        <IconSymbol
          name={icon}
          size={28}
          color={isSelected ? (isDark ? '#4FC3F7' : '#0a7ea4') : (isDark ? '#938F99' : '#79747E')}
        />
      </View>
      <Text style={[
        styles.themeOptionLabel,
        isDark && styles.themeOptionLabelDark,
        isSelected && styles.themeOptionLabelSelected,
      ]}>
        {label}
      </Text>
      {isSelected && (
        <View style={styles.themeOptionCheck}>
          <IconSymbol name="checkmark.circle.fill" size={20} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.contentContainer}>
      {/* Profile & Family Section */}
      <View style={[styles.profileSection, isDark && styles.profileSectionDark]}>
        <View style={styles.profileHeader}>
          <TouchableOpacity
            onPress={family ? handleUploadHeroImage : undefined}
            disabled={!family || uploadingHeroImage}
            activeOpacity={0.8}
            style={styles.avatarContainer}>
            {family?.heroImageUrl ? (
              <Image
                source={{ uri: storageService.getImageUri(family.heroImageUrl) }}
                style={[styles.avatar, styles.avatarImage]}
              />
            ) : (
              <View style={[styles.avatar, isDark && styles.avatarDark]}>
                <Text style={styles.avatarText}>
                  {userData?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            {family && (
              <View style={[styles.avatarEditBadge, isDark && styles.avatarEditBadgeDark]}>
                {uploadingHeroImage ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <IconSymbol name="camera.fill" size={14} color="#FFFFFF" />
                )}
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, isDark && styles.profileNameDark]}>
              {userData?.name || 'User'}
            </Text>
            <Text style={[styles.profileEmail, isDark && styles.profileEmailDark]}>
              {userData?.email || ''}
            </Text>
            {family && (
              <View style={[styles.familyBadge, isDark && styles.familyBadgeDark]}>
                <IconSymbol name="person.2.fill" size={12} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
                <Text style={[styles.familyBadgeText, isDark && styles.familyBadgeTextDark]}>
                  {family.name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Appearance Section */}
      <SettingSection title="Appearance">
        <View style={styles.themeOptionsContainer}>
          <ThemeOption
            theme="light"
            label="Light"
            icon="sun.max.fill"
            isSelected={themePreference === 'light'}
            onPress={() => handleThemeSelect('light')}
          />
          <ThemeOption
            theme="dark"
            label="Dark"
            icon="moon.fill"
            isSelected={themePreference === 'dark'}
            onPress={() => handleThemeSelect('dark')}
          />
          <ThemeOption
            theme="auto"
            label="System"
            icon="gearshape.fill"
            isSelected={themePreference === 'auto'}
            onPress={() => handleThemeSelect('auto')}
          />
        </View>
      </SettingSection>

      {/* Family Section */}
      {family && (
        <SettingSection title="Family">
          <SettingItem
            icon="key.fill"
            title="Invite Code"
            subtitle={family.inviteCode}
            onPress={async () => {
              try {
                await Clipboard.setStringAsync(family.inviteCode);
                Alert.alert('Copied!', 'Invite code copied to clipboard');
              } catch (error) {
                Alert.alert('Error', 'Failed to copy invite code');
              }
            }}
            showArrow={false}
          />
          
          {/* Family Members Accordion */}
          <TouchableOpacity
            style={[styles.settingItem, isDark && styles.settingItemDark]}
            onPress={() => setFamilyMembersExpanded(!familyMembersExpanded)}
            activeOpacity={0.7}>
            <View style={styles.settingItemLeft}>
              <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                <IconSymbol name="person.2.fill" size={20} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
              </View>
              <View style={styles.settingItemText}>
                <Text style={[styles.settingItemTitle, isDark && styles.settingItemTitleDark]}>
                  Family Members
                </Text>
                <Text style={[styles.settingItemSubtitle, isDark && styles.settingItemSubtitleDark]}>
                  {familyMembers.length} {familyMembers.length === 1 ? 'member' : 'members'}
                </Text>
              </View>
            </View>
            <IconSymbol 
              name={familyMembersExpanded ? "chevron.down" : "chevron.right"} 
              size={16} 
              color={isDark ? '#938F99' : '#79747E'} 
            />
          </TouchableOpacity>
          
          {familyMembersExpanded && (
            <View style={[styles.familyMembersList, isDark && styles.familyMembersListDark]}>
              {familyMembers.length === 0 ? (
                <Text style={[styles.emptyMembersText, isDark && styles.emptyMembersTextDark]}>
                  No family members found
                </Text>
              ) : (
                familyMembers.map((member) => (
                  <View
                    key={member.id}
                    style={[styles.memberItem, isDark && styles.memberItemDark]}>
                    <View style={[styles.memberAvatar, isDark && styles.memberAvatarDark]}>
                      <Text style={styles.memberAvatarText}>
                        {getUserInitials(member.id)}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, isDark && styles.memberNameDark]}>
                        {member.name}
                      </Text>
                      <Text style={[styles.memberEmail, isDark && styles.memberEmailDark]}>
                        {member.email}
                      </Text>
                    </View>
                    {member.id === userData?.id && (
                      <View style={[styles.youBadge, isDark && styles.youBadgeDark]}>
                        <Text style={styles.youBadgeText}>You</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </SettingSection>
      )}

      {/* Preferences Section */}
      <SettingSection title="Preferences">
        <SettingItem
          icon="bell.fill"
          title="Notifications"
          subtitle={getNotificationStatusText()}
          onPress={handleOpenNotificationSettings}
        />
        <SettingItem
          icon="dollarsign.circle.fill"
          title="Currency"
          subtitle={`${currency.name} (${currency.symbol})`}
          onPress={() => setShowCurrencyModal(true)}
        />
        <SettingItem
          icon="lock.fill"
          title="Privacy"
          subtitle="Manage privacy settings"
          onPress={() => setShowPrivacyModal(true)}
        />
      </SettingSection>

      {/* About Section */}
      <SettingSection title="About">
        <SettingItem
          icon="info.circle.fill"
          title="App Version"
          subtitle={`${Constants.expoConfig?.version || '1.0.0'}`}
          showArrow={false}
        />
        <SettingItem
          icon="person.fill"
          title="Developed By"
          subtitle="Developed with ❤️ by Kibet from Isolated Solutions"
          showArrow={false}
        />
        <SettingItem
          icon="doc.text.fill"
          title="Terms of Service"
          onPress={() => Alert.alert('Terms', 'Terms of Service coming soon!')}
        />
        <SettingItem
          icon="hand.raised.fill"
          title="Privacy Policy"
          onPress={() => Alert.alert('Privacy Policy', 'Privacy Policy coming soon!')}
        />
      </SettingSection>

      {/* Sign Out */}
      <View style={styles.signOutSection}>
        <TouchableOpacity
          style={[styles.signOutButton, isDark && styles.signOutButtonDark]}
          onPress={handleSignOut}
          activeOpacity={0.7}>
          <IconSymbol name="arrow.right.square.fill" size={20} color="#d32f2f" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, isDark && styles.footerTextDark]}>
          FamilyHQ © {new Date().getFullYear()}
        </Text>
      </View>

      {/* Notification Settings Modal */}
      <Modal
        visible={showNotificationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotificationModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                Notification Settings
              </Text>
              <TouchableOpacity
                onPress={() => setShowNotificationModal(false)}
                style={styles.modalCloseButton}>
                <IconSymbol name="xmark.circle.fill" size={24} color={isDark ? '#938F99' : '#79747E'} />
              </TouchableOpacity>
            </View>

              <View style={styles.modalBody}>
              <Text style={[styles.modalDescription, isDark && styles.modalDescriptionDark]}>
                Enable notifications to receive reminders for tasks, events, and important family updates.
              </Text>
              
              {Constants.appOwnership === 'expo' && (
                <View style={[styles.infoBox, isDark && styles.infoBoxDark]}>
                  <IconSymbol name="info.circle.fill" size={16} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
                  <Text style={[styles.infoBoxText, isDark && styles.infoBoxTextDark]}>
                    Note: Push notifications require a development build. Local notifications for reminders will work in Expo Go.
                  </Text>
                </View>
              )}

              <View style={styles.permissionStatus}>
                <Text style={[styles.permissionStatusLabel, isDark && styles.permissionStatusLabelDark]}>
                  Current Status:
                </Text>
                <View style={[
                  styles.permissionStatusBadge,
                  notificationPermission === 'granted' && styles.permissionStatusBadgeGranted,
                  notificationPermission === 'denied' && styles.permissionStatusBadgeDenied,
                ]}>
                  <Text style={styles.permissionStatusText}>
                    {getNotificationStatusText()}
                  </Text>
                </View>
              </View>

              {notificationPermission !== 'granted' && (
                <TouchableOpacity
                  style={[styles.modalButton, isDark && styles.modalButtonDark]}
                  onPress={handleRequestNotificationPermission}
                  activeOpacity={0.7}>
                  <IconSymbol name="bell.badge.fill" size={20} color="#FFFFFF" />
                  <Text style={styles.modalButtonText}>Enable Notifications</Text>
                </TouchableOpacity>
              )}

              {notificationPermission === 'denied' && (
                <Text style={[styles.modalHint, isDark && styles.modalHintDark]}>
                  If you've previously denied permissions, please enable them in your device Settings.
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Privacy Settings Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                Privacy Settings
              </Text>
              <TouchableOpacity
                onPress={() => setShowPrivacyModal(false)}
                style={styles.modalCloseButton}>
                <IconSymbol name="xmark.circle.fill" size={24} color={isDark ? '#938F99' : '#79747E'} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={[styles.privacyOption, isDark && styles.privacyOptionDark]}
                onPress={() => updatePrivacySettings({ shareData: !privacySettings.shareData })}
                activeOpacity={0.7}>
                <View style={styles.privacyOptionLeft}>
                  <IconSymbol name="person.2.fill" size={20} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
                  <View style={styles.privacyOptionText}>
                    <Text style={[styles.privacyOptionTitle, isDark && styles.privacyOptionTitleDark]}>
                      Share Data with Family
                    </Text>
                    <Text style={[styles.privacyOptionSubtitle, isDark && styles.privacyOptionSubtitleDark]}>
                      Allow family members to see your activity
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.toggle,
                  privacySettings.shareData && styles.toggleActive,
                  isDark && styles.toggleDark,
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    privacySettings.shareData && styles.toggleThumbActive,
                  ]} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.privacyOption, isDark && styles.privacyOptionDark]}
                onPress={() => updatePrivacySettings({ analytics: !privacySettings.analytics })}
                activeOpacity={0.7}>
                <View style={styles.privacyOptionLeft}>
                  <IconSymbol name="chart.bar.fill" size={20} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
                  <View style={styles.privacyOptionText}>
                    <Text style={[styles.privacyOptionTitle, isDark && styles.privacyOptionTitleDark]}>
                      Analytics
                    </Text>
                    <Text style={[styles.privacyOptionSubtitle, isDark && styles.privacyOptionSubtitleDark]}>
                      Help improve the app with usage data
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.toggle,
                  privacySettings.analytics && styles.toggleActive,
                  isDark && styles.toggleDark,
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    privacySettings.analytics && styles.toggleThumbActive,
                  ]} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.privacyOption, isDark && styles.privacyOptionDark]}
                onPress={() => updatePrivacySettings({ crashReports: !privacySettings.crashReports })}
                activeOpacity={0.7}>
                <View style={styles.privacyOptionLeft}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={20} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
                  <View style={styles.privacyOptionText}>
                    <Text style={[styles.privacyOptionTitle, isDark && styles.privacyOptionTitleDark]}>
                      Crash Reports
                    </Text>
                    <Text style={[styles.privacyOptionSubtitle, isDark && styles.privacyOptionSubtitleDark]}>
                      Automatically send crash reports
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.toggle,
                  privacySettings.crashReports && styles.toggleActive,
                  isDark && styles.toggleDark,
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    privacySettings.crashReports && styles.toggleThumbActive,
                  ]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                Select Currency
              </Text>
              <TouchableOpacity
                onPress={() => setShowCurrencyModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <IconSymbol name="xmark.circle.fill" size={24} color={isDark ? '#938F99' : '#79747E'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
              {CURRENCIES.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    styles.currencyItem,
                    isDark && styles.currencyItemDark,
                    currency.code === curr.code && styles.currencyItemSelected,
                    currency.code === curr.code && isDark && styles.currencyItemSelectedDark,
                  ]}
                  onPress={() => {
                    setCurrency(curr);
                    setShowCurrencyModal(false);
                  }}>
                  <View style={styles.currencyItemLeft}>
                    <View style={[styles.currencyIcon, isDark && styles.currencyIconDark]}>
                      <Text style={styles.currencySymbol}>{curr.symbol}</Text>
                    </View>
                    <View style={styles.currencyInfo}>
                      <Text style={[styles.currencyName, isDark && styles.currencyNameDark]}>
                        {curr.name}
                      </Text>
                      <Text style={[styles.currencyCode, isDark && styles.currencyCodeDark]}>
                        {curr.code}
                      </Text>
                    </View>
                  </View>
                  {currency.code === curr.code && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color="#0a7ea4" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Family Modal */}
      <Modal
        visible={familyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setFamilyModalVisible(false);
          setFamilyModalMode(null);
          setFamilyName('');
          setInviteCode('');
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                {family ? 'Family Invite Code' : (familyModalMode === 'create' ? 'Create Family' : familyModalMode === 'join' ? 'Join Family' : 'Add Family')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setFamilyModalVisible(false);
                  setFamilyModalMode(null);
                  setFamilyName('');
                  setInviteCode('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <IconSymbol name="xmark.circle.fill" size={24} color={isDark ? '#938F99' : '#79747E'} />
              </TouchableOpacity>
            </View>

            {family ? (
              // Show invite code if user already has a family
              <View style={styles.inviteCodeContainer}>
                <Text style={[styles.inviteCodeLabel, isDark && styles.inviteCodeLabelDark]}>
                  Share this code with family members to invite them
                </Text>
                <View style={[styles.inviteCodeBox, isDark && styles.inviteCodeBoxDark]}>
                  <Text style={[styles.inviteCodeText, isDark && styles.inviteCodeTextDark]}>
                    {family.inviteCode}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.copyButton, isDark && styles.copyButtonDark]}
                  onPress={async () => {
                    try {
                      await Clipboard.setStringAsync(family.inviteCode);
                      Alert.alert('Copied!', 'Invite code copied to clipboard');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to copy invite code');
                    }
                  }}>
                  <IconSymbol name="doc.on.doc.fill" size={20} color="#FFFFFF" />
                  <Text style={styles.copyButtonText}>Copy Invite Code</Text>
                </TouchableOpacity>
                <Text style={[styles.inviteCodeHint, isDark && styles.inviteCodeHintDark]}>
                  Family members can use this code to join your family
                </Text>
              </View>
            ) : familyModalMode === null ? (
              <View style={styles.familyModeSelection}>
                <TouchableOpacity
                  style={[styles.familyModeButton, isDark && styles.familyModeButtonDark]}
                  onPress={() => setFamilyModalMode('create')}>
                  <IconSymbol name="plus.circle.fill" size={32} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
                  <Text style={[styles.familyModeButtonText, isDark && styles.familyModeButtonTextDark]}>
                    Create Family
                  </Text>
                  <Text style={[styles.familyModeButtonSubtext, isDark && styles.familyModeButtonSubtextDark]}>
                    Start a new family group
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.familyModeButton, isDark && styles.familyModeButtonDark]}
                  onPress={() => setFamilyModalMode('join')}>
                  <IconSymbol name="person.2.fill" size={32} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
                  <Text style={[styles.familyModeButtonText, isDark && styles.familyModeButtonTextDark]}>
                    Join Family
                  </Text>
                  <Text style={[styles.familyModeButtonSubtext, isDark && styles.familyModeButtonSubtextDark]}>
                    Join with an invite code
                  </Text>
                </TouchableOpacity>
              </View>
            ) : familyModalMode === 'create' ? (
              <View style={styles.familyForm}>
                <Text style={[styles.familyFormLabel, isDark && styles.familyFormLabelDark]}>
                  Family Name
                </Text>
                <TextInput
                  style={[styles.familyFormInput, isDark && styles.familyFormInputDark]}
                  placeholder="Enter family name"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={familyName}
                  onChangeText={setFamilyName}
                  autoCapitalize="words"
                  editable={!authLoading}
                />
                <TouchableOpacity
                  style={[styles.familyFormButton, authLoading && styles.familyFormButtonDisabled]}
                  onPress={handleCreateFamily}
                  disabled={authLoading}>
                  <Text style={styles.familyFormButtonText}>
                    {authLoading ? 'Creating...' : 'Create Family'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.familyFormBackButton}
                  onPress={() => setFamilyModalMode(null)}>
                  <Text style={[styles.familyFormBackButtonText, isDark && styles.familyFormBackButtonTextDark]}>
                    Back
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.familyForm}>
                <Text style={[styles.familyFormLabel, isDark && styles.familyFormLabelDark]}>
                  Invite Code
                </Text>
                <TextInput
                  style={[styles.familyFormInput, isDark && styles.familyFormInputDark]}
                  placeholder="Enter invite code"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  editable={!authLoading}
                />
                <TouchableOpacity
                  style={[styles.familyFormButton, authLoading && styles.familyFormButtonDisabled]}
                  onPress={handleJoinFamily}
                  disabled={authLoading}>
                  <Text style={styles.familyFormButtonText}>
                    {authLoading ? 'Joining...' : 'Join Family'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.familyFormBackButton}
                  onPress={() => setFamilyModalMode(null)}>
                  <Text style={[styles.familyFormBackButtonText, isDark && styles.familyFormBackButtonTextDark]}>
                    Back
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#1C1B1F',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  profileSection: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileSectionDark: {
    backgroundColor: '#2C2C2C',
    borderBottomColor: '#3C3C3C',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    backgroundColor: 'transparent',
    resizeMode: 'cover',
  },
  avatarDark: {
    backgroundColor: '#4FC3F7',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarEditBadgeDark: {
    backgroundColor: '#4FC3F7',
    borderColor: '#2C2C2C',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 8,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  profileNameDark: {
    color: '#E6E1E5',
  },
  profileEmail: {
    fontSize: 15,
    color: '#666',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  profileEmailDark: {
    color: '#938F99',
  },
  familyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  familyBadgeDark: {
    backgroundColor: '#1E3A5F',
  },
  familyBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  familyBadgeTextDark: {
    color: '#4FC3F7',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitleDark: {
    color: '#938F99',
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
  },
  sectionContentDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#3C3C3C',
  },
  themeOptionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  themeOptionDark: {
    backgroundColor: '#1E1E1E',
  },
  themeOptionSelected: {
    borderColor: '#0a7ea4',
    backgroundColor: '#E3F2FD',
  },
  themeOptionSelectedDark: {
    borderColor: '#4FC3F7',
    backgroundColor: '#1E3A5F',
  },
  themeOptionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  themeOptionIconContainerDark: {
    backgroundColor: '#2C2C2C',
  },
  themeOptionIconContainerSelected: {
    backgroundColor: '#0a7ea4',
  },
  themeOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  themeOptionLabelDark: {
    color: '#938F99',
  },
  themeOptionLabelSelected: {
    color: '#0a7ea4',
    fontWeight: '700',
  },
  themeOptionCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingItemDark: {
    borderBottomColor: '#3C3C3C',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerDark: {
    backgroundColor: '#1E3A5F',
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  settingItemTitleDark: {
    color: '#E6E1E5',
  },
  settingItemSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  settingItemSubtitleDark: {
    color: '#938F99',
  },
  signOutSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEBEE',
  },
  signOutButtonDark: {
    backgroundColor: '#3C1F1F',
    borderColor: '#4C2F2F',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  footerTextDark: {
    color: '#666',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: '#2C2C2C',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
  modalTitleDark: {
    color: '#E6E1E5',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    gap: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalDescriptionDark: {
    color: '#938F99',
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  permissionStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  permissionStatusLabelDark: {
    color: '#E6E1E5',
  },
  permissionStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  permissionStatusBadgeGranted: {
    backgroundColor: '#C8E6C9',
  },
  permissionStatusBadgeDenied: {
    backgroundColor: '#FFCDD2',
  },
  permissionStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
  },
  modalButtonDark: {
    backgroundColor: '#4FC3F7',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalHintDark: {
    color: '#666',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginTop: 8,
  },
  infoBoxDark: {
    backgroundColor: '#1E3A5F',
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#0a7ea4',
    lineHeight: 16,
  },
  infoBoxTextDark: {
    color: '#4FC3F7',
  },
  // Currency Selection
  currencyList: {
    maxHeight: 400,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencyItemDark: {
    backgroundColor: '#2C2C2C',
  },
  currencyItemSelected: {
    borderColor: '#0a7ea4',
    backgroundColor: '#E3F2FD',
  },
  currencyItemSelectedDark: {
    borderColor: '#4FC3F7',
    backgroundColor: '#1E3A5F',
  },
  currencyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  currencyIconDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#3C3C3C',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  currencyNameDark: {
    color: '#FFFFFF',
  },
  currencyCode: {
    fontSize: 13,
    color: '#666',
  },
  currencyCodeDark: {
    color: '#938F99',
  },
  // Privacy Options
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  privacyOptionDark: {
    backgroundColor: '#1E1E1E',
  },
  privacyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  privacyOptionText: {
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  privacyOptionTitleDark: {
    color: '#E6E1E5',
  },
  privacyOptionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  privacyOptionSubtitleDark: {
    color: '#938F99',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    padding: 2,
  },
  toggleDark: {
    backgroundColor: '#3C3C3C',
  },
  toggleActive: {
    backgroundColor: '#0a7ea4',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  familyModeSelection: {
    gap: 16,
    marginTop: 8,
  },
  familyModeButton: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  familyModeButtonDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#3C3C3C',
  },
  familyModeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginTop: 12,
  },
  familyModeButtonTextDark: {
    color: '#E6E1E5',
  },
  familyModeButtonSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  familyModeButtonSubtextDark: {
    color: '#938F99',
  },
  familyForm: {
    marginTop: 8,
  },
  familyFormLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  familyFormLabelDark: {
    color: '#E6E1E5',
  },
  familyFormInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  familyFormInputDark: {
    backgroundColor: '#2C2C2C',
    color: '#E6E1E5',
    borderColor: '#3C3C3C',
  },
  familyFormButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  familyFormButtonDisabled: {
    opacity: 0.6,
  },
  familyFormButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  familyFormBackButton: {
    padding: 12,
    alignItems: 'center',
  },
  familyFormBackButtonText: {
    fontSize: 16,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  familyFormBackButtonTextDark: {
    color: '#4FC3F7',
  },
  inviteCodeContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  inviteCodeLabelDark: {
    color: '#938F99',
  },
  inviteCodeBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#0a7ea4',
    borderStyle: 'dashed',
    marginBottom: 20,
    minWidth: '100%',
    alignItems: 'center',
  },
  inviteCodeBoxDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#4FC3F7',
  },
  inviteCodeText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: '#0a7ea4',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inviteCodeTextDark: {
    color: '#4FC3F7',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginBottom: 12,
  },
  copyButtonDark: {
    backgroundColor: '#4FC3F7',
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inviteCodeHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inviteCodeHintDark: {
    color: '#666',
  },
  // Family Members Accordion
  familyMembersList: {
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  familyMembersListDark: {
    borderTopColor: '#3C3C3C',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    marginBottom: 8,
  },
  memberItemDark: {
    backgroundColor: '#1E1E1E',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarDark: {
    backgroundColor: '#4FC3F7',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  memberNameDark: {
    color: '#E6E1E5',
  },
  memberEmail: {
    fontSize: 13,
    color: '#666',
  },
  memberEmailDark: {
    color: '#938F99',
  },
  youBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  youBadgeDark: {
    backgroundColor: '#1E3A5F',
  },
  youBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  emptyMembersText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  emptyMembersTextDark: {
    color: '#666',
  },
});


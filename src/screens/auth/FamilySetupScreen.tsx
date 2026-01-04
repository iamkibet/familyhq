import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';

export default function FamilySetupScreen() {
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const createFamily = useAuthStore((state) => state.createFamily);
  const joinFamily = useAuthStore((state) => state.joinFamily);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const router = useRouter();

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert('Error', 'Please enter a family name');
      return;
    }

    try {
      await createFamily(familyName.trim());
      // Navigation will be handled by auth state change
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create family');
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    try {
      await joinFamily(inviteCode.trim().toUpperCase());
      // Navigation will be handled by auth state change
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Invalid invite code');
    }
  };

  if (mode === null) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Set Up Your Family</Text>
          <Text style={styles.subtitle}>Create a new family or join an existing one</Text>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setMode('create')}
            disabled={loading}>
            <Text style={styles.optionButtonText}>Create New Family</Text>
            <Text style={styles.optionButtonSubtext}>Start a new family group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setMode('join')}
            disabled={loading}>
            <Text style={styles.optionButtonText}>Join Existing Family</Text>
            <Text style={styles.optionButtonSubtext}>Enter an invite code</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {mode === 'create' ? 'Create Family' : 'Join Family'}
        </Text>

        <View style={styles.form}>
          {mode === 'create' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Family Name"
                placeholderTextColor="#999"
                value={familyName}
                onChangeText={setFamilyName}
                autoCapitalize="words"
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleCreateFamily}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Family</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Invite Code"
                placeholderTextColor="#999"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleJoinFamily}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Join Family</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMode(null)}
            disabled={loading}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  optionButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  optionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  optionButtonSubtext: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});


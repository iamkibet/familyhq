import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { MealPlanEntry, MealType } from '@/src/types';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { MEAL_TYPE_LABELS } from './MealCell';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface AddMealModalProps {
  visible: boolean;
  /** When editing, pass the existing entry; when adding, pass null */
  editingEntry: MealPlanEntry | null;
  /** Preset date (YYYY-MM-DD) when adding for a specific cell */
  defaultDate: string;
  defaultMealType: MealType;
  onClose: () => void;
  onSave: (data: {
    date: string;
    mealType: MealType;
    title: string;
    description?: string;
    ingredients?: string[];
  }) => Promise<void>;
  onDelete?: (entryId: string) => void;
}

export function AddMealModal({
  visible,
  editingEntry,
  defaultDate,
  defaultMealType,
  onClose,
  onSave,
  onDelete,
}: AddMealModalProps) {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';

  const [date, setDate] = useState(defaultDate);
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDate(editingEntry?.date ?? defaultDate);
      setMealType(editingEntry?.mealType ?? defaultMealType);
      setTitle(editingEntry?.title ?? '');
      setDescription(editingEntry?.description ?? '');
    }
  }, [visible, editingEntry, defaultDate, defaultMealType]);

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Missing title', 'Please enter a meal title.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        date,
        mealType,
        title: trimmed,
        description: description.trim() || undefined,
        // TODO: ingredients for future shopping list integration
      });
      onClose();
    } catch (e) {
      // Store or caller can show error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editingEntry || !onDelete) return;
    Alert.alert(
      'Delete meal',
      `Remove "${editingEntry.title}" from the plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(editingEntry.id) },
      ]
    );
  };

  const bg = isDark ? '#1A1A1E' : '#FFFFFF';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(13,71,161,0.08)';
  const inputBg = isDark ? '#2A2A2E' : '#F0F4F8';
  const textColor = isDark ? '#E6E1E5' : '#1C1B1F';
  const muted = isDark ? '#9BA1A6' : '#64748B';
  const primary = isDark ? '#4FC3F7' : '#0D47A1';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.panel, { backgroundColor: bg, borderColor: border }]}>
          <View style={[styles.header, { borderBottomColor: border }]}>
            <Text style={[styles.title, { color: textColor }]}>
              {editingEntry ? 'Edit meal' : 'Add meal'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={[styles.cancelBtn, { color: muted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: muted }]}>Date</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={muted}
              editable={!editingEntry}
            />

            <Text style={[styles.label, { color: muted }]}>Meal type</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setMealType(type)}
                  style={[
                    styles.mealTypeChip,
                    {
                      borderColor: mealType === type ? primary : border,
                      backgroundColor: mealType === type ? (isDark ? 'rgba(79,195,247,0.15)' : 'rgba(13,71,161,0.08)') : inputBg,
                    },
                  ]}
                  disabled={!!editingEntry}
                >
                  <Text
                    style={[
                      styles.mealTypeChipText,
                      { color: mealType === type ? primary : textColor },
                    ]}
                  >
                    {MEAL_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: muted }]}>Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={[styles.input, styles.inputMultiline, { backgroundColor: inputBg, color: textColor }]}
              placeholder="e.g. Spaghetti Bolognese"
              placeholderTextColor={muted}
              autoCapitalize="words"
            />

            <Text style={[styles.label, { color: muted }]}>Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.inputMultiline, { backgroundColor: inputBg, color: textColor }]}
              placeholder="Notes or recipe link"
              placeholderTextColor={muted}
              multiline
              numberOfLines={2}
            />
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: border }]}>
            {editingEntry && onDelete && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: primary }]}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cancelBtn: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.1,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 48,
  },
  mealTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mealTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  mealTypeChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  deleteBtn: {
    paddingVertical: 12,
  },
  deleteBtnText: {
    fontSize: 16,
    color: '#E53935',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

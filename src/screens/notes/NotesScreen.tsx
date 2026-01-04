import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useNotesStore } from '@/src/stores/notesStore';
import { useAuthStore } from '@/src/stores/authStore';
import { Note } from '@/src/types';
import { formatDate, formatRelativeTime } from '@/src/utils';

export default function NotesScreen() {
  const router = useRouter();
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const { userData } = useAuthStore();
  const { notes, loading, subscribeToNotes, createNote, updateNote, deleteNote } = useNotesStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  useEffect(() => {
    if (userData?.id) {
      const unsubscribe = subscribeToNotes(userData.id);
      return () => unsubscribe();
    }
  }, [userData?.id, subscribeToNotes]);

  const openAddModal = () => {
    setEditingNote(null);
    setFormData({ title: '', content: '' });
    setModalVisible(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      Alert.alert('Error', 'Please enter a title or content');
      return;
    }

    if (!userData?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      if (editingNote) {
        await updateNote(editingNote.id, {
          title: formData.title.trim() || 'Untitled',
          content: formData.content.trim(),
        });
      } else {
        await createNote(
          userData.id,
          formData.title.trim() || 'Untitled',
          formData.content.trim()
        );
      }
      setModalVisible(false);
      setFormData({ title: '', content: '' });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save note');
    }
  };

  const handleDelete = (note: Note) => {
    Alert.alert('Delete Note', `Are you sure you want to delete "${note.title || 'Untitled'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNote(note.id);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete note');
          }
        },
      },
    ]);
  };

  const openDetailsModal = (note: Note) => {
    setSelectedNote(note);
    setDetailsModalVisible(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedNote(null);
  };

  const handleEditFromDetails = () => {
    if (selectedNote) {
      closeDetailsModal();
      openEditModal(selectedNote);
    }
  };

  const handleDeleteFromDetails = () => {
    if (selectedNote) {
      closeDetailsModal();
      handleDelete(selectedNote);
    }
  };

  const renderNote = ({ item }: { item: Note }) => {
    return (
      <TouchableOpacity
        style={[styles.noteCard, isDark && styles.noteCardDark]}
        onPress={() => openDetailsModal(item)}
        activeOpacity={0.7}>
        <View style={styles.noteContent}>
          <Text style={[styles.noteTitle, isDark && styles.noteTitleDark]} numberOfLines={1}>
            {item.title || 'Untitled'}
          </Text>
          {item.content && (
            <Text style={[styles.notePreview, isDark && styles.notePreviewDark]} numberOfLines={2}>
              {item.content}
            </Text>
          )}
        </View>
        <Text style={[styles.noteDate, isDark && styles.noteDateDark]}>
          {formatRelativeTime(item.updatedAt)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconSymbol name="chevron.left" size={20} color={isDark ? '#E6E1E5' : '#111'} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, isDark && styles.titleDark]}>Notes</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>
      </View>

      {loading && notes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#4FC3F7' : '#0a7ea4'} />
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol name="note.text" size={48} color={isDark ? '#666' : '#999'} />
              <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                No notes yet
              </Text>
              <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
                Tap the + button to create your first note
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, isDark && styles.fabDark]}
        onPress={openAddModal}
        activeOpacity={0.8}>
        <IconSymbol name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Note Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeDetailsModal}>
        <TouchableOpacity
          style={styles.detailsModalOverlay}
          activeOpacity={1}
          onPress={closeDetailsModal}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}>
            <View style={[styles.detailsModalContent, isDark && styles.detailsModalContentDark]}>
              {selectedNote && (
                <>
                  <View style={[styles.detailsHeader, isDark && styles.detailsHeaderDark]}>
                    <View style={styles.detailsHeaderContent}>
                      <Text style={[styles.detailsTitle, isDark && styles.detailsTitleDark]}>
                        {selectedNote.title || 'Untitled'}
                      </Text>
                      <Text style={[styles.detailsDate, isDark && styles.detailsDateDark]}>
                        {formatRelativeTime(selectedNote.updatedAt)}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={closeDetailsModal} 
                      style={[styles.closeButton, isDark && styles.closeButtonDark]}
                      activeOpacity={0.7}>
                      <IconSymbol name="xmark" size={18} color={isDark ? '#938F99' : '#666'} />
                    </TouchableOpacity>
                  </View>
                  
                  {selectedNote.content && (
                    <ScrollView style={styles.detailsBody} showsVerticalScrollIndicator={false}>
                      <Text style={[styles.detailsContent, isDark && styles.detailsContentDark]}>
                        {selectedNote.content}
                      </Text>
                    </ScrollView>
                  )}

                  <View style={[styles.detailsActions, isDark && styles.detailsActionsDark]}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={handleEditFromDetails}
                      activeOpacity={0.85}>
                      <IconSymbol name="pencil" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteActionButton]}
                      onPress={handleDeleteFromDetails}
                      activeOpacity={0.85}>
                      <IconSymbol name="trash" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                {editingNote ? 'Edit Note' : 'New Note'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <IconSymbol name="xmark" size={20} color={isDark ? '#938F99' : '#666'} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.titleInput, isDark && styles.titleInputDark]}
              placeholder="Title (optional)"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              autoFocus
            />

            <TextInput
              style={[styles.contentInput, isDark && styles.contentInputDark]}
              placeholder="Write your note here..."
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={formData.content}
              onChangeText={(text) => setFormData({ ...formData, content: text })}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave, isDark && styles.modalButtonSaveDark]}
                onPress={handleSave}>
                <Text style={styles.modalButtonText}>{editingNote ? 'Save' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1C1B1F',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerDark: {
    backgroundColor: '#1C1B1F',
    borderBottomColor: '#3C3C3C',
  },
  backButton: {
    marginBottom: 12,
  },
  headerContent: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
  },
  titleDark: {
    color: '#E6E1E5',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  subtitleDark: {
    color: '#938F99',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
    gap: 12,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  noteCardDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#3C3C3C',
  },
  noteContent: {
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  noteTitleDark: {
    color: '#E6E1E5',
  },
  notePreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  notePreviewDark: {
    color: '#938F99',
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
  },
  noteDateDark: {
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyTextDark: {
    color: '#938F99',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptySubtextDark: {
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fabDark: {
    backgroundColor: '#4FC3F7',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
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
  closeButton: {
    padding: 4,
  },
  titleInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  titleInputDark: {
    backgroundColor: '#3C3C3C',
    borderColor: '#4C4C4C',
    color: '#E6E1E5',
  },
  contentInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111',
    minHeight: 200,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contentInputDark: {
    backgroundColor: '#3C3C3C',
    borderColor: '#4C4C4C',
    color: '#E6E1E5',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonCancelDark: {
    backgroundColor: '#3C3C3C',
  },
  modalButtonSave: {
    backgroundColor: '#0a7ea4',
  },
  modalButtonSaveDark: {
    backgroundColor: '#4FC3F7',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalButtonTextCancel: {
    color: '#666',
  },
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailsModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  detailsModalContentDark: {
    backgroundColor: '#2C2C2C',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailsHeaderDark: {
    borderBottomColor: '#3C3C3C',
  },
  detailsHeaderContent: {
    flex: 1,
    marginRight: 16,
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
    lineHeight: 32,
  },
  detailsTitleDark: {
    color: '#E6E1E5',
  },
  detailsDate: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  detailsDateDark: {
    color: '#938F99',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  closeButtonDark: {
    backgroundColor: '#3C3C3C',
  },
  detailsBody: {
    padding: 24,
    paddingTop: 20,
    maxHeight: 400,
  },
  detailsContent: {
    fontSize: 16,
    fontWeight: '400',
    color: '#333',
    lineHeight: 24,
  },
  detailsContentDark: {
    color: '#E6E1E5',
  },
  detailsActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    justifyContent: 'flex-end',
  },
  detailsActionsDark: {
    borderTopColor: '#3C3C3C',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#0a7ea4',
  },
  deleteActionButton: {
    backgroundColor: '#E53935',
  },
});


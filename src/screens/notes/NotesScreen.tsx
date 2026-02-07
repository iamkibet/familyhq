import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useNotesStore } from '@/src/stores/notesStore';
import { useAuthStore } from '@/src/stores/authStore';
import { Note } from '@/src/types';
import { formatRelativeTime } from '@/src/utils';

const CARD_GAP = 12;
const LIST_PADDING = 16;

function getCardWidth(screenWidth: number) {
  return (screenWidth - LIST_PADDING * 2 - CARD_GAP) / 2;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export default function NotesScreen() {
  const router = useRouter();
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { userData } = useAuthStore();
  const { notes, loading, subscribeToNotes, createNote, updateNote, deleteNote } = useNotesStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const contentInputRef = useRef<TextInput>(null);

  const cardWidth = useMemo(() => getCardWidth(screenWidth), [screenWidth]);
  const noteRows = useMemo(() => chunk(notes, 2), [notes]);

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
    Alert.alert('Delete Note', `Delete "${note.title || 'Untitled'}"?`, [
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

  const insertAtEnd = (suffix: string) => {
    const current = formData.content;
    const newContent = current ? current + suffix : suffix.trimStart();
    setFormData((prev) => ({ ...prev, content: newContent }));
    setTimeout(() => contentInputRef.current?.focus(), 100);
  };

  const addBullet = () => insertAtEnd(formData.content ? '\n• ' : '• ');
  const addCheckbox = () => insertAtEnd(formData.content ? '\n☐ ' : '☐ ');

  const renderNoteCard = (note: Note) => (
    <TouchableOpacity
      key={note.id}
      style={[styles.noteCard, isDark && styles.noteCardDark, { width: cardWidth }]}
      onPress={() => openDetailsModal(note)}
      activeOpacity={0.8}
    >
      {note.title ? (
        <Text
          style={[styles.noteTitle, isDark && styles.noteTitleDark]}
          numberOfLines={1}
        >
          {note.title}
        </Text>
      ) : null}
      {note.content ? (
        <Text
          style={[styles.notePreview, isDark && styles.notePreviewDark]}
          numberOfLines={6}
        >
          {note.content}
        </Text>
      ) : null}
      <Text style={[styles.noteDate, isDark && styles.noteDateDark]}>
        {formatRelativeTime(note.updatedAt)}
      </Text>
    </TouchableOpacity>
  );

  const renderRow = ({ item: row }: { item: Note[] }) => (
    <View style={styles.cardRow}>
      {row.map((note) => renderNoteCard(note))}
      {row.length === 1 ? <View style={{ width: cardWidth }} /> : null}
    </View>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="chevron.left" size={24} color={isDark ? '#E6E1E5' : '#111'} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.screenTitle, isDark && styles.screenTitleDark]}>Notes</Text>
          <Text style={[styles.screenSubtitle, isDark && styles.screenSubtitleDark]}>
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
          data={noteRows}
          renderItem={renderRow}
          keyExtractor={(_, i) => `row-${i}`}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 88 + insets.bottom }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, isDark && styles.emptyIconWrapDark]}>
                <IconSymbol name="note.text" size={48} color={isDark ? '#666' : '#999'} />
              </View>
              <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                No notes yet
              </Text>
              <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
                Tap + to create a note. Add lists, bullets, and more.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[
          styles.fab,
          isDark && styles.fabDark,
          { bottom: 20 + insets.bottom },
        ]}
        onPress={openAddModal}
        activeOpacity={0.9}
      >
        <IconSymbol name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Note Details Modal — Google Keep style */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeDetailsModal}
      >
        <View style={[styles.detailsModalOverlay, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeDetailsModal}
          />
          <View
            style={[
              styles.detailsModalContent,
              isDark && styles.detailsModalContentDark,
              { maxHeight: '90%', minHeight: 320 },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {selectedNote && (
              <>
                <ScrollView
                  style={styles.detailsScrollWrap}
                  contentContainerStyle={styles.detailsScrollContent}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.detailsHeader}>
                    <Text
                      style={[styles.detailsTitle, isDark && styles.detailsTitleDark]}
                    >
                      {selectedNote.title || 'Untitled'}
                    </Text>
                    <Text
                      style={[styles.detailsDate, isDark && styles.detailsDateDark]}
                    >
                      {formatRelativeTime(selectedNote.updatedAt)}
                    </Text>
                  </View>
                  {selectedNote.content ? (
                    <View style={styles.detailsContentBlock}>
                      {selectedNote.content.split('\n').map((line, i) => {
                        const isBullet =
                          /^[•\-*]\s/.test(line) ||
                          /^☐\s/.test(line) ||
                          /^☑\s/.test(line);
                        return (
                          <View
                            key={i}
                            style={[styles.detailsLine, isBullet && styles.detailsLineBullet]}
                          >
                            <Text
                              style={[
                                styles.detailsContent,
                                isDark && styles.detailsContentDark,
                              ]}
                            >
                              {line || ' '}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text
                      style={[styles.detailsContentEmpty, isDark && styles.detailsContentEmptyDark]}
                    >
                      No content
                    </Text>
                  )}
                </ScrollView>
                <View style={[styles.detailsActions, isDark && styles.detailsActionsDark]}>
                  <TouchableOpacity
                    style={[styles.detailsActionBtn, isDark && styles.detailsActionBtnDark]}
                    onPress={handleEditFromDetails}
                    activeOpacity={0.8}
                  >
                    <IconSymbol name="pencil" size={20} color={isDark ? '#E6E1E5' : '#111'} />
                    <Text style={[styles.detailsActionLabel, isDark && styles.detailsActionLabelDark]}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.detailsActionBtn, styles.detailsActionBtnDanger]}
                    onPress={handleDeleteFromDetails}
                    activeOpacity={0.8}
                  >
                    <IconSymbol name="trash" size={20} color="#fff" />
                    <Text style={styles.detailsActionLabelDanger}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.closeButton, isDark && styles.closeButtonDark]}
                    onPress={closeDetailsModal}
                    activeOpacity={0.8}
                  >
                    <IconSymbol name="xmark" size={20} color={isDark ? '#938F99' : '#666'} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add / Edit Note Modal — Google Keep style editor */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.editorModalOverlay, { paddingTop: insets.top }]}
        >
          <View
            style={[
              styles.editorModalContent,
              isDark && styles.editorModalContentDark,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            <View style={styles.editorHeader}>
              <Text style={[styles.editorTitle, isDark && styles.editorTitleDark]}>
                {editingNote ? 'Edit note' : 'New note'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.closeButton, isDark && styles.closeButtonDark]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <IconSymbol name="xmark" size={22} color={isDark ? '#938F99' : '#666'} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.editorScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[styles.titleInput, isDark && styles.titleInputDark]}
                placeholder="Title"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={formData.title}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
                autoFocus
              />

              <TextInput
                ref={contentInputRef}
                style={[styles.contentInput, isDark && styles.contentInputDark]}
                placeholder="Note..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={formData.content}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, content: text }))}
                multiline
                textAlignVertical="top"
                scrollEnabled={false}
              />
            </ScrollView>

            <View style={[styles.editorToolbar, isDark && styles.editorToolbarDark]}>
              <TouchableOpacity
                style={[styles.toolbarBtn, isDark && styles.toolbarBtnDark]}
                onPress={addBullet}
                activeOpacity={0.7}
              >
                <IconSymbol
                  name="list.bullet.rectangle.fill"
                  size={22}
                  color={isDark ? '#B0AEB3' : '#555'}
                />
                <Text style={[styles.toolbarLabel, isDark && styles.toolbarLabelDark]}>
                  Bullet
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolbarBtn, isDark && styles.toolbarBtnDark]}
                onPress={addCheckbox}
                activeOpacity={0.7}
              >
                <Text style={[styles.toolbarCheckboxIcon, isDark && styles.toolbarLabelDark]}>
                  ☐
                </Text>
                <Text style={[styles.toolbarLabel, isDark && styles.toolbarLabelDark]}>
                  Checklist
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.editorButtons}>
              <TouchableOpacity
                style={[styles.editorButton, styles.editorButtonCancel, isDark && styles.editorButtonCancelDark]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.editorButtonTextCancel, isDark && styles.editorButtonTextCancelDark]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editorButton, styles.editorButtonSave, isDark && styles.editorButtonSaveDark]}
                onPress={handleSave}
              >
                <Text style={styles.editorButtonTextSave}>
                  {editingNote ? 'Save' : 'Create'}
                </Text>
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
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#1C1B1F',
  },
  header: {
    paddingHorizontal: LIST_PADDING,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerDark: {
    backgroundColor: '#1C1B1F',
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    marginBottom: 8,
  },
  headerContent: {
    gap: 2,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.5,
  },
  screenTitleDark: {
    color: '#E6E1E5',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  screenSubtitleDark: {
    color: '#938F99',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: LIST_PADDING,
    paddingTop: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  noteCardDark: {
    backgroundColor: '#2C2C2C',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 6,
  },
  noteTitleDark: {
    color: '#E6E1E5',
  },
  notePreview: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    flex: 1,
  },
  notePreviewDark: {
    color: '#B0AEB3',
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  noteDateDark: {
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 280,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconWrapDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#B0AEB3',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtextDark: {
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: LIST_PADDING,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabDark: {
    backgroundColor: '#4FC3F7',
  },
  // —— Details modal ——
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  detailsModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    flex: 1,
  },
  detailsModalContentDark: {
    backgroundColor: '#2C2C2C',
  },
  detailsScrollWrap: {
    flex: 1,
  },
  detailsScrollContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  detailsHeader: {
    padding: 24,
    paddingBottom: 12,
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    lineHeight: 28,
    marginBottom: 8,
  },
  detailsTitleDark: {
    color: '#E6E1E5',
  },
  detailsDate: {
    fontSize: 14,
    color: '#666',
  },
  detailsDateDark: {
    color: '#938F99',
  },
  detailsContentBlock: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  detailsLine: {
    marginBottom: 4,
  },
  detailsLineBullet: {
    paddingLeft: 4,
  },
  detailsContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  detailsContentDark: {
    color: '#E6E1E5',
  },
  detailsContentEmpty: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  detailsContentEmptyDark: {
    color: '#666',
  },
  detailsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  detailsActionsDark: {
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  detailsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  detailsActionBtnDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  detailsActionBtnDanger: {
    backgroundColor: '#E53935',
  },
  detailsActionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  detailsActionLabelDark: {
    color: '#E6E1E5',
  },
  detailsActionLabelDanger: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginLeft: 'auto',
  },
  closeButtonDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  // —— Editor modal ——
  editorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  editorModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '92%',
  },
  editorModalContentDark: {
    backgroundColor: '#2C2C2C',
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  editorTitleDark: {
    color: '#E6E1E5',
  },
  editorScroll: {
    maxHeight: 360,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 8,
    borderBottomWidth: 0,
  },
  titleInputDark: {
    color: '#E6E1E5',
  },
  contentInput: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    paddingVertical: 12,
    paddingHorizontal: 0,
    minHeight: 200,
    borderBottomWidth: 0,
  },
  contentInputDark: {
    color: '#E6E1E5',
  },
  editorToolbar: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  editorToolbarDark: {
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  toolbarBtnDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  toolbarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  toolbarLabelDark: {
    color: '#B0AEB3',
  },
  toolbarCheckboxIcon: {
    fontSize: 18,
    color: '#555',
  },
  editorButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  editorButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editorButtonCancel: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  editorButtonCancelDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  editorButtonSave: {
    backgroundColor: '#0a7ea4',
  },
  editorButtonSaveDark: {
    backgroundColor: '#4FC3F7',
  },
  editorButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  editorButtonTextCancelDark: {
    color: '#B0AEB3',
  },
  editorButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

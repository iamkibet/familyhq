import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useNotesStore } from '@/src/stores/notesStore';

interface NotesCardProps {
  notes: Array<{ id: string; title: string; content: string; updatedAt: any }>;
}

export function NotesCard({ notes }: NotesCardProps) {
  const router = useRouter();
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';

  const recentNotes = notes.slice(0, 3);
  const remainingCount = notes.length - recentNotes.length;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push('/(tabs)/notes')}
        activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
            <IconSymbol name="note.text" size={20} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
          </View>
          <View>
            <Text style={[styles.title, isDark && styles.titleDark]}>Notes</Text>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </Text>
          </View>
        </View>
        <IconSymbol name="chevron.right" size={18} color={isDark ? '#938F99' : '#999'} />
      </TouchableOpacity>

      {notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="note.text" size={32} color={isDark ? '#666' : '#999'} />
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            No notes yet
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          {recentNotes.map((note, index) => (
            <React.Fragment key={note.id}>
              <TouchableOpacity
                style={styles.noteItem}
                onPress={() => router.push('/(tabs)/notes')}
                activeOpacity={0.7}>
                <Text 
                  style={[styles.noteTitle, isDark && styles.noteTitleDark]}
                  numberOfLines={1}>
                  {note.title || 'Untitled'}
                </Text>
                {note.content && (
                  <Text 
                    style={[styles.notePreview, isDark && styles.notePreviewDark]}
                    numberOfLines={1}>
                    {note.content}
                  </Text>
                )}
                <Text style={[styles.noteDate, isDark && styles.noteDateDark]}>
                  {formatDate(note.updatedAt)}
                </Text>
              </TouchableOpacity>
              {index < recentNotes.length - 1 && (
                <View style={[styles.separator, isDark && styles.separatorDark]} />
              )}
            </React.Fragment>
          ))}
          {remainingCount > 0 && (
            <View style={styles.moreContainer}>
              <Text style={[styles.moreText, isDark && styles.moreTextDark]}>
                + {remainingCount} more
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardDark: {
    backgroundColor: '#2C2C2C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerDark: {
    backgroundColor: '#1E3A5F',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.3,
  },
  titleDark: {
    color: '#E6E1E5',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#999',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitleDark: {
    color: '#666',
  },
  content: {
    // Removed flex: 1 to allow content-based height
  },
  emptyContainer: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  emptyTextDark: {
    color: '#666',
  },
  noteItem: {
    paddingVertical: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  noteTitleDark: {
    color: '#E6E1E5',
  },
  notePreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  notePreviewDark: {
    color: '#938F99',
  },
  noteDate: {
    fontSize: 11,
    color: '#999',
  },
  noteDateDark: {
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  separatorDark: {
    backgroundColor: '#3C3C3C',
  },
  moreContainer: {
    paddingTop: 12,
    alignItems: 'center',
  },
  moreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  moreTextDark: {
    color: '#4FC3F7',
  },
});


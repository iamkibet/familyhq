import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useCalendarStore } from '@/src/stores/calendarStore';
import { useAuthStore } from '@/src/stores/authStore';
import { FamilyEvent } from '@/src/types';
import { formatDate, formatDateForInput, isToday, isPast } from '@/src/utils';
import { DatePicker } from '@/src/components/DatePicker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

export default function CalendarScreen() {
  const { userData, family } = useAuthStore();
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const {
    events,
    loading,
    subscribeToEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    clearEvents,
  } = useCalendarStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: formatDateForInput(new Date()),
    description: '',
  });

  useEffect(() => {
    if (family?.id) {
      subscribeToEvents(family.id);
    }

    return () => {
      clearEvents();
    };
  }, [family?.id]);

  const resetForm = () => {
    setFormData({
      title: '',
      date: selectedDate || formatDateForInput(new Date()),
      description: '',
    });
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const openAddModal = (date?: string) => {
    resetForm();
    if (date) {
      setFormData((prev) => ({ ...prev, date }));
      setSelectedDate(date);
    }
    setModalVisible(true);
  };

  const openEditModal = (event: FamilyEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      description: event.description || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    if (!family?.id || !userData) {
      Alert.alert('Error', 'Family not found');
      return;
    }

    try {
      const eventData = {
        title: formData.title.trim(),
        date: formData.date,
        description: formData.description.trim() || undefined,
        createdBy: userData.id,
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
      } else {
        await addEvent(family.id, eventData);
      }

      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save event');
    }
  };

  const handleDelete = (event: FamilyEvent) => {
    Alert.alert('Delete Event', `Are you sure you want to delete "${event.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent(event.id);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete event');
          }
        },
      },
    ]);
  };

  const getEventsForDate = (date: string) => {
    return events.filter((e) => e.date === date);
  };

  const groupEventsByDate = () => {
    const grouped: { [key: string]: FamilyEvent[] } = {};
    events.forEach((event) => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
    return grouped;
  };

  const groupedEvents = groupEventsByDate();
  const sortedDates = Object.keys(groupedEvents).sort();

  const openDetailsModal = (event: FamilyEvent) => {
    setSelectedEvent(event);
    setDetailsModalVisible(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedEvent(null);
  };

  const handleEditFromDetails = () => {
    if (selectedEvent) {
      closeDetailsModal();
      openEditModal(selectedEvent);
    }
  };

  const handleDeleteFromDetails = () => {
    if (selectedEvent) {
      closeDetailsModal();
      handleDelete(selectedEvent);
    }
  };

  const renderEvent = (event: FamilyEvent) => {
    const eventDate = new Date(event.date);
    const isEventToday = isToday(event.date);
    const isEventPast = isPast(event.date);

    return (
      <TouchableOpacity
        style={[
          styles.eventCard,
          isEventToday && styles.eventCardToday,
          isEventPast && styles.eventCardPast,
        ]}
        onPress={() => openDetailsModal(event)}
        onLongPress={() => handleDelete(event)}>
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
          </View>
          {event.description && (
            <Text style={styles.eventDescription}>{event.description}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateSection = (date: string, dateEvents: FamilyEvent[]) => {
    const isDateToday = isToday(date);
    const isDatePast = isPast(date);

    return (
      <View key={date} style={styles.dateSection}>
        <View style={styles.dateHeader}>
          <Text style={[styles.dateText, isDateToday && styles.dateTextToday]}>
            {formatDate(date)}
          </Text>
          <View style={styles.dateHeaderRight}>
            {isDateToday && <Text style={styles.todayBadge}>Today</Text>}
            {isDatePast && !isDateToday && (
              <Text style={styles.pastBadge}>Past</Text>
            )}
            <TouchableOpacity
              style={styles.addEventButton}
              onPress={() => openAddModal(date)}
              activeOpacity={0.7}>
              <IconSymbol name="plus" size={20} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
            </TouchableOpacity>
          </View>
        </View>
        {dateEvents.map((event) => (
          <View key={event.id}>{renderEvent(event)}</View>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No events yet</Text>
      <Text style={styles.emptySubtext}>Tap the + button to add your first event</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Family Calendar</Text>
        <Text style={styles.subtitle}>
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </Text>
      </View>

      {loading && events.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : events.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={sortedDates}
          renderItem={({ item }) => renderDateSection(item, groupedEvents[item])}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, isDark && styles.fabDark]} 
        onPress={() => openAddModal()}
        activeOpacity={0.8}>
        <IconSymbol name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Event Details Modal */}
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
              {selectedEvent && (
                <>
                  <View style={[styles.detailsHeader, isDark && styles.detailsHeaderDark]}>
                    <View style={styles.detailsHeaderContent}>
                      <Text style={[styles.detailsTitle, isDark && styles.detailsTitleDark]}>
                        {selectedEvent.title}
                      </Text>
                      <Text style={[styles.detailsDate, isDark && styles.detailsDateDark]}>
                        {formatDate(selectedEvent.date)}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={closeDetailsModal} 
                      style={[styles.closeButton, isDark && styles.closeButtonDark]}
                      activeOpacity={0.7}>
                      <IconSymbol name="xmark" size={18} color={isDark ? '#938F99' : '#666'} />
                    </TouchableOpacity>
                  </View>
                  
                  {selectedEvent.description && (
                    <View style={styles.detailsBody}>
                      <Text style={[styles.detailsDescription, isDark && styles.detailsDescriptionDark]}>
                        {selectedEvent.description}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.detailsActions, isDark && styles.detailsActionsDark]}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={handleEditFromDetails}
                      activeOpacity={0.85}>
                      <IconSymbol name="pencil" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
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
          style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingEvent ? 'Edit Event' : 'Add Event'}
            </Text>

            <Text style={styles.label}>Event Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Family Dinner"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              autoFocus
            />

            <DatePicker
              label="Date"
              value={formData.date}
              onChange={(date) => setFormData({ ...formData, date })}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add details..."
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  dateTextToday: {
    color: '#0a7ea4',
  },
  todayBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#0a7ea4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pastBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  eventCardToday: {
    borderColor: '#0a7ea4',
    borderWidth: 2,
    backgroundColor: '#f0f8ff',
  },
  eventCardPast: {
    opacity: 0.7,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  eventDate: {
    fontSize: 12,
    color: '#666',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addEventButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabDark: {
    backgroundColor: '#4FC3F7',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#0a7ea4',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  detailsDate: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  detailsTitleDark: {
    color: '#E6E1E5',
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
  },
  detailsDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: '#333',
    lineHeight: 24,
  },
  detailsDescriptionDark: {
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
  deleteButton: {
    backgroundColor: '#E53935',
  },
});


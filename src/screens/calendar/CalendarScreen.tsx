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

export default function CalendarScreen() {
  const { userData, family } = useAuthStore();
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
        onPress={() => openEditModal(event)}
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
          {isDateToday && <Text style={styles.todayBadge}>Today</Text>}
          {isDatePast && !isDateToday && (
            <Text style={styles.pastBadge}>Past</Text>
          )}
        </View>
        {dateEvents.map((event) => (
          <View key={event.id}>{renderEvent(event)}</View>
        ))}
        <TouchableOpacity
          style={styles.addEventButton}
          onPress={() => openAddModal(date)}>
          <Text style={styles.addEventButtonText}>+ Add Event</Text>
        </TouchableOpacity>
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

      <TouchableOpacity style={styles.fab} onPress={() => openAddModal()}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

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

            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              placeholder="YYYY-MM-DD"
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
    marginBottom: 12,
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
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 8,
  },
  addEventButtonText: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
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
});


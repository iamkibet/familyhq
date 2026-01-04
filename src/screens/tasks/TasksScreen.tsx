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
} from 'react-native';
import { useTaskStore } from '@/src/stores/taskStore';
import { useAuthStore } from '@/src/stores/authStore';
import { Task } from '@/src/types';
import { formatDate, formatDateForInput, isPast, isToday } from '@/src/utils';
import { useFamilyMembers } from '@/src/hooks/useFamilyMembers';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TasksScreen() {
  const { userData, family } = useAuthStore();
  const { tasks, loading, subscribeToTasks, addTask, updateTask, deleteTask, toggleCompleted, clearTasks } =
    useTaskStore();
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const { members: familyMembers, getUserName, getUserInitials } = useFamilyMembers();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    assignedTo: '',
    dueDate: formatDateForInput(new Date()),
  });

  useEffect(() => {
    if (family?.id) {
      subscribeToTasks(family.id);
    }

    return () => {
      clearTasks();
    };
  }, [family?.id]);

  // Set default assigned to current user when family members are loaded
  useEffect(() => {
    if (userData && familyMembers.length > 0 && !formData.assignedTo) {
      setFormData((prev) => ({ ...prev, assignedTo: userData.id }));
    }
  }, [familyMembers, userData]);

  const resetForm = () => {
    setFormData({
      title: '',
      assignedTo: userData?.id || '',
      dueDate: formatDateForInput(new Date()),
    });
    setEditingTask(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!family?.id || !userData) {
      Alert.alert('Error', 'Family not found');
      return;
    }

    try {
      const taskData = {
        title: formData.title.trim(),
        assignedTo: formData.assignedTo,
        dueDate: formData.dueDate,
        completed: editingTask?.completed || false,
        createdBy: userData.id,
      };

      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await addTask(family.id, taskData);
      }

      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save task');
    }
  };

  const handleDelete = (task: Task) => {
    Alert.alert('Delete Task', `Are you sure you want to delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(task.id);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const handleToggleCompleted = async (task: Task) => {
    try {
      await toggleCompleted(task.id, !task.completed);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update task');
    }
  };

  const getAssignedUserName = (userId: string) => {
    const member = familyMembers.find((m) => m.id === userId);
    return member?.name || 'Unassigned';
  };

  const getDueDateStatus = (dueDate: string) => {
    if (isToday(dueDate)) return { text: 'Today', color: '#f57c00' };
    if (isPast(dueDate)) return { text: 'Overdue', color: '#d32f2f' };
    return { text: formatDate(dueDate), color: '#666' };
  };

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const renderItem = ({ item }: { item: Task }) => {
    const dueDateStatus = getDueDateStatus(item.dueDate);
    const assignedName = getAssignedUserName(item.assignedTo);

    return (
      <TouchableOpacity
        style={[styles.taskContainer, item.completed && styles.taskCompleted]}
        onPress={() => handleToggleCompleted(item)}
        onLongPress={() => openEditModal(item)}>
        <View style={styles.taskContent}>
          <View style={styles.checkboxContainer}>
            <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>

          <View style={styles.taskInfo}>
            <View style={styles.taskHeader}>
              <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
                {item.title}
              </Text>
              <View style={[styles.creatorBadge, isDark && styles.creatorBadgeDark]}>
                <View style={[styles.creatorAvatar, isDark && styles.creatorAvatarDark]}>
                  <Text style={styles.creatorInitials}>{getUserInitials(item.createdBy)}</Text>
                </View>
                <Text style={[styles.creatorName, isDark && styles.creatorNameDark]}>
                  {getUserName(item.createdBy)}
                </Text>
              </View>
            </View>
            <View style={styles.taskMeta}>
              <Text style={styles.taskMetaText}>Assigned to: {assignedName}</Text>
              <Text style={[styles.taskMetaText, { color: dueDateStatus.color }]}>
                Due: {dueDateStatus.text}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, data: Task[]) => {
    if (data.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {data.map((item) => (
          <View key={item.id}>{renderItem({ item })}</View>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No tasks yet</Text>
      <Text style={styles.emptySubtext}>Tap the + button to add your first task</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks & Responsibilities</Text>
        <Text style={styles.subtitle}>
          {incompleteTasks.length} active • {completedTasks.length} completed
        </Text>
      </View>

      {loading && tasks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : tasks.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {renderSection('Active Tasks', incompleteTasks)}
              {renderSection('Completed', completedTasks)}
            </>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
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
            <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'Add Task'}</Text>

            <Text style={styles.label}>Task Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Take out trash"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              autoFocus
            />

            <Text style={styles.label}>Assign To</Text>
            <View style={styles.memberContainer}>
              {familyMembers.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberButton,
                    formData.assignedTo === member.id && styles.memberButtonSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, assignedTo: member.id })}>
                  <Text
                    style={[
                      styles.memberButtonText,
                      formData.assignedTo === member.id && styles.memberButtonTextSelected,
                    ]}>
                    {member.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Due Date</Text>
            <TextInput
              style={styles.input}
              value={formData.dueDate}
              onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
              placeholder="YYYY-MM-DD"
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  taskContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  taskCompleted: {
    backgroundColor: '#f9f9f9',
    opacity: 0.7,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkboxContainer: {
    marginRight: 16,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#0a7ea4',
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  taskMetaText: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#d32f2f',
    fontWeight: '300',
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
  memberContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  memberButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  memberButtonSelected: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  memberButtonText: {
    fontSize: 14,
    color: '#666',
  },
  memberButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
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
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
  },
  creatorBadgeDark: {
    backgroundColor: '#3C3C3C',
  },
  creatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorAvatarDark: {
    backgroundColor: '#4FC3F7',
  },
  creatorInitials: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  creatorName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  creatorNameDark: {
    color: '#938F99',
  },
});


import { useEffect } from 'react';
import { useAuthStore } from '@/src/stores/authStore';
import { useShoppingStore } from '@/src/stores/shoppingStore';
import { useBudgetStore } from '@/src/stores/budgetStore';
import { useTaskStore } from '@/src/stores/taskStore';
import { useCalendarStore } from '@/src/stores/calendarStore';

/**
 * Hook to initialize all family-related stores when family is available
 */
export function useFamilyData() {
  const { family } = useAuthStore();
  const subscribeToLists = useShoppingStore((state) => state.subscribeToLists);
  const subscribeToCategories = useBudgetStore((state) => state.subscribeToCategories);
  const subscribeToTasks = useTaskStore((state) => state.subscribeToTasks);
  const subscribeToEvents = useCalendarStore((state) => state.subscribeToEvents);

  useEffect(() => {
    if (family?.id) {
      subscribeToLists(family.id);
      subscribeToCategories(family.id);
      subscribeToTasks(family.id);
      subscribeToEvents(family.id);
    }
  }, [family?.id, subscribeToLists, subscribeToCategories, subscribeToTasks, subscribeToEvents]);
}


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
  const subscribeToPeriods = useBudgetStore((state) => state.subscribeToPeriods);
  const subscribeToCategories = useBudgetStore((state) => state.subscribeToCategories);
  const activePeriod = useBudgetStore((state) => state.activePeriod);
  const subscribeToTasks = useTaskStore((state) => state.subscribeToTasks);
  const subscribeToEvents = useCalendarStore((state) => state.subscribeToEvents);

  useEffect(() => {
    if (family?.id) {
      subscribeToLists(family.id);
      subscribeToPeriods(family.id); // Subscribe to periods
      subscribeToTasks(family.id);
      subscribeToEvents(family.id);
    }
  }, [family?.id, subscribeToLists, subscribeToPeriods, subscribeToTasks, subscribeToEvents]);

  // Subscribe to categories when active period is available
  useEffect(() => {
    console.log('useFamilyData - Category subscription check:', {
      hasFamily: !!family?.id,
      familyId: family?.id,
      hasActivePeriod: !!activePeriod,
      activePeriodId: activePeriod?.id,
    });
    
    if (family?.id && activePeriod?.id) {
      console.log('Subscribing to categories for period:', activePeriod.id);
      subscribeToCategories(family.id, activePeriod.id);
    } else {
      console.log('Not subscribing to categories - missing family or active period');
    }
  }, [family?.id, activePeriod?.id, subscribeToCategories]);
}


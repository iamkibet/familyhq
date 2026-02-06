// App-wide constants
export const APP_NAME = 'FamilyHQ';

// Firestore collection paths
export const COLLECTIONS = {
  FAMILIES: 'families',
  USERS: 'users',
  SHOPPING_LISTS: 'shoppingLists', // Subcollection: families/{familyId}/shoppingLists/{listId}
  SHOPPING_ITEMS: 'items', // Subcollection: families/{familyId}/shoppingLists/{listId}/items/{itemId}
  SHOPPING: 'shopping', // Legacy - will be migrated
  BUDGETS: 'budgets',
  BUDGET_PERIODS: 'budgetPeriods', // Top-level collection
  BUDGET_CATEGORIES: 'budgets', // Subcollection: budgetPeriods/{periodId}/budgets/{categoryId}
  DIRECT_EXPENSES: 'directExpenses', // Subcollection: families/{familyId}/directExpenses/{expenseId}
  TASKS: 'tasks',
  EVENTS: 'events',
  MEAL_PLANS: 'mealPlans',
} as const;

// Shopping categories
export const SHOPPING_CATEGORIES = [
  'Groceries',
  'Household',
  'Personal Care',
  'Electronics',
  'Clothing',
  'Other',
] as const;

// Budget categories
export const DEFAULT_BUDGET_CATEGORIES = [
  'Groceries',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Other',
] as const;


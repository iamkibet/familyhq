import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  name: string;
  email: string;
  familyId: string;
  role: 'admin' | 'member';
  readActivities?: string[]; // Array of activity IDs that user has marked as read
}

export interface Family {
  id: string;
  name: string;
  createdAt: Timestamp;
  inviteCode: string;
  heroImageUrl?: string; // URL to the hero image for the dashboard
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: Timestamp;
  createdBy: string;
  familyId: string;
  completed?: boolean; // Optional: true when all items are bought
  completedAt?: Timestamp; // Optional: timestamp when list was completed
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  estimatedPrice: number;
  isBought: boolean;
  shoppingListId: string; // Reference to the shopping list
  budgetCategoryName: string; // Budget category this item belongs to (e.g., "Groceries")
  createdBy: string;
  createdAt: Timestamp;
  familyId: string;
}

/**
 * Budget Period represents a time period for budgeting
 * - startDate: Start date of the budget period (YYYY-MM-DD format)
 * - endDate: End date of the budget period (YYYY-MM-DD format)
 * - isArchived: Whether the period has been archived (expired periods are archived)
 */
export interface BudgetPeriod {
  id: string;
  name: string; // e.g., "January 2024 Budget"
  startDate: string; // Start date in YYYY-MM-DD format
  endDate: string; // End date in YYYY-MM-DD format
  familyId: string;
  createdAt: Timestamp;
  isArchived: boolean;
}

/**
 * Budget Category represents a budget category within a budget period
 * - limit: Budget limit for this category within the period
 * - budgetPeriodId: Reference to the BudgetPeriod this category belongs to
 * - spent: Amount spent within the budget period (calculated from expenses within the period's date range)
 */
export interface BudgetCategory {
  id: string;
  name: string;
  limit: number; // Budget limit for the category
  budgetPeriodId: string; // Reference to the BudgetPeriod it belongs to
  spent: number; // Amount spent within the budget period (calculated dynamically)
  familyId: string;
  createdAt?: Timestamp; // When the budget category was created
}

export interface DirectExpense {
  id: string;
  description: string;
  amount: number;
  budgetCategoryName: string;
  createdBy: string;
  createdAt: Timestamp;
  familyId: string;
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  completed: boolean;
  createdAt: Timestamp;
  familyId: string;
  createdBy: string;
}

export interface FamilyEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  familyId: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  userId: string; // Personal notes - only visible to the user who created them
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Meal type for the planner timetable (breakfast, lunch, dinner, snack) */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * Meal plan entry - one meal slot per date + mealType.
 * Stored in Firestore collection MEAL_PLANS.
 * ingredients: optional; TODO link to shopping list integration.
 * TODO: budget estimation per meal could add optional cost/estimatedCost field.
 */
export interface MealPlanEntry {
  id: string;
  familyId: string;
  date: string; // "YYYY-MM-DD"
  mealType: MealType;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: Timestamp;
  ingredients?: string[];
}


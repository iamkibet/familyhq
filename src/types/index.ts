import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  name: string;
  email: string;
  familyId: string;
  role: 'admin' | 'member';
}

export interface Family {
  id: string;
  name: string;
  createdAt: Timestamp;
  inviteCode: string;
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

export interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  spent: number;
  familyId: string;
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


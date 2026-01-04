# Budget System Documentation

## Overview

The FamilyHQ budget system uses **custom date range budgets**. When you create a budget (e.g., $4000 for Groceries), you specify:
- A **start date** (when the budget period begins)
- An **end date** (when the budget period ends)
- A **limit** (the budget amount for that period)

After the end date passes, the budget is no longer active and you can create a new budget period with new dates and limits.

## Key Concepts

### Budget Periods
- Each budget category has a `startDate` and `endDate` that define the budget period
- Budgets are only **active** when the current date falls within the date range
- Once a budget period expires, it becomes inactive and you need to create a new budget period
- You can have multiple budget periods for the same category name (e.g., "Groceries - January", "Groceries - February")

### Spent Amount Calculation
- The `spent` amount is calculated dynamically from expenses within the **budget's date range**
- Expenses are filtered by their `createdAt` timestamp to check if they fall within the budget period
- Only expenses that occurred between `startDate` and `endDate` count toward that budget

### Active vs Expired Budgets
- **Active Budgets**: Current date is between startDate and endDate
- **Expired Budgets**: Current date is after endDate
- Only active budgets are shown in the dashboard and included in totals
- Expired budgets are shown separately in the budget screen for reference

## Implementation Details

### Budget Category Structure
```typescript
interface BudgetCategory {
  id: string;
  name: string;
  limit: number;      // Budget limit for the period
  startDate: string;  // Start date in YYYY-MM-DD format
  endDate: string;    // End date in YYYY-MM-DD format
  spent: number;      // Calculated dynamically from expenses within the period
  familyId: string;
}
```

### Expense Sources
Budget spent is calculated from two sources:
1. **Shopping Items**: When items are marked as "bought", their cost is checked against the budget period
2. **Direct Expenses**: Expenses added directly (utilities, bills, etc.)

Both are filtered by checking if their `createdAt` timestamp falls within the budget's `startDate` to `endDate` range.

### Creating New Budget Periods
When a budget period expires:
1. The budget becomes inactive (no longer shown in dashboard)
2. You can create a new budget with the same category name
3. Set new start and end dates for the new period
4. Set a new limit for the new period

## UI Features

- **Budget Creation Form**: Includes date pickers for start and end dates
- **Budget Cards**: Show the date range (e.g., "Jan 1 - Jan 31")
- **Active/Expired Sections**: Budgets are grouped by active status
- **Expired Badge**: Shows "Expired" label on budgets past their end date
- **Dashboard**: Only shows active budgets

## Notes

- Budget limits are stored per budget period (you can have multiple periods for the same category)
- The system calculates spent amounts dynamically based on the budget's date range
- Historical budgets remain visible in the budget screen for reference
- When creating a budget, default end date is set to 1 month from start date
- Date validation ensures end date is after start date


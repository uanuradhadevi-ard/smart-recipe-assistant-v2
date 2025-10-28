export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface PlannedMeal {
  id: string;
  date: string;
  slot: MealSlot;
  recipeId: string;
  recipeName: string;
  recipeThumb?: string;
}

export interface MealPlanWeek {
  id: string;
  startDate: string;
  meals: PlannedMeal[];
}

export interface ShoppingListItem {
  id: string;
  ingredient: string;
  quantity?: string;
  checked?: boolean;
  sourceMealIds?: string[];
}

export interface ShoppingList {
  id: string;
  title: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}


import { MealPlanWeek, PlannedMeal, ShoppingList, ShoppingListItem } from '../types/mealPlan';

const MEAL_WEEKS_KEY = 'mealPlanWeeks';
const SHOPPING_LISTS_KEY = 'shoppingLists';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getWeeks(): MealPlanWeek[] {
  return load<MealPlanWeek[]>(MEAL_WEEKS_KEY, []);
}

export function upsertWeek(week: MealPlanWeek) {
  const weeks = getWeeks();
  const idx = weeks.findIndex(w => w.id === week.id);
  if (idx >= 0) weeks[idx] = week; else weeks.push(week);
  save(MEAL_WEEKS_KEY, weeks);
}

export function addPlannedMeal(weekId: string, plannedMeal: PlannedMeal) {
  const weeks = getWeeks();
  let week = weeks.find(w => w.id === weekId);
  if (!week) {
    week = { id: weekId, startDate: plannedMeal.date, meals: [] };
    weeks.push(week);
  }
  week.meals.push(plannedMeal);
  save(MEAL_WEEKS_KEY, weeks);
}

export function removePlannedMeal(weekId: string, plannedMealId: string) {
  const weeks = getWeeks();
  const week = weeks.find(w => w.id === weekId);
  if (!week) return;
  week.meals = week.meals.filter(m => m.id !== plannedMealId);
  save(MEAL_WEEKS_KEY, weeks);
}

export function getShoppingLists(): ShoppingList[] {
  return load<ShoppingList[]>(SHOPPING_LISTS_KEY, []);
}

export function upsertShoppingList(list: ShoppingList) {
  const lists = getShoppingLists();
  const idx = lists.findIndex(l => l.id === list.id);
  if (idx >= 0) lists[idx] = list; else lists.push(list);
  list.updatedAt = new Date().toISOString();
  save(SHOPPING_LISTS_KEY, lists);
}

export function addShoppingItem(listId: string, item: ShoppingListItem) {
  const lists = getShoppingLists();
  let list = lists.find(l => l.id === listId);
  if (!list) {
    list = { id: listId, title: `Shopping List ${listId}`, items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    lists.push(list);
  }
  list.items.push(item);
  list.updatedAt = new Date().toISOString();
  save(SHOPPING_LISTS_KEY, lists);
}

export function updateShoppingItem(listId: string, itemId: string, updates: Partial<ShoppingListItem>) {
  const lists = getShoppingLists();
  const list = lists.find(l => l.id === listId);
  if (!list) return;
  const item = list.items.find(i => i.id === itemId);
  if (!item) return;
  // Only assign fields that are explicitly defined to avoid overwriting with undefined
  (Object.keys(updates) as (keyof ShoppingListItem)[]).forEach((k) => {
    const val = updates[k];
    if (val !== undefined) {
      (item as any)[k] = val;
    }
  });
  list.updatedAt = new Date().toISOString();
  save(SHOPPING_LISTS_KEY, lists);
}

export function removeShoppingItem(listId: string, itemId: string) {
  const lists = getShoppingLists();
  const list = lists.find(l => l.id === listId);
  if (!list) return;
  list.items = list.items.filter(i => i.id !== itemId);
  list.updatedAt = new Date().toISOString();
  save(SHOPPING_LISTS_KEY, lists);
}

export function generateWeekId(date: Date): string {
  const year = date.getFullYear();
  const firstJan = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - firstJan.getTime()) / 86400000) + firstJan.getDay();
  const week = Math.ceil(days / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}


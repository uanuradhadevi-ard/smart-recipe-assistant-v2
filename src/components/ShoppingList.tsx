import { useMemo, useState } from 'react';
import { CheckSquare, ListChecks, Plus, Trash2 } from 'lucide-react';
import { ShoppingListItem } from '../types/mealPlan';
import { addShoppingItem, getShoppingLists, removeShoppingItem, updateShoppingItem, upsertShoppingList, generateWeekId, getWeeks } from '../utils/plannerStorage';
import { getRecipeById, searchByName } from '../services/mealDB';
import { convertToStoreUnits, formatStoreAmount } from '../utils/unitConversion';

interface ShoppingListProps {
  weekDate?: Date;
}

export default function ShoppingList({ weekDate = new Date() }: ShoppingListProps) {
  const weekId = useMemo(() => generateWeekId(weekDate), [weekDate]);
  const lists = getShoppingLists();
  const weeks = getWeeks();
  const week = weeks.find(w => w.id === weekId);
  const list = lists.find(l => l.id === weekId) || { id: weekId, title: `Shopping List ${weekId}`, items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

  const [newItem, setNewItem] = useState<{ ingredient: string; quantity?: string }>({ ingredient: '', quantity: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [useStoreUnits, setUseStoreUnits] = useState(true);

  const addItem = () => {
    if (!newItem.ingredient.trim()) return;
    const item: ShoppingListItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ingredient: newItem.ingredient.trim(),
      quantity: newItem.quantity?.trim(),
      checked: false,
      sourceMealIds: [],
    };
    addShoppingItem(weekId, item);
    setNewItem({ ingredient: '', quantity: '' });
  };

  const toggleChecked = (id: string, checked: boolean) => updateShoppingItem(weekId, id, { checked });
  const editItem = (id: string, ingredient?: string, quantity?: string) => updateShoppingItem(weekId, id, { ingredient, quantity });
  const deleteItem = (id: string) => removeShoppingItem(weekId, id);

  const generateFromPlan = async () => {
    if (!week) return;
    try {
      setIsGenerating(true);
      const details = await Promise.all(
        week.meals.map(async (m) => {
          try {
            let d = await getRecipeById(m.recipeId);
            if (!d) {
              const byName = await searchByName(m.recipeName);
              if (byName && byName.length > 0) {
                d = await getRecipeById(byName[0].idMeal);
              }
            }
            return { meal: m, details: d };
          } catch {
            return { meal: m, details: null as any };
          }
        })
      );

      const map = new Map<string, ShoppingListItem>();
      for (const { meal, details: d } of details) {
        if (!d || !d.ingredients) continue;
        for (const ing of d.ingredients) {
          const key = ing.ingredient.trim().toLowerCase();
          if (!key) continue;
          const existing = map.get(key);
          if (!existing) {
            map.set(key, {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              ingredient: ing.ingredient.trim(),
              quantity: useStoreUnits ? formatStoreAmount(convertToStoreUnits(ing.ingredient, ing.measure)) : (ing.measure?.trim() || ''),
              checked: false,
              sourceMealIds: [meal.id],
            });
          } else {
            const addText = useStoreUnits ? formatStoreAmount(convertToStoreUnits(ing.ingredient, ing.measure)) : (ing.measure?.trim() || '');
            if (addText && !existing.quantity?.includes(addText)) {
              existing.quantity = existing.quantity ? `${existing.quantity} + ${addText}` : addText;
            }
            if (!existing.sourceMealIds) existing.sourceMealIds = [];
            existing.sourceMealIds.push(meal.id);
          }
        }
      }

      const items = Array.from(map.values());
      upsertShoppingList({ ...list, items, updatedAt: new Date().toISOString() });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-saffron-700" />
          <h2 className="text-xl font-bold text-gray-800">Shopping List</h2>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={useStoreUnits} onChange={e => setUseStoreUnits(e.target.checked)} />
            Convert to store units (ämag/kg, ml/L)
          </label>
          <button onClick={generateFromPlan} disabled={isGenerating} className="px-4 py-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700 disabled:opacity-50">
            {isGenerating ? 'Generating…' : 'Generate from Planner'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Ingredient"
          value={newItem.ingredient}
          onChange={e => setNewItem(s => ({ ...s, ingredient: e.target.value }))}
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron-500"
        />
        <input
          type="text"
          placeholder="Qty"
          value={newItem.quantity}
          onChange={e => setNewItem(s => ({ ...s, quantity: e.target.value }))}
          className="w-28 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron-500"
        />
        <button onClick={addItem} className="p-2 bg-saffron-600 text-white rounded-lg hover:bg-saffron-700">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {list.items.length === 0 ? (
        <div className="text-gray-500 text-sm">No items yet. Add items or generate from planner.</div>
      ) : (
        <ul className="divide-y">
          {list.items.map(item => (
            <li key={item.id} className="py-3 flex items-center gap-3">
              <button onClick={() => toggleChecked(item.id, !item.checked)} className={`p-2 rounded-lg border ${item.checked ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'}`}>
                <CheckSquare className={`h-5 w-5 ${item.checked ? 'text-green-600' : 'text-gray-400'}`} />
              </button>
              <input
                value={item.ingredient}
                readOnly
                className="flex-1 px-2 py-1 border rounded-lg bg-gray-50 text-gray-700"
              />
              <input
                value={item.quantity || ''}
                onChange={e => editItem(item.id, undefined, e.target.value)}
                className="w-28 px-2 py-1 border rounded-lg"
              />
              <button onClick={() => deleteItem(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


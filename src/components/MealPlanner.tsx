import { useMemo, useState } from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { MealSlot, PlannedMeal } from '../types/mealPlan';
import { addPlannedMeal, generateWeekId, getWeeks, removePlannedMeal } from '../utils/plannerStorage';
import { searchByName } from '../services/mealDB';

interface MealPlannerProps {
  onAddToShoppingList?: (plannedMeal: PlannedMeal) => void;
}

const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function MealPlanner({ onAddToShoppingList }: MealPlannerProps) {
  const [current, setCurrent] = useState<Date>(startOfWeek(new Date()));
  const weekId = useMemo(() => generateWeekId(current), [current]);
  const weekStart = useMemo(() => startOfWeek(current), [current]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  }), [weekStart]);

  const weeks = getWeeks();
  const week = weeks.find(w => w.id === weekId) || { id: weekId, startDate: formatISO(weekStart), meals: [] };

  const [newMeal, setNewMeal] = useState<{ [key: string]: { recipeId: string; recipeName: string; recipeThumb?: string } }>({});
  const [suggestions, setSuggestions] = useState<{ [key: string]: Array<{ idMeal: string; strMeal: string; strMealThumb: string }> }>({});
  const [openSuggestKey, setOpenSuggestKey] = useState<string | null>(null);

  const addMeal = (dateStr: string, slot: MealSlot) => {
    const key = `${dateStr}-${slot}`;
    const entry = newMeal[key];
    if (!entry || !entry.recipeId || !entry.recipeName) return;
    const planned: PlannedMeal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: dateStr,
      slot,
      recipeId: entry.recipeId,
      recipeName: entry.recipeName,
      recipeThumb: entry.recipeThumb,
    };
    addPlannedMeal(weekId, planned);
    if (onAddToShoppingList) onAddToShoppingList(planned);
    setNewMeal(prev => ({ ...prev, [key]: { recipeId: '', recipeName: '' } }));
    setOpenSuggestKey(null);
  };

  const removeMeal = (plannedMealId: string) => {
    removePlannedMeal(weekId, plannedMealId);
  };

  const mealsByDaySlot: Record<string, PlannedMeal | undefined> = {};
  week.meals.forEach(m => { mealsByDaySlot[`${m.date}-${m.slot}`] = m; });

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <CalendarDays className="h-6 w-6 text-orange-600" />
          <h2 className="text-xl font-bold text-gray-800">Weekly Meal Planner</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrent(d => { const nd = new Date(d); nd.setDate(d.getDate() - 7); return startOfWeek(nd); })} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Prev</button>
          <button onClick={() => setCurrent(startOfWeek(new Date()))} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Today</button>
          <button onClick={() => setCurrent(d => { const nd = new Date(d); nd.setDate(d.getDate() + 7); return startOfWeek(nd); })} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Next</button>
        </div>
      </div>

      {/* Mobile layout: stacked day cards */}
      <div className="block md:hidden space-y-4">
        {days.map((d, i) => {
          const dateStr = formatISO(d);
          return (
            <div key={i} className="border rounded-xl p-4">
              <div className="font-semibold text-gray-800 mb-3">
                {d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
              <div className="space-y-3">
                {slots.map((slot) => {
                  const key = `${dateStr}-${slot}`;
                  const planned = mealsByDaySlot[key];
                  return (
                    <div key={key} className="">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{slot}</div>
                      {planned ? (
                        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-2">
                          <div className="flex items-center gap-3">
                            {planned.recipeThumb && (
                              <img src={planned.recipeThumb} alt={planned.recipeName} className="h-8 w-8 rounded object-cover" />
                            )}
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{planned.recipeName}</div>
                              <div className="text-xs text-gray-500">#{planned.recipeId}</div>
                            </div>
                          </div>
                          <button onClick={() => removeMeal(planned.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Type a recipe name..."
                              value={newMeal[key]?.recipeName || ''}
                              onFocus={() => setOpenSuggestKey(key)}
                              onChange={async e => {
                                const val = e.target.value;
                                setNewMeal(prev => ({ ...prev, [key]: { recipeId: val, recipeName: val } }));
                                if (val.trim().length < 2) {
                                  setSuggestions(prev => ({ ...prev, [key]: [] }));
                                  return;
                                }
                                try {
                                  const res = await searchByName(val.trim());
                                  setSuggestions(prev => ({ ...prev, [key]: res.slice(0, 8).map(r => ({ idMeal: r.idMeal, strMeal: r.strMeal, strMealThumb: r.strMealThumb })) }));
                                  setOpenSuggestKey(key);
                                } catch {
                                  setSuggestions(prev => ({ ...prev, [key]: [] }));
                                }
                              }}
                              className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button onClick={() => addMeal(dateStr, slot)} className="px-3 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          {openSuggestKey === key && (suggestions[key]?.length || 0) > 0 && (
                            <div className="absolute z-20 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
                              {suggestions[key]!.map(s => (
                                <button
                                  key={s.idMeal}
                                  type="button"
                                  onMouseDown={e => e.preventDefault()}
                                  onClick={() => {
                                    setNewMeal(prev => ({ ...prev, [key]: { recipeId: s.idMeal, recipeName: s.strMeal, recipeThumb: s.strMealThumb } }));
                                    setOpenSuggestKey(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-orange-50 text-left"
                                >
                                  <img src={s.strMealThumb} alt={s.strMeal} className="h-8 w-8 rounded object-cover" />
                                  <span className="text-sm text-gray-800">{s.strMeal}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop layout: grid */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[720px] grid" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
          <div className="p-3 font-semibold text-gray-700">Meal</div>
          {days.map((d, i) => (
            <div key={i} className="p-3 font-semibold text-gray-700 text-center">
              {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          ))}
          {slots.map(slot => (
            <>
              <div key={`${slot}-label`} className="p-3 font-semibold capitalize border-t bg-gray-50">{slot}</div>
              {days.map((d, i) => {
                const dateStr = formatISO(d);
                const key = `${dateStr}-${slot}`;
                const planned = mealsByDaySlot[key];
                return (
                  <div key={`${i}-${slot}`} className="p-3 border-t">
                    {planned ? (
                      <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-2">
                        <div className="flex items-center gap-3">
                          {planned.recipeThumb && <img src={planned.recipeThumb} alt={planned.recipeName} className="h-8 w-8 rounded object-cover" />}
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{planned.recipeName}</div>
                            <div className="text-xs text-gray-500">#{planned.recipeId}</div>
                          </div>
                        </div>
                        <button onClick={() => removeMeal(planned.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Type a recipe name..."
                            value={newMeal[key]?.recipeName || ''}
                            onFocus={() => setOpenSuggestKey(key)}
                            onChange={async e => {
                              const val = e.target.value;
                              setNewMeal(prev => ({ ...prev, [key]: { recipeId: val, recipeName: val } }));
                              if (val.trim().length < 2) {
                                setSuggestions(prev => ({ ...prev, [key]: [] }));
                                return;
                              }
                              try {
                                const res = await searchByName(val.trim());
                                setSuggestions(prev => ({ ...prev, [key]: res.slice(0, 8).map(r => ({ idMeal: r.idMeal, strMeal: r.strMeal, strMealThumb: r.strMealThumb })) }));
                                setOpenSuggestKey(key);
                              } catch {
                                setSuggestions(prev => ({ ...prev, [key]: [] }));
                              }
                            }}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <button onClick={() => addMeal(dateStr, slot)} className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {openSuggestKey === key && (suggestions[key]?.length || 0) > 0 && (
                          <div className="absolute z-20 mt-2 w-full bg-white border rounded-lg shadow-lg max-h-64 overflow-auto">
                            {suggestions[key]!.map(s => (
                              <button
                                key={s.idMeal}
                                type="button"
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => {
                                  setNewMeal(prev => ({ ...prev, [key]: { recipeId: s.idMeal, recipeName: s.strMeal, recipeThumb: s.strMealThumb } }));
                                  setOpenSuggestKey(null);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-orange-50 text-left"
                              >
                                <img src={s.strMealThumb} alt={s.strMeal} className="h-8 w-8 rounded object-cover" />
                                <span className="text-sm text-gray-800">{s.strMeal}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { Search, ChefHat, Sparkles, Clock, TrendingUp, Loader2, Heart as HeartIcon, Home, CalendarDays, ListChecks, Utensils, Flame, Timer } from 'lucide-react';
import { Recipe, RecipeDetail } from './types/recipe';
import { searchByIngredient, searchByName, getRecipeById } from './services/mealDB';
import RecipeCard from './components/RecipeCard';
import MealPlanner from './components/MealPlanner';
import ShoppingList from './components/ShoppingList';
import RecipeModal from './components/RecipeModal';
import { getFavorites } from './utils/favorites';
import { getMoodSearchTerms, parseTimeInput, parseIngredients, buildTimeBuckets } from './utils/searchFilters';
import { getSuggestions } from './utils/autocomplete';
import { addShoppingItem, generateWeekId } from './utils/plannerStorage';
import { ShoppingListItem } from './types/mealPlan';

type FilterType = 'ingredients' | 'mood' | 'time';

interface Filter {
  type: FilterType;
  value: string;
}

type ViewMode = 'search' | 'favorites' | 'planner' | 'shopping';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('ingredients');
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [simpleIdeas, setSimpleIdeas] = useState<string[]>([]);
  const [onlyMyIngredients, setOnlyMyIngredients] = useState<boolean>(false);
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('tt_dark');
      return v === '1';
    } catch { return false; }
  });

  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const tryIdeaSearch = async (terms: string[]) => {
    for (const t of terms) {
      const matches = await searchByName(t);
      if (matches && matches.length > 0) return matches[0];
    }
    return null;
  };

  const buildFallbackRecipe = (idea: string): RecipeDetail => {
    const userIngs = parseIngredients(searchQuery).map(i => i.trim()).filter(Boolean);
    const lowerIdea = idea.toLowerCase();
    const staples = ['salt', 'pepper'];
    const base: RecipeDetail = {
      idMeal: `local-idea-${Date.now()}`,
      strMeal: idea,
      strMealThumb: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
      strCategory: 'Quick Idea',
      strArea: 'Generic',
      strInstructions: '',
      strTags: 'quick,simple,minimal',
      strYoutube: '',
      strSource: '',
      ingredients: [],
    };

    const addIng = (ingredient: string, measure: string) => {
      base.ingredients.push({ ingredient, measure });
    };

    // Default: include user's listed ingredients
    userIngs.forEach(i => addIng(i, 'as needed'));
    staples.forEach(s => { if (!userIngs.some(i => i.toLowerCase().includes(s))) addIng(s, 'to taste'); });

    if (lowerIdea.includes('egg toast') || lowerIdea.includes('egg') && lowerIdea.includes('toast')) {
      if (!userIngs.some(i => i.includes('egg'))) addIng('egg', '1-2');
      if (!userIngs.some(i => i.includes('bread'))) addIng('bread slices', '2');
      addIng('butter or oil', '1 tbsp');
      base.strInstructions = [
        'Beat eggs with a pinch of salt and pepper in a bowl.',
        'Heat a pan on medium, add butter or oil.',
        'Dip bread slices in the egg mixture to coat both sides.',
        'Place on the pan and cook 2-3 minutes per side until golden.',
        'Serve hot. Optional: add herbs, chili flakes, or cheese.'
      ].join('\n');
    } else if (lowerIdea.includes('french toast')) {
      if (!userIngs.some(i => i.includes('egg'))) addIng('egg', '2');
      if (!userIngs.some(i => i.includes('milk'))) addIng('milk', '1/3 cup');
      if (!userIngs.some(i => i.includes('bread'))) addIng('bread slices', '2-3');
      addIng('sugar', '1 tbsp');
      addIng('cinnamon (optional)', '1/4 tsp');
      addIng('butter', '1 tbsp');
      base.strInstructions = [
        'Whisk eggs, milk, sugar, and cinnamon.',
        'Heat butter on a pan over medium heat.',
        'Dip bread in the mixture and cook 2-3 minutes per side.',
        'Serve with honey, syrup, or fruit.'
      ].join('\n');
    } else if (lowerIdea.includes('egg & tomato') || lowerIdea.includes('scramble')) {
      if (!userIngs.some(i => i.includes('egg'))) addIng('eggs', '2-3');
      if (!userIngs.some(i => i.includes('tomato'))) addIng('tomato', '1 medium, diced');
      addIng('oil', '1 tbsp');
      base.strInstructions = [
        'Heat oil in a pan. Add diced tomato and cook 2 minutes.',
        'Beat eggs with salt and pepper. Pour into pan.',
        'Stir gently until softly set. Serve warm.'
      ].join('\n');
    } else if (lowerIdea.includes('tomato pasta')) {
      if (!userIngs.some(i => i.includes('pasta'))) addIng('pasta', '150 g');
      if (!userIngs.some(i => i.includes('tomato'))) addIng('tomato (or puree)', '2 medium or 1/2 cup');
      addIng('garlic (optional)', '2 cloves');
      addIng('oil', '1 tbsp');
      base.strInstructions = [
        'Boil pasta in salted water until al dente; reserve 1/4 cup water.',
        'In a pan, sauté garlic in oil, add tomato and cook 5-7 minutes.',
        'Toss pasta with sauce, adjust with reserved water, season and serve.'
      ].join('\n');
    } else if (lowerIdea.includes('egg fried rice')) {
      if (!userIngs.some(i => i.includes('rice'))) addIng('cooked rice', '2 cups');
      if (!userIngs.some(i => i.includes('egg'))) addIng('eggs', '2');
      addIng('oil', '1 tbsp');
      addIng('soy sauce (optional)', '1 tbsp');
      base.strInstructions = [
        'Scramble eggs in a little oil; remove and set aside.',
        'Add more oil, then rice; stir-fry on high heat.',
        'Return eggs, season with salt/soy; mix and serve.'
      ].join('\n');
    } else if (lowerIdea.includes('okra') || lowerIdea.includes('bhindi')) {
      if (!userIngs.some(i => i.includes('okra') || i.includes('bhindi') || i.includes('ladies finger'))) addIng('okra (bhindi)', '200 g');
      addIng('oil', '1 tbsp');
      addIng('turmeric (optional)', '1/4 tsp');
      base.strInstructions = [
        'Slice okra, pat dry.',
        'Heat oil, add okra and sauté on medium-high until non-sticky and lightly crisp.',
        'Season with salt, pepper, and turmeric (optional).'
      ].join('\n');
    } else if (lowerIdea.includes('eggplant') || lowerIdea.includes('brinjal') || lowerIdea.includes('aubergine')) {
      if (!userIngs.some(i => i.includes('eggplant') || i.includes('brinjal'))) addIng('eggplant (brinjal)', '1 medium');
      addIng('oil', '1-2 tbsp');
      base.strInstructions = [
        'Cut eggplant into cubes/slices.',
        'Heat oil and sauté eggplant until soft and browned.',
        'Season with salt and pepper; optional: add a chopped tomato and cook 3 more minutes.'
      ].join('\n');
    } else if (lowerIdea.includes('onion & tomato')) {
      if (!userIngs.some(i => i.includes('onion'))) addIng('onion', '1 medium, sliced');
      if (!userIngs.some(i => i.includes('tomato'))) addIng('tomato', '1 medium, chopped');
      addIng('oil', '1 tbsp');
      base.strInstructions = [
        'Heat oil, sauté onions until translucent.',
        'Add tomatoes, cook until soft and saucy.',
        'Season with salt and pepper; serve as a quick stir-fry.'
      ].join('\n');
    } else if (lowerIdea.includes('rajma')) {
      if (!userIngs.some(i => i.includes('rajma') || i.includes('kidney beans'))) addIng('cooked rajma (kidney beans)', '1 cup');
      if (!userIngs.some(i => i.includes('tomato'))) addIng('tomato puree', '1/2 cup');
      addIng('oil', '1 tbsp');
      addIng('cumin (optional)', '1/2 tsp');
      base.strInstructions = [
        'Heat oil, optionally splutter cumin.',
        'Add tomato puree, cook 3-5 minutes.',
        'Add cooked rajma, salt, pepper; simmer 5 minutes and serve.'
      ].join('\n');
    } else if (lowerIdea.includes('beans & tomato') || lowerIdea.includes('beans stir-fry')) {
      if (!userIngs.some(i => i.includes('beans'))) addIng('green beans', '200 g, chopped');
      addIng('oil', '1 tbsp');
      if (!userIngs.some(i => i.includes('tomato'))) addIng('tomato', '1 small, chopped');
      base.strInstructions = [
        'Heat oil, add beans and stir-fry 4-6 minutes.',
        'Add chopped tomato and cook 2 minutes more.',
        'Season with salt and pepper.'
      ].join('\n');
    } else if (lowerIdea.includes('chili omelet') || lowerIdea.includes('chilli omelet')) {
      if (!userIngs.some(i => i.includes('egg'))) addIng('eggs', '2-3');
      addIng('green chili (finely chopped)', '1');
      addIng('oil', '1 tbsp');
      base.strInstructions = [
        'Beat eggs with salt and pepper; add chopped chili.',
        'Heat oil in a pan; pour mixture and cook until set on both sides.',
        'Serve hot.'
      ].join('\n');
    } else {
      // Generic fallback
      addIng('oil or butter', '1 tbsp');
      base.strInstructions = 'Combine your listed ingredients with basic seasoning and cook on medium heat until done. Adjust salt and pepper to taste.';
    }

    return base;
  };

  const handleQuickIdeaClick = async (idea: string) => {
    setIsLoading(true);
    try {
      // Try multiple keywords for better matching
      const synonyms: Record<string, string[]> = {
        'egg toast': ['egg toast', 'eggs on toast', 'french toast', 'egg sandwich'],
        'tomato pasta': ['tomato pasta', 'pasta pomodoro', 'arrabiata', 'marinara'],
        'egg & tomato scramble': ['egg tomato scramble', 'shakshuka', 'scrambled eggs tomato'],
        'egg fried rice': ['egg fried rice', 'fried rice egg'],
        'okra stir-fry': ['okra fry', 'bhindi fry', 'okra stir fry', 'bhindi masala minimal'],
        'okra & onion stir-fry': ['bhindi onion', 'okra onion stir fry', 'bhindi fry'],
        'eggplant stir-fry': ['brinjal fry', 'eggplant fry', 'brinjal stir fry'],
        'eggplant & tomato sauté': ['brinjal tomato', 'eggplant tomato stir fry'],
        'onion & tomato stir-fry': ['onion tomato fry', 'onion tomato stir fry'],
        'quick rajma masala': ['rajma', 'kidney beans curry', 'rajma masala'],
        'beans & tomato stir-fry': ['beans poriyal', 'beans tomato stir fry']
      };
      const terms = [idea, idea.toLowerCase(), ...(synonyms[idea.toLowerCase()] || [])];
      const match = await tryIdeaSearch(terms);
      if (match) {
        const details = await getRecipeById(match.idMeal);
        if (details) {
          setSelectedRecipe(details);
          return;
        }
      }
      // Build and show a fallback recipe using user's ingredients
      const fallback = buildFallbackRecipe(idea);
      setSelectedRecipe(fallback);
    } catch (e) {
      setError('Failed to load recipe. Please try again.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };


  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setError(null);

    setIsLoading(true);
    setRecipes([]); // Clear previous results
    setSimpleIdeas([]);
    
    try {
      let results: Recipe[] = [];
      
      // Based on filter type, decide which search to use
      if (filterType === 'ingredients') {
        // Parse multiple ingredients
        const ingredients = parseIngredients(query);
        // Provide simple ideas when user has 1–2 ingredients
        if (ingredients.length > 0 && ingredients.length <= 2) {
          const lower = ingredients.map(i => i.toLowerCase());
          const ideas: string[] = [];
          if (lower.length === 1) {
            const i = lower[0];
            if (i.includes('egg')) ideas.push('Boiled eggs', 'Scrambled eggs', 'Egg omelet', 'Sunny-side up');
            if (i.includes('potato')) ideas.push('Boiled potatoes', 'Pan-fried potatoes', 'Mashed potatoes');
            if (i.includes('bread')) ideas.push('Toast', 'Garlic bread', 'Bread croutons');
            if (i.includes('rice')) ideas.push('Plain rice', 'Crispy rice', 'Congee (plain)');
            if (i.includes('tomato')) ideas.push('Tomato salad', 'Tomato soup', 'Tomato bruschetta');
            if (i.includes('banana')) ideas.push('Banana slices with honey', 'Pan-seared banana');
            if (i.includes('oats')) ideas.push('Plain oatmeal', 'Toasted oats');
            if (i.includes('onion')) ideas.push('Caramelized onions', 'Onion omelet');
            if (i.includes('chili') || i.includes('chilli') || i.includes('green chili')) ideas.push('Chili omelet');
            if (i.includes('brinjal') || i.includes('eggplant') || i.includes('aubergine')) ideas.push('Eggplant stir-fry');
            if (i.includes('ladies finger') || i.includes('ladyfinger') || i.includes('okra') || i.includes('bhindi')) ideas.push('Okra stir-fry');
            if (i.includes('beans')) ideas.push('Beans stir-fry');
            if (i.includes('rajma') || i.includes('kidney beans')) ideas.push('Quick rajma (with pre-cooked rajma)');
          }
          if (lower.length === 2) {
            const [a, b] = lower;
            const has = (s: string) => a.includes(s) || b.includes(s);
            if (has('egg') && has('bread')) ideas.push('Egg toast', 'French toast');
            if (has('egg') && has('potato')) ideas.push('Spanish-style egg & potato omelet');
            if (has('egg') && has('tomato')) ideas.push('Egg & tomato scramble', 'Shakshuka (minimal)');
            if (has('pasta') && has('tomato')) ideas.push('Tomato pasta');
            if (has('rice') && has('egg')) ideas.push('Simple egg fried rice');
            if (has('rice') && has('tomato')) ideas.push('Tomato rice');
            if (has('banana') && has('oats')) ideas.push('Banana oats porridge');
            if (has('bread') && has('tomato')) ideas.push('Tomato bruschetta');
            if (has('bread') && has('potato')) ideas.push('Potato sandwich (minimal)');
            if (has('onion') && has('tomato')) ideas.push('Onion & tomato stir-fry');
            if ((has('okra') || has('ladies finger') || has('bhindi')) && has('onion')) ideas.push('Okra & onion stir-fry');
            if ((has('brinjal') || has('eggplant') || has('aubergine')) && has('tomato')) ideas.push('Eggplant & tomato sauté');
            if ((has('rajma') || has('kidney beans')) && has('tomato')) ideas.push('Quick rajma masala');
            if (has('beans') && has('tomato')) ideas.push('Beans & tomato stir-fry');
            if (has('egg') && (has('chili') || has('chilli'))) ideas.push('Chili omelet');
          }
          const uniqueIdeas = Array.from(new Set(ideas)).slice(0, 8);
          if (uniqueIdeas.length > 0) setSimpleIdeas(uniqueIdeas);
        }
        
        if (ingredients.length > 1) {
          // Multiple ingredients - search for first ingredient and filter results
          console.log('Searching by multiple ingredients:', ingredients);
          const primaryResults = await searchByIngredient(ingredients[0]);
          
          // Fetch details for all results to check ingredient matches
          results = await Promise.all(
            primaryResults.slice(0, 50).map(async (recipe) => {
              try {
                const details = await getRecipeById(recipe.idMeal);
                return details;
              } catch {
                return null;
              }
            })
          );
          
          // First try STRICT subset: all recipe ingredients are within provided ingredients
          const provided = ingredients.map(i => i.toLowerCase());
          const strict = (results.filter(r => {
            if (!r) return false;
            const recipeIngredients = r.ingredients.map(ing => ing.ingredient.toLowerCase());
            return recipeIngredients.every(ri => provided.some(pi => pi.includes(ri) || ri.includes(pi)));
          }) as RecipeDetail[]).map(r => { const { ingredients: _ignore, ...rest } = r; return rest; });

          if (onlyMyIngredients) {
            results = strict;
          } else if (strict.length > 0) {
            results = strict;
          } else {
            // Fallback: recipes that contain ALL specified ingredients (may include extras)
            const relaxed = (results.filter(r => {
              if (!r) return false;
              const recipeIngredients = r.ingredients.map(ing => ing.ingredient.toLowerCase());
              return ingredients.every(searchIng => {
                const searchLower = searchIng.toLowerCase();
                return recipeIngredients.some(ri => ri.includes(searchLower) || searchLower.includes(ri));
              });
            }) as RecipeDetail[]).map(r => { const { ingredients: _ignore, ...rest } = r; return rest; });
            results = relaxed;
          }
          
          console.log(`Found ${results.length} recipes matching all ingredients`);
        } else {
          // Single ingredient search
          console.log('Searching by ingredient:', ingredients[0]);
          results = await searchByIngredient(ingredients[0]);
          
          // If no results, try searching by name as fallback
          if (results.length === 0) {
            console.log('No results by ingredient, trying name search...');
            results = await searchByName(ingredients[0]);
          }
        }
      } else if (filterType === 'mood') {
        // Mood-based search
        const moodTerms = getMoodSearchTerms(query);
        console.log('Mood search terms:', moodTerms);
        
        // Search with mood-related terms
        for (const term of moodTerms.slice(0, 3)) {
          const termResults = await searchByName(term);
          results = [...results, ...termResults];
        }
        
        // Remove duplicates
        const seen = new Set();
        results = results.filter(r => {
          if (seen.has(r.idMeal)) return false;
          seen.add(r.idMeal);
          return true;
        });
        
        // Sort by relevance (recipes with mood terms in name)
        results = results.sort((a, b) => {
          const aScore = moodTerms.filter(term => 
            a.strMeal.toLowerCase().includes(term.toLowerCase())
          ).length;
          const bScore = moodTerms.filter(term => 
            b.strMeal.toLowerCase().includes(term.toLowerCase())
          ).length;
          return bScore - aScore;
        });
      } else if (filterType === 'time') {
        // Time-based search: accept any minutes, snap to nearest 5, then try neighboring buckets
        let inputMinutes = parseTimeInput(query) || 60;
        if (inputMinutes > 60) inputMinutes = 60;
        if (inputMinutes < 5) inputMinutes = 5;
        const buckets: number[] = buildTimeBuckets(inputMinutes);

        let found: Recipe[] = [];
        for (const maxTime of buckets) {
          let bucketResults: Recipe[] = [];
          if (maxTime <= 30) {
            const quickSearches = ['pasta', 'salad', 'sandwich', 'quick', 'easy', 'simple'];
            for (const term of quickSearches) {
              const termResults = await searchByName(term);
              bucketResults = [...bucketResults, ...termResults];
            }
          } else {
            bucketResults = await searchByName(query);
          }

          // De-duplicate
          const seenLocal = new Set<string>();
          bucketResults = bucketResults.filter(r => {
            if (seenLocal.has(r.idMeal)) return false;
            seenLocal.add(r.idMeal);
            return true;
          });

          const detailedResults = await Promise.all(
            bucketResults.slice(0, 30).map(async (recipe) => {
              try {
                const details = await getRecipeById(recipe.idMeal);
                if (details && details.estimatedTime && details.estimatedTime <= maxTime) {
                  const { ingredients: _ignore, ...rest } = details;
                  return rest;
                }
                return null;
              } catch {
                return null;
              }
            })
          );

          const filtered = detailedResults.filter(Boolean) as Recipe[];
          if (filtered.length > 0) {
            found = filtered;
            console.log(`Found ${filtered.length} recipes under ${maxTime} minutes`);
            break;
          }
        }

        results = found;
      }
      
      console.log('Found recipes:', results.length);
      setRecipes(results);
      
      if (results.length === 0) {
        console.log('No recipes found for query:', query);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError('Failed to search recipes. Please check your connection and try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  const handleRecipeClick = async (recipe: Recipe) => {
    setIsLoading(true);
    try {
      const details = await getRecipeById(recipe.idMeal);
      if (details) {
        setSelectedRecipe(details);
      }
    } catch (error) {
      console.error('Failed to fetch recipe details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlannedMealAdd = async (planned: { id: string; date: string; recipeId: string; recipeName: string }) => {
    try {
      let details = await getRecipeById(planned.recipeId);
      if (!details) {
        const byName = await searchByName(planned.recipeName);
        if (byName && byName.length > 0) {
          details = await getRecipeById(byName[0].idMeal);
        }
      }
      if (!details) return;
      const weekId = generateWeekId(new Date(planned.date));
      const items: ShoppingListItem[] = details.ingredients
        .filter(i => i.ingredient.trim())
        .map(i => ({
          id: `${planned.id}-${i.ingredient}`,
          ingredient: i.ingredient,
          quantity: i.measure,
          checked: false,
          sourceMealIds: [planned.id],
        }));
      items.forEach(item => addShoppingItem(weekId, item));
    } catch {}
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      handleSearch();
    }
    // Handle arrow key navigation through suggestions
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      // Optional: implement arrow key navigation
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Show suggestions if there's input
    if (value.trim().length > 0) {
      const newSuggestions = getSuggestions(value, filterType);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const removeIngredient = (ing: string) => {
    const parts = parseIngredients(searchQuery).filter(p => p.toLowerCase() !== ing.toLowerCase());
    setSearchQuery(parts.join(', '));
  };

  const clearAllIngredients = () => {
    setSearchQuery('');
    setSimpleIdeas([]);
    setSuggestions([]);
  };

  const handleSuggestionClick = (suggestion: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    // If there's already text in search box, append the new suggestion
    if (filterType === 'ingredients') {
      const parts = searchQuery.split(',');
      const trimmedParts = parts.map(p => p.trim()).filter(Boolean);
      const lastIndex = parts.length - 1;
      const existing = new Set(trimmedParts.map(p => p.toLowerCase()));

      if (parts.length > 0) {
        const beforeLast = parts.slice(0, lastIndex).map(p => p.trim()).filter(Boolean);
        const lastToken = (parts[lastIndex] ?? '').trim();
        const lowerSuggestion = suggestion.toLowerCase();

        if (!existing.has(lowerSuggestion)) {
          if (lastToken && !existing.has(lastToken.toLowerCase())) {
            // Replace last partial token
            const newQuery = [...beforeLast, suggestion].join(', ');
            setSearchQuery(newQuery);
          } else {
            // Append new ingredient
            const newQuery = [...trimmedParts, suggestion].join(', ');
            setSearchQuery(newQuery);
          }
        }
      } else {
        setSearchQuery(suggestion);
      }
      setShowSuggestions(false);
      return; // Don't search yet, let them add more
    } else {
      // For mood and time, replace the query
      setSearchQuery(suggestion);
      setShowSuggestions(false);
      
      // Auto-search for mood and time
      setTimeout(() => {
        performSearch(suggestion);
      }, 50);
    }
  };

  const loadFavorites = () => {
    setViewMode('favorites');
    const favorites = getFavorites();
    setRecipes(favorites);
    setFavoritesCount(favorites.length);
  };

  useEffect(() => {
    // Update favorites count periodically
    const interval = setInterval(() => {
      setFavoritesCount(getFavorites().length);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={(dark ? 'dark ' : '') + 'min-h-screen bg-primary-300 dark:bg-gray-900'}>
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm border-b border-primary-400/30 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 sm:mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-accent-600 to-accent-700 p-3 rounded-xl shadow-lg">
                <ChefHat className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Tasty Thoughts</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Culinary ideas with what you already have</p>
              </div>
            </div>
            
            {/* Dark Mode Toggle */}
            <div className="flex justify-end mb-2 sm:mb-0">
              <button
                onClick={() => { setDark(d => { const nv = !d; try { localStorage.setItem('tt_dark', nv ? '1' : '0'); } catch{} return nv; }); }}
                className="px-3 py-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="Toggle dark mode"
              >
                {dark ? 'Light' : 'Dark'}
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="-mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="grid grid-cols-4 gap-1 sm:inline-flex sm:space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full">
              <button
                onClick={() => {
                  setViewMode('search');
                  setRecipes([]);
                  setSearchQuery('');
                }}
                className={`flex flex-col items-center justify-center space-y-1 text-xs sm:text-base px-2 py-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:py-2 rounded-lg transition-all flex-1 sm:flex-none ${
                  viewMode === 'search'
                    ? 'bg-white dark:bg-gray-900 shadow-md text-accent-700 dark:text-accent-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <Home className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="leading-none">Search</span>
              </button>
              <button
                onClick={loadFavorites}
                className={`flex flex-col items-center justify-center space-y-1 text-xs sm:text-base px-2 py-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:py-2 rounded-lg transition-all flex-1 sm:flex-none ${
                  viewMode === 'favorites'
                    ? 'bg-white dark:bg-gray-900 shadow-md text-accent-700 dark:text-accent-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="leading-none">Favorites</span>
                {favoritesCount > 0 && (
                  <span className="bg-accent-600 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full">
                    {favoritesCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setViewMode('planner')}
                className={`flex flex-col items-center justify-center space-y-1 text-xs sm:text-base px-2 py-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:py-2 rounded-lg transition-all flex-1 sm:flex-none ${
                  viewMode === 'planner'
                    ? 'bg-white dark:bg-gray-900 shadow-md text-accent-700 dark:text-accent-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="leading-none">Planner</span>
              </button>
              <button
                onClick={() => setViewMode('shopping')}
                className={`flex flex-col items-center justify-center space-y-1 text-xs sm:text-base px-2 py-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:px-4 sm:py-2 rounded-lg transition-all flex-1 sm:flex-none ${
                  viewMode === 'shopping'
                    ? 'bg-white dark:bg-gray-900 shadow-md text-accent-700 dark:text-accent-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <ListChecks className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="leading-none">Shopping</span>
              </button>
            </div>
          </div>
        </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Favorites View */}
        {viewMode === 'favorites' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Your Favorites</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {recipes.length === 0 
                    ? 'You haven\'t saved any favorites yet. Search for recipes and click the ❤️ icon to save them!'
                    : `You have ${recipes.length} saved recipe${recipes.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Planner View */}
        {viewMode === 'planner' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 mb-8">
            <MealPlanner onAddToShoppingList={(p) => handlePlannedMealAdd(p)} />
          </div>
        )}

        {/* Shopping List View */}
        {viewMode === 'shopping' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 mb-8">
            <ShoppingList />
          </div>
        )}

        {/* Search Section - Only show in search mode */}
        {viewMode === 'search' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              What do you want to cook today?
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Tell me what ingredients you have, what you're craving, or how much time you have.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { type: 'ingredients' as FilterType, icon: Utensils, label: 'By Ingredients' },
              { type: 'mood' as FilterType, icon: Flame, label: 'Mood & Cravings' },
              { type: 'time' as FilterType, icon: Timer, label: 'Time Available' },
              ].map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type);
                  setShowSuggestions(false);
                  // Update suggestions for new filter type
                  if (searchQuery.trim().length > 0) {
                    const newSuggestions = getSuggestions(searchQuery, type);
                    setSuggestions(newSuggestions);
                    setShowSuggestions(newSuggestions.length > 0);
                  }
                }}
                className={`flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
                  filterType === type
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-semibold">{label}</span>
              </button>
            ))}
          </div>

          {/* Quick Time Chips */}
          {filterType === 'time' && (
            <div className="flex items-center flex-wrap gap-2 mb-4">
              {[10, 20, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={async () => {
                    const label = `${m} minutes`;
                    setSearchQuery(label);
                    await performSearch(label);
                  }}
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                >
                  ≤ {m} min
                </button>
              ))}
            </div>
          )}

          {/* Ingredient options */}
          {filterType === 'ingredients' && (
            <div className="flex items-center gap-3 mb-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={onlyMyIngredients}
                  onChange={e => setOnlyMyIngredients(e.target.checked)}
                />
                Only show recipes using my ingredients
              </label>
            </div>
          )}

          {/* Search Input */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  if (searchQuery.trim().length > 0 && suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={(e) => {
                  // Only hide if clicking outside the dropdown
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  if (!relatedTarget?.closest('.suggestions-dropdown')) {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }
                }}
                placeholder={
                  filterType === 'ingredients'
                    ? 'Enter ingredients (e.g., "chicken, tomatoes")'
                    : filterType === 'mood'
                    ? 'What are you craving? (e.g., "spicy", "comfort food")'
                    : 'How much time do you have? (e.g., "quick", "30 minutes")'
                }
                className="w-full pl-12 pr-4 py-4 border-2 border-primary-400/40 dark:border-gray-700 rounded-xl focus:border-accent-500 focus:outline-none text-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
              />

              {/* Selected ingredient chips */}
              {filterType === 'ingredients' && parseIngredients(searchQuery).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {parseIngredients(searchQuery).map((ing) => (
                    <span key={ing} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary-500 text-white">
                      {ing}
                      <button
                        type="button"
                        className="ml-1 text-white/80 hover:text-white"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => removeIngredient(ing)}
                        aria-label={`Remove ${ing}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    className="text-xs underline text-gray-600 dark:text-gray-300"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={clearAllIngredients}
                  >
                    Clear all
                  </button>
                </div>
              )}
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-64 overflow-y-auto suggestions-dropdown">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSuggestionClick(suggestion, e);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSuggestionClick(suggestion, e);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center space-x-2 cursor-pointer"
                    >
                      <Search className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-200 font-medium">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <TrendingUp className="h-5 w-5" />
              )}
              <span>Search</span>
            </button>
          </div>

          {/* Suggestions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="text-sm text-gray-600 font-semibold">Quick search:</span>
            {[
              'chicken',
              'pasta',
              'beef',
              'vegetarian',
              'dessert',
              'seafood',
            ].map((tag) => (
              <button
                key={tag}
                onClick={async () => {
                  setSearchQuery(tag);
                  // Use tag directly in the search
                  await performSearch(tag);
                }}
                className="px-4 py-2 bg-white text-accent-700 border border-accent-200 rounded-full text-sm font-medium hover:bg-accent-50 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
          </div>
        )}

        {/* Simple Ideas for 1–2 ingredients */}
        {simpleIdeas.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Quick ideas with what you have</h3>
            <p className="text-gray-600 mb-4">These can be made using only your listed ingredients:</p>
            <div className="flex flex-wrap gap-2">
              {simpleIdeas.map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickIdeaClick(idea)}
                  className="px-3 py-1 bg-accent-500 text-white rounded-full text-sm font-medium hover:bg-accent-600 transition-colors"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {recipes.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Found {recipes.length} Recipe{recipes.length !== 1 ? 's' : ''}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.idMeal}
                  recipe={recipe}
                  onClick={() => handleRecipeClick(recipe)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && recipes.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              No recipes found. Try a different search!
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Finding recipes…</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
                  <div className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 w-3/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="h-4 w-1/3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}

export default App;
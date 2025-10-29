import { useState, useEffect } from 'react';
import { Search, ChefHat, Sparkles, Clock, TrendingUp, Loader2, Heart as HeartIcon, Home, CalendarDays, ListChecks } from 'lucide-react';
import { Recipe, RecipeDetail } from './types/recipe';
import { searchByIngredient, searchByName, getRecipeById } from './services/mealDB';
import RecipeCard from './components/RecipeCard';
import MealPlanner from './components/MealPlanner';
import ShoppingList from './components/ShoppingList';
import RecipeModal from './components/RecipeModal';
import { getFavorites } from './utils/favorites';
import { getMoodSearchTerms, parseTimeInput, parseIngredients } from './utils/searchFilters';
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

  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setError(null);

    setIsLoading(true);
    setRecipes([]); // Clear previous results
    
    try {
      let results: Recipe[] = [];
      
      // Based on filter type, decide which search to use
      if (filterType === 'ingredients') {
        // Parse multiple ingredients
        const ingredients = parseIngredients(query);
        
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
          
          // Filter recipes that contain ALL specified ingredients
          results = results.filter(r => {
            if (!r) return false;
            const recipeIngredients = r.ingredients.map(ing => ing.ingredient.toLowerCase());
            
            return ingredients.every(searchIng => {
              const searchLower = searchIng.toLowerCase();
              return recipeIngredients.some(ri => 
                ri.includes(searchLower) || searchLower.includes(ri)
              );
            });
          }).map(r => {
            const { ingredients: _, ...rest } = r!;
            return rest;
          });
          
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
        // Time-based search
        const maxTime = parseTimeInput(query);
        console.log('Time filter: max', maxTime, 'minutes');
        
        // If we have a time limit, search by categories that are typically quick
        if (maxTime && maxTime <= 30) {
          // For quick recipes, search common fast meal categories
          const quickSearches = ['pasta', 'salad', 'sandwich', 'quick', 'easy', 'simple'];
          for (const term of quickSearches) {
            const termResults = await searchByName(term);
            results = [...results, ...termResults];
          }
        } else {
          // Search by any query terms
          results = await searchByName(query);
        }
        
        // Remove duplicates
        const seen = new Set();
        results = results.filter(r => {
          if (seen.has(r.idMeal)) return false;
          seen.add(r.idMeal);
          return true;
        });
        
        // If we have a time limit, filter by estimated time
        if (maxTime) {
          console.log(`Filtering ${results.length} recipes by time (≤${maxTime} min)`);
          const detailedResults = await Promise.all(
            results.slice(0, 30).map(async (recipe) => {
              try {
                const details = await getRecipeById(recipe.idMeal);
                if (details && details.estimatedTime && details.estimatedTime <= maxTime) {
                  const { ingredients: _, ...rest } = details;
                  return rest;
                }
                return null;
              } catch {
                return null;
              }
            })
          );
          
          results = detailedResults.filter(Boolean) as Recipe[];
          console.log(`Found ${results.length} recipes under ${maxTime} minutes`);
        }
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

  const handleSuggestionClick = (suggestion: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    // If there's already text in search box, append the new suggestion
    if (filterType === 'ingredients') {
      if (searchQuery.trim().length > 0 && !searchQuery.includes(suggestion)) {
        // Append with comma if not already in the list
        const currentIngredients = searchQuery.split(',').map(i => i.trim());
        if (!currentIngredients.includes(suggestion)) {
          setSearchQuery(searchQuery + ', ' + suggestion);
          setShowSuggestions(false);
          return; // Don't search yet, let them add more
        }
      } else {
        // First ingredient or same ingredient - just set it
        setSearchQuery(suggestion);
        setShowSuggestions(false);
      }
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
    <div className="min-h-screen bg-gradient-to-br from-saffron-100 via-white to-saffron-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-saffron-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 sm:mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
                <ChefHat className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Smart Recipe Assistant</h1>
                <p className="text-xs sm:text-sm text-gray-600">Find your perfect recipe, tailored to you</p>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="inline-flex space-x-2 bg-gray-100 p-1 rounded-xl min-w-full sm:min-w-0">
              <button
                onClick={() => {
                  setViewMode('search');
                  setRecipes([]);
                  setSearchQuery('');
                }}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap flex-1 sm:flex-none ${
                  viewMode === 'search'
                    ? 'bg-white shadow-md text-saffron-700 font-semibold'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Search</span>
              </button>
              <button
                onClick={loadFavorites}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap flex-1 sm:flex-none ${
                  viewMode === 'favorites'
                    ? 'bg-white shadow-md text-saffron-700 font-semibold'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <HeartIcon className="h-5 w-5" />
                <span>Favorites</span>
                {favoritesCount > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {favoritesCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setViewMode('planner')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap flex-1 sm:flex-none ${
                  viewMode === 'planner'
                    ? 'bg-white shadow-md text-saffron-700 font-semibold'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <CalendarDays className="h-5 w-5" />
                <span>Planner</span>
              </button>
              <button
                onClick={() => setViewMode('shopping')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap flex-1 sm:flex-none ${
                  viewMode === 'shopping'
                    ? 'bg-white shadow-md text-saffron-700 font-semibold'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ListChecks className="h-5 w-5" />
                <span>Shopping</span>
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
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Favorites</h2>
                <p className="text-gray-600">
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
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-8">
            <MealPlanner onAddToShoppingList={(p) => handlePlannedMealAdd(p)} />
          </div>
        )}

        {/* Shopping List View */}
        {viewMode === 'shopping' && (
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-8">
            <ShoppingList />
          </div>
        )}

        {/* Search Section - Only show in search mode */}
        {viewMode === 'search' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              What do you want to cook today?
            </h2>
            <p className="text-gray-600">
              Tell me what ingredients you have, what you're craving, or how much time you have.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { type: 'ingredients' as FilterType, icon: Search, label: 'By Ingredients' },
              { type: 'mood' as FilterType, icon: Sparkles, label: 'Mood & Cravings' },
              { type: 'time' as FilterType, icon: Clock, label: 'Time Available' },
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
                    ? 'bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-semibold">{label}</span>
              </button>
            ))}
          </div>

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
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-saffron-500 focus:outline-none text-lg"
              />
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto suggestions-dropdown">
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
                      className="w-full text-left px-4 py-3 hover:bg-saffron-100 transition-colors border-b border-gray-100 last:border-b-0 flex items-center space-x-2 cursor-pointer"
                    >
                      <Search className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 font-medium">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-gradient-to-r from-saffron-500 to-saffron-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
                className="px-4 py-2 bg-saffron-200 text-saffron-800 rounded-full text-sm font-medium hover:bg-saffron-300 transition-colors"
              >
                {tag}
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
        {isLoading && recipes.length === 0 && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-saffron-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 text-lg">Finding delicious recipes...</p>
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
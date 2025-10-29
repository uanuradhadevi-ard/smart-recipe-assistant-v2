/**
 * Common ingredients and search terms for autocomplete suggestions
 */

export const commonIngredients = [
  // Vegetables
  'tomato', 'onion', 'garlic', 'pepper', 'bell pepper', 'carrot', 'celery',
  'potato', 'sweet potato', 'spinach', 'lettuce', 'cabbage', 'broccoli',
  'cauliflower', 'zucchini', 'eggplant', 'cucumber', 'mushroom',
  
  // Meats
  'chicken', 'beef', 'pork', 'lamb', 'turkey', 'sausage',
  
  // Seafood
  'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster',
  
  // Dairy
  'cheese', 'milk', 'butter', 'cream', 'yogurt', 'cream cheese',
  
  // Grains & Pasta
  'rice', 'pasta', 'bread', 'flour', 'quinoa', 'oatmeal',
  
  // Legumes
  'bean', 'black bean', 'chickpea', 'lentil', 'kidney bean',
  
  // Fruits
  'apple', 'banana', 'orange', 'lemon', 'lime', 'berry',
  
  // Nuts & Seeds
  'almond', 'walnut', 'peanut', 'sesame seed',
  
  // Herbs & Spices
  'basil', 'oregano', 'thyme', 'rosemary', 'parsley', 'cilantro',
  'ginger', 'curry', 'cumin', 'paprika', 'cinnamon',
  
  // Other common ingredients
  'egg', 'oil', 'olive oil', 'vinegar', 'soy sauce', 'honey',
  'chocolate', 'sugar', 'salt', 'pepper', 'black pepper',
];

export const moodSuggestions = [
  // Descriptors
  'spicy', 'sweet', 'savory', 'hot', 'cold', 'fresh', 'light', 'hearty',
  // Mood words
  'comfort food', 'comforting', 'delicious', 'healthy', 'nutritious',
  'quick', 'easy', 'simple', 'fast', 'gourmet', 'fancy', 'classic',
  'traditional', 'modern', 'exotic', 'homemade', 'rustic',
  // Cuisines
  'italian', 'mexican', 'asian', 'chinese', 'japanese', 'indian',
  'thai', 'greek', 'french', 'american', 'mediterranean',
  // Diet types
  'vegetarian', 'vegan', 'protein', 'low carb', 'keto', 'gluten-free',
  // Dish types
  'breakfast', 'lunch', 'dinner', 'dessert', 'appetizer', 'main course',
  'side dish', 'snack', 'drink',
  // Textures & Tastes
  'crispy', 'creamy', 'cheesy', 'smooth', 'crunchy', 'tender',
  'tart', 'sour', 'bitter', 'tangy',
  // Other
  'seafood', 'meat', 'chicken', 'beef', 'pork', 'fish',
];

export const timeSuggestions = [
  // Quick options
  'quick', 'fast', 'speedy', 'in a hurry', 'rush', 'express',
  // Time durations
  '15 minutes', '20 minutes', '30 minutes', '45 minutes',
  '1 hour', 'under 1 hour', 'under 2 hours', '2 hours',
  // Simple/easy
  'simple', 'easy', 'basic', 'no-fuss', 'straightforward',
  // Other
  'instant', 'immediate', 'just now', 'anytime',
];

/**
 * Filters suggestions based on user input
 */
export function getSuggestions(
  input: string,
  filterType: 'ingredients' | 'mood' | 'time'
): string[] {
  // For ingredients, suggest based on the last token after a comma
  const normalized = (() => {
    if (filterType !== 'ingredients') return input.toLowerCase().trim();
    const parts = input.split(',');
    const last = parts[parts.length - 1] ?? '';
    return last.toLowerCase().trim();
  })();
  
  if (normalized.length < 1) return [];
  
  let suggestions: string[];
  
  if (filterType === 'ingredients') {
    suggestions = commonIngredients;
  } else if (filterType === 'mood') {
    suggestions = moodSuggestions;
  } else {
    suggestions = timeSuggestions;
  }
  
  // Filter suggestions that start with or contain the input
  const filtered = suggestions.filter(item => 
    item.toLowerCase().includes(normalized) ||
    normalized.includes(item.toLowerCase().split(' ')[0]) ||
    fuzzyMatch(item, normalized)
  );
  
  // Remove duplicates and sort by relevance
  const unique = Array.from(new Set(filtered));
  
  // Prioritize exact matches and starts-with matches
  return unique
    .sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      
      // Exact match first
      if (aLower === normalized) return -1;
      if (bLower === normalized) return 1;
      
      // Starts with next
      if (aLower.startsWith(normalized)) return -1;
      if (bLower.startsWith(normalized)) return 1;
      
      // Then by position
      const aIndex = aLower.indexOf(normalized);
      const bIndex = bLower.indexOf(normalized);
      if (aIndex !== bIndex) return aIndex - bIndex;
      
      // Then alphabetically
      return a.localeCompare(b);
    })
    .slice(0, 8); // Return top 8 suggestions
}

/**
 * Simple fuzzy matching - checks if strings are similar
 */
function fuzzyMatch(str1: string, str2: string): boolean {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Check if all characters of search are in the string
  let searchIndex = 0;
  for (let i = 0; i < s1.length && searchIndex < s2.length; i++) {
    if (s1[i] === s2[searchIndex]) {
      searchIndex++;
    }
  }
  
  // If we matched most of the search string
  return searchIndex >= s2.length * 0.7;
}


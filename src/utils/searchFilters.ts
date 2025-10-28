/**
 * Maps mood/craving keywords to ingredients and categories for intelligent filtering
 */
export const moodKeywordMap: Record<string, string[]> = {
  // Spicy moods
  'spicy': ['pepper', 'chili', 'spicy', 'hot', 'jalapeño', 'cayenne', 'curry'],
  'hot': ['pepper', 'chili', 'hot'],
  'spice': ['pepper', 'chili', 'spicy'],
  
  // Comfort food
  'comfort': ['bread', 'rice', 'pasta', 'potato', 'cheese'],
  'comfort food': ['bread', 'rice', 'pasta', 'potato', 'cheese'],
  
  // Healthy
  'healthy': ['salad', 'vegetable', 'fruit', 'quinoa', 'green'],
  'light': ['salad', 'vegetable', 'fruit'],
  'fresh': ['salad', 'vegetable', 'fruit', 'cucumber'],
  
  // Sweet
  'sweet': ['sugar', 'honey', 'chocolate', 'cake', 'dessert'],
  'dessert': ['sugar', 'chocolate', 'cake', 'dessert', 'cookie'],
  
  // Italian
  'italian': ['pasta', 'tomato', 'basil', 'mozzarella', 'olive'],
  
  // Asian
  'asian': ['soy', 'rice', 'ginger', 'sesame'],
  'chinese': ['soy', 'rice', 'ginger'],
  'japanese': ['soy', 'rice', 'fish'],
  
  // Mexican
  'mexican': ['bean', 'tomato', 'pepper', 'corn'],
  
  // Hearty/Protein
  'hearty': ['beef', 'lamb', 'potato', 'meat'],
  'protein': ['chicken', 'beef', 'fish', 'egg', 'tofu'],
  
  // Vegetarian
  'vegetarian': ['vegetable', 'bean', 'tofu', 'grain'],
  'veggie': ['vegetable', 'bean'],
  
  // Seafood
  'seafood': ['fish', 'shrimp', 'crab', 'salmon'],
  'fish': ['fish', 'salmon', 'tuna'],
  
  // Breakfast
  'breakfast': ['egg', 'bacon', 'toast', 'pancake'],
  'morning': ['egg', 'bacon', 'toast'],
  
  // Quick/Easy
  'quick': ['quick', 'simple', 'easy'],
  'fast': ['quick', 'simple'],
  'easy': ['simple', 'basic'],
};

/**
 * Parses time input and returns maximum minutes allowed
 */
export function parseTimeInput(input: string): number | null {
  const normalized = input.toLowerCase().trim();
  
  // Exact times (e.g., "30 minutes", "1 hour")
  const exactMatch = normalized.match(/(\d+)\s*(min|minute|hour|hr)/);
  if (exactMatch) {
    const value = parseInt(exactMatch[1]);
    const unit = exactMatch[2];
    if (unit.includes('hour') || unit.includes('hr')) {
      return value * 60;
    }
    return value;
  }
  
  // Quick/fast keywords
  if (normalized.includes('quick') || normalized.includes('fast') || normalized.includes('speed')) {
    return 30;
  }
  
  if (normalized.includes('under 30') || normalized.includes('30 minutes')) {
    return 30;
  }
  
  if (normalized.includes('under 1 hour') || normalized.includes('1 hour')) {
    return 60;
  }
  
  if (normalized.includes('under 2 hours') || normalized.includes('2 hours')) {
    return 120;
  }
  
  // Default for "quick" vibe
  if (normalized.length < 10 && (normalized.includes('quick') || normalized.includes('fast'))) {
    return 30;
  }
  
  return null;
}

/**
 * Gets search terms for mood filtering
 */
export function getMoodSearchTerms(mood: string): string[] {
  const normalized = mood.toLowerCase().trim();
  
  // Direct matches
  if (moodKeywordMap[normalized]) {
    return moodKeywordMap[normalized];
  }
  
  // Partial matches
  for (const [key, terms] of Object.entries(moodKeywordMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return terms;
    }
  }
  
  // Return original if no match
  return [mood];
}

/**
 * Parses multiple ingredients from comma-separated string
 */
export function parseIngredients(input: string): string[] {
  return input
    .split(/[,]+/)
    .map(i => i.trim())
    .filter(i => i.length > 0);
}

/**
 * Checks if recipe contains all required ingredients
 */
export function recipeContainsIngredients(recipeIngredients: string[], searchIngredients: string[]): boolean {
  const recipeLower = recipeIngredients.map(i => i.toLowerCase());
  
  for (const ingredient of searchIngredients) {
    const ingredientLower = ingredient.toLowerCase();
    const found = recipeLower.some(ri => 
      ri.includes(ingredientLower) || ingredientLower.includes(ri)
    );
    if (!found) {
      return false;
    }
  }
  
  return true;
}


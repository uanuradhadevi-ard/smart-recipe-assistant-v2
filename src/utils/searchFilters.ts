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

  // Bare number means minutes (e.g., "17")
  const bareNumber = normalized.match(/^(\d{1,3})$/);
  if (bareNumber) {
    return parseInt(bareNumber[1]);
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
 * Rounds minutes to the nearest 5-minute boundary (min 5, max 60)
 */
export function roundToNearestFive(minutes: number): number {
  if (!Number.isFinite(minutes)) return 60;
  const clamped = Math.max(1, Math.min(minutes, 60));
  const rounded = Math.round(clamped / 5) * 5;
  const bounded = Math.max(5, Math.min(rounded, 60));
  return bounded;
}

/**
 * Builds an ordered list of 5-minute buckets to try, starting from the nearest,
 * then alternating +5/-5 within [5, 60].
 */
export function buildTimeBuckets(targetMinutes: number): number[] {
  const start = roundToNearestFive(targetMinutes);
  const buckets: number[] = [start];
  let offset = 5;
  while (true) {
    const up = start + offset;
    const down = start - offset;
    let pushed = false;
    if (up <= 60) { buckets.push(up); pushed = true; }
    if (down >= 5) { buckets.push(down); pushed = true; }
    if (!pushed) break;
    offset += 5;
  }
  // Ensure unique and bounded
  const seen = new Set<number>();
  return buckets.filter(b => {
    if (seen.has(b)) return false;
    seen.add(b);
    return true;
  });
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
 * Normalizes ingredient names using common aliases to improve matching
 */
export function normalizeIngredient(name: string): string {
  const n = name.toLowerCase().trim();
  const map: Record<string, string> = {
    'chilli': 'chili',
    'green chilli': 'chili',
    'green chili': 'chili',
    'red chilli': 'chili',
    'red chili': 'chili',
    'capsicum': 'bell pepper',
    'bell pepper': 'bell pepper',
    'brinjal': 'eggplant',
    'aubergine': 'eggplant',
    'ladies finger': 'okra',
    'ladyfinger': 'okra',
    'bhindi': 'okra',
    'coriander': 'cilantro',
    'curd': 'yogurt',
    'maize': 'corn',
    'spring onion': 'green onion',
    'scallion': 'green onion',
    'garbanzo': 'chickpea',
    'gram': 'chickpea',
    'kidney beans': 'rajma',
  };
  // direct map
  if (map[n]) return map[n];
  // pattern-based
  if (n.includes('chilli')) return 'chili';
  if (n.includes('capsicum')) return 'bell pepper';
  if (n.includes('brinjal') || n.includes('aubergine')) return 'eggplant';
  if (n.includes('ladies finger') || n.includes('ladyfinger') || n.includes('bhindi')) return 'okra';
  if (n.includes('scallion') || n.includes('spring onion')) return 'green onion';
  if (n.includes('garbanzo')) return 'chickpea';
  return n;
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


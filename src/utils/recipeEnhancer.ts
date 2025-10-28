import { RecipeDetail } from '../types/recipe';

/**
 * Estimates cooking time based on number of ingredients and instructions length
 */
function estimateCookingTime(recipe: any): number {
  const ingredientCount = recipe.ingredients?.length || 0;
  const instructionsLength = recipe.strInstructions?.length || 0;
  
  // Base time of 15 minutes
  let time = 15;
  
  // Add time based on ingredient count
  time += ingredientCount * 2;
  
  // Add time based on instruction complexity
  const instructionSteps = instructionsLength / 100;
  time += instructionSteps * 5;
  
  // Cap at reasonable maximum
  return Math.min(time, 120);
}

/**
 * Estimates serving size based on ingredients
 */
function estimateServingSize(recipe: any): number {
  const ingredientCount = recipe.ingredients?.length || 0;
  
  // Base serving size of 2
  let servings = 2;
  
  // Add servings based on ingredient count
  if (ingredientCount > 8) servings = 6;
  else if (ingredientCount > 5) servings = 4;
  
  return servings;
}

/**
 * Determines difficulty based on ingredient count and instructions
 */
function estimateDifficulty(recipe: any): 'Easy' | 'Medium' | 'Hard' {
  const ingredientCount = recipe.ingredients?.length || 0;
  const instructionSteps = (recipe.strInstructions?.length || 0) / 100;
  
  const complexity = ingredientCount * 2 + instructionSteps;
  
  if (complexity < 15) return 'Easy';
  if (complexity < 30) return 'Medium';
  return 'Hard';
}

/**
 * Estimates cost based on ingredient types
 */
function estimateCost(recipe: RecipeDetail): string {
  const ingredients = recipe.ingredients.map(i => i.ingredient.toLowerCase());
  
  let baseCost = 0;
  
  // Add cost for expensive ingredients
  const expensiveIngredients = ['beef', 'lamb', 'duck', 'salmon', 'truffle', 'lobster', 'crab'];
  expensiveIngredients.forEach(ing => {
    if (ingredients.some(i => i.includes(ing))) {
      baseCost += 8;
    }
  });
  
  // Add cost for medium ingredients
  const mediumIngredients = ['chicken', 'pork', 'fish', 'cheese', 'wine', 'butter', 'cream'];
  mediumIngredients.forEach(ing => {
    if (ingredients.some(i => i.includes(ing))) {
      baseCost += 3;
    }
  });
  
  // Add base cost
  baseCost += 5;
  
  if (baseCost < 10) return '$';
  if (baseCost < 20) return '$$';
  return '$$$';
}

/**
 * Generates cooking tips based on recipe characteristics
 */
function generateCookingTips(recipe: RecipeDetail): string[] {
  const tips: string[] = [];
  const ingredients = recipe.ingredients.map(i => i.ingredient.toLowerCase());
  const instructions = recipe.strInstructions?.toLowerCase() || '';
  
  // Check for common cooking methods
  if (instructions.includes('marinate') || instructions.includes('season')) {
    tips.push('Allow time for marinating - it enhances flavor significantly');
  }
  
  if (instructions.includes('bake') || instructions.includes('oven')) {
    tips.push('Preheat the oven before cooking for best results');
  }
  
  if (instructions.includes('stir-fry') || instructions.includes('wok')) {
    tips.push('Keep your pan or wok hot for perfect stir-frying');
  }
  
  if (ingredients.some(i => i.includes('onion') || i.includes('garlic'))) {
    tips.push('Don\'t rush sautéing onions and garlic - caramelization adds depth');
  }
  
  if (ingredients.some(i => i.includes('salt') || i.includes('pepper'))) {
    tips.push('Season throughout the cooking process, not just at the end');
  }
  
  if (instructions.includes('boil') || instructions.includes('simmer')) {
    tips.push('Bring to a boil then reduce to a simmer for gentle cooking');
  }
  
  // Add general tip if we don't have many specific ones
  if (tips.length === 0) {
    tips.push('Read through the full recipe before starting to cook');
    tips.push('Prepare all ingredients before you begin (mise en place)');
  }
  
  return tips;
}

/**
 * Estimates nutritional information
 */
function estimateNutritionalInfo(recipe: RecipeDetail): any {
  const ingredients = recipe.ingredients.map(i => i.ingredient.toLowerCase());
  let calories = 300; // Base calories
  let protein = '10g';
  let carbs = '30g';
  let fat = '12g';
  
  // Add calories based on ingredients
  const proteinSources = ['chicken', 'beef', 'pork', 'fish', 'egg', 'cheese', 'beans'];
  const carbSources = ['rice', 'pasta', 'bread', 'flour', 'potato', 'sugar'];
  const fatSources = ['butter', 'oil', 'cream', 'cheese', 'nuts', 'avocado'];
  
  let proteinCount = ingredients.filter(i => proteinSources.some(p => i.includes(p))).length;
  let carbCount = ingredients.filter(i => carbSources.some(c => i.includes(c))).length;
  let fatCount = ingredients.filter(i => fatSources.some(f => i.includes(f))).length;
  
  calories += proteinCount * 80 + carbCount * 60 + fatCount * 120;
  protein = `${10 + proteinCount * 8}g`;
  carbs = `${30 + carbCount * 20}g`;
  fat = `${12 + fatCount * 8}g`;
  
  return { calories, protein, carbs, fat };
}

/**
 * Main function to enrich recipe details
 */
export function enrichRecipeData(recipe: RecipeDetail): RecipeDetail {
  return {
    ...recipe,
    estimatedTime: estimateCookingTime(recipe),
    servingSize: estimateServingSize(recipe),
    difficulty: estimateDifficulty(recipe),
    estimatedCost: estimateCost(recipe),
    cookingTips: generateCookingTips(recipe),
    nutritionalInfo: estimateNutritionalInfo(recipe),
  };
}


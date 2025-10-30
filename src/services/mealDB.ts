import { Recipe, RecipeDetail, MealDBResponse } from '../types/recipe';
import { enrichRecipeData } from '../utils/recipeEnhancer';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// Simple in-memory cache to avoid repeated detail fetches
const detailCache = new Map<string, RecipeDetail>();

export async function searchByIngredient(ingredient: string): Promise<Recipe[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`
    );
    const data: MealDBResponse = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
}

export async function getRecipeById(id: string): Promise<RecipeDetail | null> {
  try {
    if (detailCache.has(id)) {
      return detailCache.get(id)!;
    }
    const response = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
    const data: MealDBResponse = await response.json();
    
    if (!data.meals || data.meals.length === 0) return null;
    
    const meal = data.meals[0];
    
    // Parse ingredients and measures
    const ingredients: Array<{ ingredient: string; measure: string }> = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}` as keyof typeof meal];
      const measure = meal[`strMeasure${i}` as keyof typeof meal];
      
      if (ingredient && ingredient.trim()) {
        ingredients.push({ ingredient, measure: measure || '' });
      }
    }
    
    const baseRecipe: RecipeDetail = {
      idMeal: meal.idMeal,
      strMeal: meal.strMeal,
      strMealThumb: meal.strMealThumb,
      strCategory: meal.strCategory,
      strArea: meal.strArea,
      strInstructions: meal.strInstructions,
      strTags: meal.strTags,
      strYoutube: meal.strYoutube,
      strSource: meal.strSource,
      ingredients,
    };
    
    // Enrich with additional data
    const enriched = enrichRecipeData(baseRecipe);
    detailCache.set(id, enriched);
    return enriched;
  } catch (error) {
    console.error('Error fetching recipe details:', error);
    return null;
  }
}

export async function searchByName(name: string): Promise<Recipe[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/search.php?s=${encodeURIComponent(name)}`
    );
    const data: MealDBResponse = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error('Error searching recipes:', error);
    return [];
  }
}

import { Recipe } from '../types/recipe';

const FAVORITES_KEY = 'recipe-assistant-favorites';

export function getFavorites(): Recipe[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
}

export function saveFavorites(favorites: Recipe[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorites:', error);
  }
}

export function addFavorite(recipe: Recipe): void {
  const favorites = getFavorites();
  const isAlreadyFavorite = favorites.some(fav => fav.idMeal === recipe.idMeal);
  
  if (!isAlreadyFavorite) {
    favorites.push(recipe);
    saveFavorites(favorites);
  }
}

export function removeFavorite(recipeId: string): void {
  const favorites = getFavorites();
  const updated = favorites.filter(fav => fav.idMeal !== recipeId);
  saveFavorites(updated);
}

export function isFavorite(recipeId: string): boolean {
  const favorites = getFavorites();
  return favorites.some(fav => fav.idMeal === recipeId);
}

export function toggleFavorite(recipe: Recipe): boolean {
  const isCurrentlyFavorite = isFavorite(recipe.idMeal);
  
  if (isCurrentlyFavorite) {
    removeFavorite(recipe.idMeal);
    return false;
  } else {
    addFavorite(recipe);
    return true;
  }
}


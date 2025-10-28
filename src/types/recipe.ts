export interface Recipe {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory?: string;
  strArea?: string;
}

export interface RecipeDetail extends Recipe {
  strInstructions: string;
  strTags?: string;
  strYoutube?: string;
  strSource?: string;
  ingredients: Array<{ ingredient: string; measure: string }>;
  // Enhanced fields
  estimatedTime?: number; // in minutes
  servingSize?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  estimatedCost?: string;
  cookingTips?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
}

export interface MealDBResponse {
  meals: Recipe[] | null;
}

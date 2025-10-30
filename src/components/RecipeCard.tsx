import { Recipe } from '../types/recipe';
import { MapPin, ChevronRight, Heart, Tag } from 'lucide-react';
import { isFavorite, toggleFavorite } from '../utils/favorites';
import { useState } from 'react';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const [isFav, setIsFav] = useState(isFavorite(recipe.idMeal));

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const newFavState = toggleFavorite(recipe);
    setIsFav(newFavState);
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border border-primary-400/30 dark:border-gray-700 hover:border-accent-400"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={recipe.strMealThumb}
          alt={recipe.strMeal}
          className="w-full h-full object-cover"
        />
        {recipe.strCategory && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-accent-700 shadow-md">
              <Tag className="h-3 w-3" />
              {recipe.strCategory}
            </span>
          </div>
        )}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all transform hover:scale-110 ${
            isFav
              ? 'bg-red-500 text-white'
              : 'bg-white/95 backdrop-blur-sm text-gray-600 hover:bg-red-50'
          }`}
        >
          <Heart className={`h-5 w-5 ${isFav ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
          {recipe.strMeal}
        </h3>
        {recipe.strArea && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{recipe.strArea} Cuisine</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-sm font-medium text-accent-600">View Recipe</span>
          <ChevronRight className="h-5 w-5 text-accent-600" />
        </div>
      </div>
    </div>
  );
}

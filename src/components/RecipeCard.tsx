import { Recipe } from '../types/recipe';
import { Clock, Users, ChevronRight, Heart } from 'lucide-react';
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
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={recipe.strMealThumb}
          alt={recipe.strMeal}
          className="w-full h-full object-cover"
        />
        {recipe.strCategory && (
          <div className="absolute top-3 left-3">
            <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-orange-600 shadow-md">
              {recipe.strCategory}
            </span>
          </div>
        )}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all ${
            isFav
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-600 hover:bg-red-50'
          }`}
        >
          <Heart className={`h-5 w-5 ${isFav ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
          {recipe.strMeal}
        </h3>
        {recipe.strArea && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <Users className="h-4 w-4 mr-1" />
            <span>{recipe.strArea}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>Recipe Details</span>
          </div>
          <ChevronRight className="h-5 w-5 text-orange-500" />
        </div>
      </div>
    </div>
  );
}

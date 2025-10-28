import { X, Clock, ChefHat, Youtube, ExternalLink, Users, DollarSign, AlertCircle, Star, Sparkles as SparklesIcon, Flame } from 'lucide-react';
import { RecipeDetail } from '../types/recipe';

interface RecipeModalProps {
  recipe: RecipeDetail;
  onClose: () => void;
}

export default function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">{recipe.strMeal}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Image */}
          <div className="rounded-xl overflow-hidden mb-6 shadow-lg">
            <img
              src={recipe.strMealThumb}
              alt={recipe.strMeal}
              className="w-full h-64 object-cover"
            />
          </div>

          {/* Enhanced Recipe Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {recipe.estimatedTime && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-xs font-semibold text-blue-700 uppercase">Time</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{recipe.estimatedTime} min</div>
              </div>
            )}
            {recipe.servingSize && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center mb-2">
                  <Users className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-xs font-semibold text-green-700 uppercase">Serves</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{recipe.servingSize}</div>
              </div>
            )}
            {recipe.difficulty && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center mb-2">
                  <Star className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-xs font-semibold text-purple-700 uppercase">Difficulty</span>
                </div>
                <div className="text-xl font-bold text-purple-900">{recipe.difficulty}</div>
              </div>
            )}
            {recipe.estimatedCost && (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="text-xs font-semibold text-orange-700 uppercase">Cost</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">{recipe.estimatedCost}</div>
              </div>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 mb-6">
            {recipe.strCategory && (
              <div className="flex items-center text-sm text-gray-600">
                <ChefHat className="h-4 w-4 mr-2 text-orange-500" />
                <span className="font-medium">{recipe.strCategory}</span>
              </div>
            )}
            {recipe.strArea && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">{recipe.strArea} Cuisine</span>
              </div>
            )}
          </div>

          {/* Nutritional Information */}
          {recipe.nutritionalInfo && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Flame className="h-6 w-6 mr-2 text-orange-500" />
                Nutritional Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recipe.nutritionalInfo.calories && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{recipe.nutritionalInfo.calories}</div>
                    <div className="text-sm text-gray-600">Calories</div>
                  </div>
                )}
                {recipe.nutritionalInfo.protein && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{recipe.nutritionalInfo.protein}</div>
                    <div className="text-sm text-gray-600">Protein</div>
                  </div>
                )}
                {recipe.nutritionalInfo.carbs && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{recipe.nutritionalInfo.carbs}</div>
                    <div className="text-sm text-gray-600">Carbs</div>
                  </div>
                )}
                {recipe.nutritionalInfo.fat && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{recipe.nutritionalInfo.fat}</div>
                    <div className="text-sm text-gray-600">Fat</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ingredients */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
                {recipe.ingredients.length}
              </span>
              Ingredients
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recipe.ingredients.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center bg-gray-50 p-3 rounded-lg"
                >
                  <span className="text-gray-700">
                    <span className="font-semibold">{item.ingredient}</span>
                    {item.measure && (
                      <span className="text-gray-500 ml-2">({item.measure})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cooking Tips */}
          {recipe.cookingTips && recipe.cookingTips.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <SparklesIcon className="h-5 w-5 mr-2 text-blue-500" />
                Pro Tips
              </h3>
              <ul className="space-y-2">
                {recipe.cookingTips.map((tip, index) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <AlertCircle className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Clock className="h-6 w-6 mr-2 text-orange-500" />
              Instructions
            </h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {recipe.strInstructions}
              </p>
            </div>
          </div>

          {/* Tags */}
          {recipe.strTags && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.strTags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex gap-4">
            {recipe.strYoutube && (
              <a
                href={recipe.strYoutube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Youtube className="h-5 w-5 mr-2" />
                Watch Video
              </a>
            )}
            {recipe.strSource && (
              <a
                href={recipe.strSource}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                View Source
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

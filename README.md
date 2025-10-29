# Smart Recipe Assistant

A beautiful, production-ready recipe finder application built for busy professionals who want to cook based on ingredients they have, their mood, or time available.

## Features

- **Recipe Search**: Find recipes by ingredients, mood/cravings, or time available
- **Weekly Meal Planner**: Plan your meals for the week with a calendar-like interface
- **Shopping List**: Automatically generate shopping lists from planned meals
- **Unit Conversion**: Convert recipe measurements to store-friendly units (g/kg, ml/L)
- **Favorites**: Save your favorite recipes
- **Responsive Design**: Works perfectly on desktop and mobile devices

## Live Demo

🌐 **[View Live Demo](https://your-username.github.io/smart-recipe-assistant)**

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **API**: TheMealDB API
- **Storage**: localStorage for client-side persistence
- **Deployment**: GitHub Pages

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
git clone https://github.com/your-username/smart-recipe-assistant.git
cd smart-recipe-assistant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Usage

### Recipe Search
- **By Ingredients**: Enter ingredients you have (e.g., "chicken, tomatoes")
- **Mood & Cravings**: Describe what you're craving (e.g., "spicy", "comfort food")
- **Time Available**: Specify how much time you have (e.g., "quick", "30 minutes")

### Meal Planner
- Navigate to the "Planner" tab
- Select a week using the navigation buttons
- Add recipes to specific days and meal slots (Breakfast, Lunch, Dinner, Snack)
- Use autocomplete to quickly find recipes

### Shopping List
- Navigate to the "Shopping" tab
- Click "Generate from Planner" to auto-populate ingredients from planned meals
- Toggle "Convert to store units" for practical shopping measurements
- Add, edit, or delete items manually

## Project Structure

```
src/
├── components/          # React components
│   ├── MealPlanner.tsx  # Weekly meal planning interface
│   ├── RecipeCard.tsx   # Recipe display card
│   ├── RecipeModal.tsx  # Detailed recipe view
│   └── ShoppingList.tsx # Shopping list management
├── services/           # API services
│   └── mealDB.ts       # TheMealDB API integration
├── types/              # TypeScript type definitions
│   ├── mealPlan.ts     # Meal planning types
│   └── recipe.ts       # Recipe data types
├── utils/              # Utility functions
│   ├── autocomplete.ts  # Search suggestions
│   ├── favorites.ts    # Favorites management
│   ├── plannerStorage.ts # localStorage for meal plans
│   ├── recipeEnhancer.ts # Recipe data enhancement
│   ├── searchFilters.ts # Search filtering logic
│   └── unitConversion.ts # Unit conversion utilities
└── App.tsx            # Main application component
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [TheMealDB](https://www.themealdb.com/) for providing the recipe API
- [Lucide React](https://lucide.dev/) for beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) for styling
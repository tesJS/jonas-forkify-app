import Search from './models/Search';
import Recipe from './models/Recipe';
import ShoppingList from './models/ShoppingList';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as shoppingListView from './views/shoppingListView';
import { elements, renderLoader, clearLoader } from './views/base';

// Store global state of the app
const state = {};

/**
 * SEARCH CONTROLLER
 */
const controlSearch = async () => {
	// Get query from view
	const query = searchView.getInput();

	if (query) {
		// New search object to add to state
		state.search = new Search(query);

		// Prepare UI for results
		searchView.clearResults();
		searchView.clearInput();
		renderLoader(elements.searchResults);

		try {
			// Search for recipes
			await state.search.getResults();

			// Clear loading indicator
			clearLoader();

			// Render results in UI
			searchView.renderResults(state.search.result);
		} catch (error) {
			console.error(error);
			alert('There was a problem with your search. Please try again later.');
			// Clear loading indicator
			clearLoader();
		}
	}
};

elements.searchForm.addEventListener('submit', e => {
	e.preventDefault();
	controlSearch();
});

elements.searchResultsPages.addEventListener('click', e => {
	// Store button closest to element clicked
	const btn = e.target.closest('.btn-inline');

	// Get page number from data attribute
	if (btn) {
		const gotoPage = parseInt(btn.dataset.goto, 10);
		searchView.clearResults();
		searchView.renderResults(state.search.result, gotoPage);
	}
});

/**
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
	const id = window.location.hash.substring(1);

	if (id) {
		// Prepare UI for changes
		recipeView.clearResults();
		renderLoader(elements.recipe);

		// Highlight selected search item
		searchView.highlightSelected(id);

		// Create new recipe object
		state.recipe = new Recipe(id);

		try {
			// Get recipe data and parse ingredients
			await state.recipe.getRecipe();
			state.recipe.parseIngredients();

			// Clear loading indicator
			clearLoader();

			// Render recipe
			recipeView.renderRecipe(state.recipe);
			console.dir(state.recipe);
		} catch (error) {
			console.error(error);
			alert('Unable to retrieve selected recipe. Please try again.');
			// Clear loading indicator
			clearLoader();
		}
	}
};

/**
 * SHOPPING LIST CONTROLLER
 */
const controlShoppingList = () => {
	// Create a new list if none exits
	if (!state.shoppingList) state.shoppingList = new ShoppingList();

	// Add each ingredient to the list
	state.recipe.revisedIngredients.forEach(i => {
		const item = state.shoppingList.addItem(i.count, i.unit, i.ingredient);
		shoppingListView.renderItem(item);
	});
};

// Commented out load event due to a 50/day search limit
window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load', controlRecipe);

// The above event listeners can be created using forEach
// ['hashchange', 'load'].forEach(event =>
// 	window.addEventListener(event, controlRecipe)
// );

// Attach click events for recipe container buttons
elements.recipe.addEventListener('click', e => {
	// Helper function
	const fn = {
		// Clear and re-render recipe
		reRenderRecipe: recipe => {
			recipeView.clearResults();
			recipeView.renderRecipe(recipe);
		}
	};

	// Handle increase or decrease of servings
	// If target matches class selector or any of its siblings
	// Set upper limit to 12 servings
	if (
		e.target.matches('.btn-increase, .btn-increase *') &&
		state.recipe.servings < 12
	) {
		state.recipe.updateServings('inc');
		fn.reRenderRecipe(state.recipe);
		// Set lower limit to 2 servings
	} else if (
		e.target.matches('.btn-decrease, .btn-decrease *') &&
		state.recipe.servings > 2
	) {
		state.recipe.updateServings('dec');
		fn.reRenderRecipe(state.recipe);
	}

	// Handle adding ingredient to shopping list
	// If target matches class selector or any of its siblings
	if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
		controlShoppingList();
	}
});

// Attach click events for shopping list container buttons
elements.shoppingList.addEventListener('click', e => {
	// Get id of list item
	const id = e.target.closest('.shopping__item').dataset.id;

	// Handle deleting a list item
	if (e.target.matches('.shopping__delete, .shopping__delete *')) {
		// Delete item from state and UI
		state.shoppingList.deleteItem(id);
		shoppingListView.deleteItem(id);

		// Handle updating an item's value
	} else if (e.target.matches('.shopping__count-value')) {
		const val = parseFloat(e.target.value, 10);
		state.shoppingList.updateCount(id, val);
		console.log(state);
	}
});

import apiClient from ".";

export async function getAllIngredients() {
    try {
        const response = await apiClient.get('/inventory/ingredients');
        return response.data;
    } catch (error) {
        console.error("Error fetching all ingredients:", error);
        throw error;
    }
}

export async function getIngredientDetails(ingredientId) {
    try {
        const response = await apiClient.get(`/inventory/ingredients/${ingredientId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching ingredient details:", error);
        throw error;
    }
}

export async function updateIngredientStock(ingredientId, quantity) {
    try {
        const response = await apiClient.put(`/inventory/ingredients/${ingredientId}`, {
            quantity
        });
        return response.data;
    } catch (error) {
        console.error("Error updating ingredient stock:", error);
        throw error;
    }
}

export async function updateIngredientDetails(ingredientId, ingredientData) {
    try {
        const response = await apiClient.patch(`/inventory/ingredients/${ingredientId}`, ingredientData);
        return response.data;
    } catch (error) {
        console.error("Error updating ingredient details:", error);
        throw error;
    }
}

export async function addIngredient(ingredientData) {
    try {
        const response = await apiClient.post('/inventory/ingredients', ingredientData);
        return response.data;
    } catch (error) {
        console.error("Error adding ingredient:", error);
        throw error;
    }
}
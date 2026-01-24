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
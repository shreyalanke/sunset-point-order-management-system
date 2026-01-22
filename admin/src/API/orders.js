import apiClient from "./index.js";


export async function fetchTodaysSales() {
    try {
        const response = await apiClient.get('/admin/orders/todays-sales');
        return response.data.totalSales;
    } catch (error) {
        console.error("Error fetching today's sales:", error);
        throw error;
    }
}
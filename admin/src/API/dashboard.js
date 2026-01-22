import apiClient from "./index.js";

export async function getDashboardData() {
    try {
        const response = await apiClient.get('/admin/dashboard/summary');
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        throw error;
    }
}

export async function getTrendData(range) {
    try {
        const response = await apiClient.get(`/admin/dashboard/order-trends?range=${range}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching order trends data:", error);
        throw error;
    }
}

export async function getCategorySalesData() {
    try {
        const response = await apiClient.get('/admin/dashboard/category-sales');
        return response.data;
    } catch (error) {
        console.error("Error fetching category sales data:", error);
        throw error;
    }
}
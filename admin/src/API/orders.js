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

export async function getOrders(params) {
    try {   
        params = {searchQuery: params.searchQuery, startDate: params.dateRange.start, endDate: params.dateRange.end, sortKey: params.sortConfig.key, sortDirection: params.sortConfig.direction, page: params.currentPage};
        console.log("Fetching orders with params:", new URLSearchParams(params).toString());
        const response = await apiClient.get('/admin/orders?' + new URLSearchParams(params).toString());
        return response.data;
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
}

export async function getOrderById(orderId) {
    try {
        const response = await apiClient.get(`/admin/orders/${orderId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching order by ID:", error);
        throw error;
    }
}
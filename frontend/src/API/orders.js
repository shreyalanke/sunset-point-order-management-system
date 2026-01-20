import apiClient from ".";


async function getOrders() {
    const response = await apiClient.get('/orders');
    return response.data;
}

async function createOrder(order) {
    const response = await apiClient.post('/orders', order);
    return response.data;
}

export { getOrders, createOrder };
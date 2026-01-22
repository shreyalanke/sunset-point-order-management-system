import apiClient from ".";

async function getOrders() {
  const response = await apiClient.get("/orders");
  return response.data;
}

async function createOrder(order) {
  const response = await apiClient.post("/orders", order);
  return response.data;
}

async function closeOrder(orderId) {
  const response = await apiClient.put(`/orders/close?id=${orderId}`);
  return response.data;
}

async function toggleServedStatus(orderId, itemId) {
  const response = await apiClient.put(`/orders/toggle-served`, {
    orderId,
    itemId,
  });
  return response.data;
}

async function deleteItemFromOrder(itemId) {
  const response = await apiClient.delete(`/orders/item?id=${itemId}`);
  return response.data;
}

async function toggleOrderPayment(orderId) {
  const response = await apiClient.put(`/orders/toggle-payment?id=${orderId}`);
  return response.data;
}

export {
  getOrders,
  createOrder,
  closeOrder,
  toggleServedStatus,
  deleteItemFromOrder,
  toggleOrderPayment,
};

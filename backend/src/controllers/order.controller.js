import databaseService from "../services/database.service.js";

function getOrdersController(req, res) {
  databaseService
    .getOrders()
    .then((result) => {
      const ordersMap = new Map();
      result.forEach((row) => {
        // Create order once
        if (!ordersMap.has(row.order_id)) {
          ordersMap.set(row.order_id, {
            id: row.order_id,
            items: [],
            tag: row.order_tag,
            createdAt: row.created_at,
            status: row.order_status,
            paymentDone: row.is_payment_done,
            orderTotal: row.order_total,
          });
        }

        // Add item only if it exists
        if (row.order_item_id) {
          ordersMap.get(row.order_id).items.push({
            id: row.order_item_id,
            quantity: row.quantity,
            status: row.item_status,
            name: row.dish_name,
            category: row.category,
            price: row.price,
          });
        }
      });

      res.status(200).send([...ordersMap.values()]);
    })
    .catch((err) => {
      console.error("Error fetching orders:", err);
      res.status(500).send({ error: "Failed to fetch orders" });
    });
}

async function postOrder(req, res) {
  const { items, tag } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Invalid items in request body" });
  }

  try {
    await databaseService.createOrder(tag, items);
    return res.status(201).json({ message: "Order created successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create order" });
  }
}

async function closeOrder(req, res) {
  let orderId = req.query.id;
  try {
    let result = await databaseService.closeOrder(orderId);
    if (!result) {
      return res.status(404).json({ error: "Order not found" });
    }
    res
      .status(200)
      .json({ message: "Order closed successfully", order: result });
  } catch (err) {
    console.error("Error closing order:", err);
    res.status(500).json({ error: "Failed to close order" });
  }
}

async function orderServed(req, res) {
  let { orderId, itemId } = req.body;
  try {
    let result = await databaseService.toggleItemServedStatus(orderId, itemId);
    if (!result) {
      return res.status(404).json({ error: "Order item not found" });
    } else {
      return res.status(200).json({
        message: "Item served status toggled successfully",
        status: result.item_status,
      });
    }
  } catch (error) {
    console.log("Error toggling item served status:", error);
    res.status(500).json({ error: "Failed to toggle item served status" });
  }
}

async function removeItemFromOrder(req, res) {
  let itemId = req.query.id;
  try {
    await databaseService.removeItemFromOrder(itemId);
    res.status(200).json({ message: "Item removed from order successfully" });
  } catch (error) {
    console.log("Error removing item from order:", error);
    res.status(500).json({ error: "Failed to remove item from order" });
  }
}

async function toggleOrderPayment(req, res) {
  let orderId = req.query.id;
  try {
    let result = await databaseService.toggleOrderPaymentStatus(orderId);
    if (!result) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.status(200).json({
      message: "Order payment status toggled successfully",
      isPaymentDone: result.is_payment_done,
    });
  } catch (error) {
    console.log("Error toggling order payment status:", error);
    res.status(500).json({ error: "Failed to toggle order payment status" });
  }
}

export {
  getOrdersController as getOrders,
  postOrder,
  closeOrder,
  orderServed,
  removeItemFromOrder,
  toggleOrderPayment,
};

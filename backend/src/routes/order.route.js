import express from "express";
import {
  closeOrder,
  getOrders,
  postOrder,
  orderServed,
  removeItemFromOrder,
  toggleOrderPayment,
} from "../controllers/order.controller.js";

let orderRoute = express.Router();

// Define order-related routes here
orderRoute.get("/", getOrders);
orderRoute.post("/", postOrder);
orderRoute.put("/close", closeOrder);
orderRoute.put("/toggle-served", orderServed);
orderRoute.delete("/item", removeItemFromOrder);
orderRoute.put("/toggle-payment", toggleOrderPayment);

export default orderRoute;

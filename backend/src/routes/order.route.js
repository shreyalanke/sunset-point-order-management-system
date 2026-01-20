import express from "express"
import { getOrders, postOrder } from "../controllers/order.controller.js"  

let orderRoute = express.Router()

// Define order-related routes here
orderRoute.get("/", getOrders)
orderRoute.post("/", postOrder);

export default orderRoute
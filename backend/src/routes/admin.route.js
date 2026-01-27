import express from 'express';
const router = express.Router();
import { dashboardStats,getTrendData ,getCategorySalesData,getTopSellingItems,getHighValueItems} from '../controllers/dashboard.controller.js';
import { getAnalytics, getDishPerformance,getCategoryPerformance } from '../controllers/analytics.controller.js';
import { getOrders, getOrderById } from '../controllers/admin.controller.js';



router.get('/dashboard/summary', dashboardStats);
router.get('/dashboard/order-trends', getTrendData);
router.get('/dashboard/category-sales', getCategorySalesData);
router.get('/dashboard/top-selling-items'  , getTopSellingItems);
router.get('/dashboard/high-value-items'  , getHighValueItems);
router.get('/analytics/dish-performance' , getDishPerformance);
router.get('/analytics/category-performance' , getCategoryPerformance);
router.get('/orders' , getOrders);
router.get('/orders/:orderId' , getOrderById);
router.get('/analytics' , getAnalytics);

export default router;
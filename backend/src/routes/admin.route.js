import express from 'express';
const router = express.Router();
import { dashboardStats,getTrendData ,getCategorySalesData} from '../controllers/admin.controller.js';

router.get('/dashboard/summary', dashboardStats);
router.get('/dashboard/order-trends', getTrendData);
router.get('/dashboard/category-sales', getCategorySalesData);
export default router;
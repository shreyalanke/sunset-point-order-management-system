import express from 'express';
const router = express.Router();
import { dashboardStats,getTrendData ,getCategorySalesData,getTopSellingItems} from '../controllers/admin.controller.js';

router.get('/dashboard/summary', dashboardStats);
router.get('/dashboard/order-trends', getTrendData);
router.get('/dashboard/category-sales', getCategorySalesData);
router.get('/dashboard/top-selling-items'  , getTopSellingItems);

export default router;
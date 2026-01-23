import express from 'express';
const router = express.Router();
import { dashboardStats,getTrendData ,getCategorySalesData,getTopSellingItems,getHighValueItems} from '../controllers/admin.controller.js';

router.get('/dashboard/summary', dashboardStats);
router.get('/dashboard/order-trends', getTrendData);
router.get('/dashboard/category-sales', getCategorySalesData);
router.get('/dashboard/top-selling-items'  , getTopSellingItems);
router.get('/dashboard/high-value-items'  , getHighValueItems);

export default router;
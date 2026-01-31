package com.karan.admin_sunset_point.data.handler;

import com.karan.admin_sunset_point.App;
import com.karan.admin_sunset_point.data.AppDatabase;
import com.karan.admin_sunset_point.data.entity.CategoryPerformance;
import com.karan.admin_sunset_point.data.entity.DishPerformance;
import com.karan.admin_sunset_point.data.entity.OrderAnalysis;

import java.util.List;


public class Handler {
    private static Handler handler;
    private AppDatabase db;

    private Handler(){
        db = AppDatabase.getInstance(App.context);
    }

    public static Handler getInstance(){
        if(handler == null){
            handler = new Handler();
        }
        return handler;
    }

    public OrderAnalysis getAnalyticsByDateRange(String start, String end) {
        OrderAnalysis orderAnalysis = new OrderAnalysis();
        orderAnalysis.orderSummary = db.orderDao().getOrderSummary(start, end);
        orderAnalysis.categoryPerformances = db.orderDao().getTopCategories(start, end);
        orderAnalysis.hourlyRushes = db.orderDao().getHourlyRush(start, end);
        orderAnalysis.salesTrends = db.orderDao().getSalesTrend(start, end);
        orderAnalysis.orderSizeDistribution = db.orderDao().getOrderSizeDistribution(start, end);
        return orderAnalysis;
    }

    public List<CategoryPerformance> getCategoryPerformanceByDateRange(String start, String end) {
        return db.orderDao().getTopCategories(start, end);
    }

    public List<DishPerformance> getDishPerformance(String start, String end, String type, int limit) {
        if ("revenue".equals(type)) {
            return db.orderDao().getTopDishesByRevenue(start, end, limit);
        } else {
            return db.orderDao().getTopDishesByQuantity(start, end, limit);
        }
    }
}

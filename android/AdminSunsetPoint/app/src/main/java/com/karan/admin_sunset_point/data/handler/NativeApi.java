package com.karan.admin_sunset_point.data.handler;

import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.annotation.NonNull;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.karan.admin_sunset_point.data.entity.CategoryPerformance;
import com.karan.admin_sunset_point.data.entity.DishPerformance;
import com.karan.admin_sunset_point.data.entity.HourlyRush;
import com.karan.admin_sunset_point.data.entity.OrderAnalysis;
import com.karan.admin_sunset_point.data.entity.OrderSizeDistribution;
import com.karan.admin_sunset_point.data.entity.OrderSummary;
import com.karan.admin_sunset_point.data.entity.SalesTrend;
import com.karan.admin_sunset_point.data.handler.DateRangeUtil.DateRange;

import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

public class NativeApi {
    private final Executor executor = Executors.newSingleThreadExecutor();
    private final WebView webView;

    public NativeApi(WebView webView) {
        this.webView = webView;
    }

    @JavascriptInterface
    public void getAnalyticsByPredefinedRange(String requestId, String range){
        executor.execute(() -> {
            String result = "";
            try{
                DateRange dateRange = DateRangeUtil.getDateRange(range);
                OrderAnalysis orderAnalysis = Handler.getInstance().getAnalyticsByDateRange(dateRange.start, dateRange.end);
                JSONObject obj = new JSONObject();
                OrderSummary orderSummary = orderAnalysis.orderSummary;
                obj.put("totalRevenue", orderSummary.total_revenue);
                obj.put("avgOrdersPerDay", orderSummary.total_orders);
                obj.put("avgOrderValue", orderSummary.avg_order_value);
                obj.put("avgNumberOfItemsPerOrder", orderSummary.avg_number_of_items_per_order);
                obj.put("totalOrders",orderSummary.total_orders);

                JSONArray categoryPerformanceData = getJsonArray(orderAnalysis);
                obj.put("categoryPerformanceData", categoryPerformanceData);

                JSONArray hourlyRushData = getHourlyRushData(orderAnalysis);
                obj.put("hourlyRushData", hourlyRushData);

                JSONArray salesTrendData = getSalesTrendData(orderAnalysis);
                obj.put("salesTrendData", salesTrendData);

                JSONArray orderSizeData = getSizeData(orderAnalysis);
                obj.put("orderSizeData",orderSizeData);


                result = obj.toString();
            }catch (Exception e){
                e.printStackTrace();
            }

            Log.d("result",result);

            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) + "," +
                    JSONObject.quote(result) +
                    ");";

            webView.post(()->webView.evaluateJavascript(js,null));
        });
    }

    private JSONArray getSizeData(OrderAnalysis orderAnalysis) throws JSONException {
        JSONArray orderSizeData = new JSONArray();
        List<OrderSizeDistribution> orderSizeDistribution = orderAnalysis.orderSizeDistribution;
        for (OrderSizeDistribution r : orderSizeDistribution) {
            JSONObject obj = new JSONObject();
            obj.put("size",r.size);
            obj.put("count",r.count);
            orderSizeData.put(obj);
        }
        return orderSizeData;
    }

    private JSONArray getSalesTrendData(OrderAnalysis orderAnalysis) throws JSONException {
        JSONArray salesTrendData = new JSONArray();
        List<SalesTrend> salesTrends = orderAnalysis.salesTrends;

        for (SalesTrend r : salesTrends) {
            JSONObject obj = new JSONObject();
            obj.put("date", r.date);      // YYYY-MM-DD
            obj.put("sales", r.sales);    // Number
            obj.put("orders", r.orders);  // Number
            obj.put("aov", r.aov);        // Number
            salesTrendData.put(obj);
        }
        return salesTrendData;
    }

    @NonNull
    private static JSONArray getHourlyRushData(OrderAnalysis orderAnalysis) throws JSONException {
        JSONArray hourlyRushData = new JSONArray();
        List<HourlyRush> hourlyRushes = orderAnalysis.hourlyRushes;
        for (HourlyRush r : hourlyRushes) {
            int h = r.hour;

            String label;
            if (h == 0) {
                label = "12 AM";
            } else if (h < 12) {
                label = h + " AM";
            } else if (h == 12) {
                label = "12 PM";
            } else {
                label = (h - 12) + " PM";
            }

            JSONObject hr = new JSONObject();
            hr.put("time", label);
            hr.put("orders", r.avg_orders);

            hourlyRushData.put(hr);
        }
        return hourlyRushData;
    }

    @NonNull
    private static JSONArray getJsonArray(OrderAnalysis orderAnalysis) throws JSONException {
        JSONArray categoryPerformanceData = new JSONArray();
        List<CategoryPerformance> categoryPerformances = orderAnalysis.categoryPerformances;
        for (CategoryPerformance categoryPerformance : categoryPerformances) {
            JSONObject categoryPerformanceObj = new JSONObject();
            categoryPerformanceObj.put("name", categoryPerformance.name);
            categoryPerformanceObj.put("sales", categoryPerformance.sales);
            categoryPerformanceObj.put("quantity", categoryPerformance.quantity);
            categoryPerformanceData.put(categoryPerformanceObj);
        }


        return categoryPerformanceData;
    }

    @JavascriptInterface
    public void getAnalyticsByDateRange(String requestId, String start, String end){
        executor.execute(() -> {
            String result = "";
            try{
                Log.d(start,end);
                DateRange dateRange = new DateRange(start, end);
                OrderAnalysis orderAnalysis = Handler.getInstance().getAnalyticsByDateRange(dateRange.start, dateRange.end);
                JSONObject obj = new JSONObject();
                OrderSummary orderSummary = orderAnalysis.orderSummary;
                obj.put("totalRevenue", orderSummary.total_revenue);
                obj.put("avgOrdersPerDay", orderSummary.total_orders);
                obj.put("avgOrderValue", orderSummary.avg_order_value);
                obj.put("avgNumberOfItemsPerOrder", orderSummary.avg_number_of_items_per_order);
                obj.put("totalOrders",orderSummary.total_orders);

                JSONArray categoryPerformanceData = getJsonArray(orderAnalysis);
                obj.put("categoryPerformanceData", categoryPerformanceData);

                JSONArray hourlyRushData = getHourlyRushData(orderAnalysis);
                obj.put("hourlyRushData", hourlyRushData);

                JSONArray salesTrendData = getSalesTrendData(orderAnalysis);
                obj.put("salesTrendData", salesTrendData);

                JSONArray orderSizeData = getSizeData(orderAnalysis);
                obj.put("orderSizeData",orderSizeData);


                result = obj.toString();
            }catch (Exception e){
                e.printStackTrace();
            }

            Log.d("result",result);

            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) + "," +
                    JSONObject.quote(result) +
                    ");";

            webView.post(()->webView.evaluateJavascript(js,null));
        });
    }

    @JavascriptInterface
    public void getCategoryPerformanceByDateRange(String requestId, String start, String end){
        executor.execute(() -> {
            String result = "";
            try{
                DateRange dateRange = new DateRange(start, end);
                List<CategoryPerformance> categoryPerformances = Handler.getInstance().getCategoryPerformanceByDateRange(dateRange.start, dateRange.end);
                JSONArray categoryPerformanceData = getCategoryPerformanceData(categoryPerformances);
                result = categoryPerformanceData.toString();
            } catch (Exception e){
                e.printStackTrace();
            }

            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) + "," +
                    JSONObject.quote(result) +
                    ");";

            webView.post(()->webView.evaluateJavascript(js,null));
        });
    }

    @JavascriptInterface
    public void getCategoryPerformanceByPredefinedRange(String requestId, String range){
        executor.execute(() -> {
            String result = "";
            try{
                DateRange dateRange = DateRangeUtil.getDateRange(range);
                List<CategoryPerformance> categoryPerformances = Handler.getInstance().getCategoryPerformanceByDateRange(dateRange.start, dateRange.end);
                JSONArray categoryPerformanceData = getCategoryPerformanceData(categoryPerformances);
                result = categoryPerformanceData.toString();
            } catch (Exception e) {
                e.printStackTrace();
            }

            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) + "," +
                    JSONObject.quote(result) +
                    ");";

            webView.post(()->webView.evaluateJavascript(js,null));
        });
    }

    @NonNull
    private static JSONArray getCategoryPerformanceData(List<CategoryPerformance> categoryPerformances) throws JSONException {
        JSONArray categoryPerformanceData = new JSONArray();
        for (CategoryPerformance categoryPerformance : categoryPerformances) {
            JSONObject categoryPerformanceObj = new JSONObject();
            categoryPerformanceObj.put("name", categoryPerformance.name);
            categoryPerformanceObj.put("sales", categoryPerformance.sales);
            categoryPerformanceObj.put("quantity", categoryPerformance.quantity);
            categoryPerformanceData.put(categoryPerformanceObj);
        }
        return categoryPerformanceData;
    }

    @JavascriptInterface
    public void getDishPerformanceByPredefinedRange(String requestId, String range,String type, String limit_s){
        executor.execute(() -> {
            String result = "";
            try{
                DateRange dateRange = DateRangeUtil.getDateRange(range);
                int limit = Integer.parseInt(limit_s);
                List<DishPerformance> dishPerformances = Handler.getInstance().getDishPerformance(dateRange.start,dateRange.end,type,limit);
                JSONArray dishPerformanceData = new JSONArray();

                for (DishPerformance d : dishPerformances) {
                    JSONObject obj = new JSONObject();
                    obj.put("id", d.id);
                    obj.put("name", d.name);
                    obj.put("category", d.category);
                    obj.put("sales", d.sales);
                    obj.put("revenue", d.revenue);
                    dishPerformanceData.put(obj);
                }

                result = dishPerformanceData.toString();
            } catch (Exception e) {
                e.printStackTrace();
            }
            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) + "," +
                    JSONObject.quote(result) +
                    ");";

            webView.post(()->webView.evaluateJavascript(js,null));
        });
    }
}
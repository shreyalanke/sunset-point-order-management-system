package com.karan.sunset_point.data.handler;

import android.util.Log;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

import com.google.gson.Gson;
import com.karan.sunset_point.App;
import com.karan.sunset_point.data.AppDatabase;
import com.karan.sunset_point.data.Responses.OrderItemResponse;
import com.karan.sunset_point.data.Responses.OrderResponse;
import com.karan.sunset_point.data.entity.Dish;
import com.karan.sunset_point.data.entity.ItemStatus;
import com.karan.sunset_point.data.entity.Order;
import com.karan.sunset_point.data.entity.OrderItem;
import com.karan.sunset_point.data.entity.OrderStatus;
import com.karan.sunset_point.data.entity.OrderWithItemsRow;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class Handler {
    private static Handler handler;
    private AppDatabase appDatabase;

    private Handler(){
        appDatabase = AppDatabase.getInstance(App.context);
    }

    public static Handler getInstance(){
        if(handler == null){
            handler = new Handler();
        }
        return handler;
    }

    public String getDishes() {
        try {
            List<Dish> dishes = appDatabase.dishDao().getAllDishes();

            // category -> list of dishes
            Map<String, JSONArray> grouped = new LinkedHashMap<>();

            for (Dish dish : dishes) {
                if (!grouped.containsKey(dish.category)) {
                    grouped.put(dish.category, new JSONArray());
                }

                JSONObject dishJson = new JSONObject();
                dishJson.put("id", dish.dish_id);
                dishJson.put("name", dish.dish_name);
                dishJson.put("price", dish.price);

                Objects.requireNonNull(grouped.get(dish.category)).put(dishJson);
            }

            JSONObject responseJson = new JSONObject();
            for (Map.Entry<String, JSONArray> entry : grouped.entrySet()) {
                responseJson.put(entry.getKey(), entry.getValue());
            }

            return responseJson.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "{\"success\":false,\"error\":\"" + e.getMessage() + "\"}";
        }
    }
    public static String getNowSqliteFormat() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        return now.toString().replace("T", " ");
    }
    public void createOrder(String tag, List<OrderItem> items) {
        try {
            Order order = new Order();
            order.order_tag = tag;
            order.created_at = getNowSqliteFormat();
            long orderId = appDatabase.orderDao().insertOrder(order);
            for (OrderItem item : items) {
                item.order_id = (int) orderId;
                appDatabase.orderItemDao().insertItem(item);
            }
            appDatabase.orderDao().recalcOrderTotal((int) orderId);

        } catch (Exception e){
            e.printStackTrace();
        }
    }
    public String getOrders() {
        try {

            List<OrderWithItemsRow> rows =
                    appDatabase.orderDao().getTodayOrders();

            Map<Integer, OrderResponse> orderMap = new LinkedHashMap<>();

            for (OrderWithItemsRow row : rows) {


                // Create order if not exists
                OrderResponse order = orderMap.get(row.order_id);

                if (order == null) {
                    order = new OrderResponse();
                    order.id = row.order_id;
                    order.tag = row.order_tag;
                    order.createdAt = row.created_at;
                    order.status = row.order_status;
                    order.paymentDone = row.is_payment_done;
                    order.orderTotal = row.order_total;

                    orderMap.put(row.order_id, order);
                }

                // Add item if exists (LEFT JOIN safety)
                if (row.order_item_id != null) {
                    OrderItemResponse item = new OrderItemResponse();
                    item.id = row.order_item_id;
                    item.quantity = row.quantity;
                    item.status = row.item_status;
                    item.name = row.dish_name;
                    item.category = row.category;
                    item.price = row.price;

                    order.items.add(item);
                }
            }

            List<OrderResponse> result = new ArrayList<>(orderMap.values());

            return new Gson().toJson(result);

        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }

    public String toggleServedStatus(int orderId, int itemId) {
        try {
            String result;
            OrderItem item = appDatabase.orderItemDao().getOrderItemById(orderId,itemId);
            if (item.item_status == ItemStatus.SERVED){
                result = "PENDING";
                item.item_status = ItemStatus.PENDING;
            }else{
                result = "SERVED";
                item.item_status = ItemStatus.SERVED;
            }
            appDatabase.orderItemDao().updateItemStatus(itemId,item.item_status);
            return result;
        } catch (Exception e) {
            e.printStackTrace();
            return "0";
        }
    }

    public void closeOrder(int orderId) {
        try {
            appDatabase.orderItemDao().setServed(orderId);
            appDatabase.orderDao().closeOrder(orderId);
        }catch (Exception e){
            e.printStackTrace();
        }
    }

    public void deleteOrderItem(int itemId) {
        try {
            appDatabase.orderItemDao().deleteItem(itemId);
        }catch (Exception e) {
            e.printStackTrace();
        }
    }

    public Boolean toggleOrderPayment(int orderId) {
        try {
            Order order = appDatabase.orderDao().getOrderById(orderId);
            order.is_payment_done = !order.is_payment_done;
            appDatabase.orderDao().setIsPayment(order.is_payment_done,orderId);
            return order.is_payment_done;
        }catch (Exception e){
            e.printStackTrace();
            return false;
        }
    }

    public void cancelOrder(int orderId) {
        try {
            appDatabase.orderDao().cancelOrder(orderId);
        } catch (Exception e){
            e.printStackTrace();
        }
    }

    public OrderResponse getOrderForPrint(int orderId) {
        try {
            List<OrderWithItemsRow> rows = appDatabase.orderDao().getOrderForPrint(orderId);

            Map<Integer, OrderResponse> orderMap = new LinkedHashMap<>();
            for(OrderWithItemsRow row : rows){

                // Create order if not exists
                OrderResponse order = orderMap.get(row.order_id);

                if (order == null) {
                    order = new OrderResponse();
                    order.id = row.order_id;
                    order.tag = row.order_tag;
                    order.createdAt = row.created_at;
                    order.status = row.order_status;
                    order.paymentDone = row.is_payment_done;
                    order.orderTotal = row.order_total;

                    orderMap.put(row.order_id, order);
                }

                // Add item if exists (LEFT JOIN safety)
                if (row.order_item_id != null) {
                    OrderItemResponse item = new OrderItemResponse();
                    item.id = row.order_item_id;
                    item.quantity = row.quantity;
                    item.status = row.item_status;
                    item.name = row.dish_name;
                    item.category = row.category;
                    item.price = row.price;

                    order.items.add(item);
                }
            }

            List<OrderResponse> result = new ArrayList<>(orderMap.values());


            return result.get(0);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}

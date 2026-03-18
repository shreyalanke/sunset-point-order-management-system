package com.karan.admin_sunset_point.data.handler;

import com.karan.admin_sunset_point.App;
import com.karan.admin_sunset_point.data.AppDatabase;
import com.karan.admin_sunset_point.data.entity.CategoryPerformance;
import com.karan.admin_sunset_point.data.entity.Dish;
import com.karan.admin_sunset_point.data.entity.DishPerformance;
import com.karan.admin_sunset_point.data.entity.ItemStatus;
import com.karan.admin_sunset_point.data.entity.Order;
import com.karan.admin_sunset_point.data.entity.OrderAnalysis;
import com.karan.admin_sunset_point.data.entity.OrderItem;
import com.karan.admin_sunset_point.data.entity.OrderStatus;
import com.karan.admin_sunset_point.data.entity.OrderWithItems;
import com.karan.admin_sunset_point.data.Responses.PaginatedOrdersResponse;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;


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

    public PaginatedOrdersResponse getOrdersAdmin(String searchQuery, String startDate, String endDate, String sortKey, String sortDirection, int page) {
        searchQuery = searchQuery == null ? "" : searchQuery;
        page = page <= 0 ? 1 : page;

        // Get total count
        int totalCount = db.orderDao().getOrderCount(searchQuery, startDate, endDate);

        // Get paginated orders
        List<OrderWithItems> orders;
        if ("order_total".equals(sortKey)) {
            orders = "asc".equals(sortDirection)
                    ? db.orderDao().getOrdersByTotalAsc(searchQuery, startDate, endDate, page)
                    : db.orderDao().getOrdersByTotalDesc(searchQuery, startDate, endDate, page);
        } else {
            orders = "asc".equals(sortDirection)
                    ? db.orderDao().getOrdersByCreatedAsc(searchQuery, startDate, endDate, page)
                    : db.orderDao().getOrdersByCreatedDesc(searchQuery, startDate, endDate, page);
        }

        return new PaginatedOrdersResponse(orders, totalCount);
    }

    public OrderWithItems getOrderById(int orderId) {
        return db.orderDao().getOrderByIdWithItems(orderId);
    }

    public int getTodaysSales() {
        return db.orderDao().getTodaysTotalSales();
    }

    public Map<String, JSONArray> getMenuItems() throws JSONException {
        List<Dish> dishes = db.dishDao().getAllDishes();
        Map<String, JSONArray> menuByCategory = new HashMap<>();
        
        for (Dish dish : dishes) {
            if (!menuByCategory.containsKey(dish.category)) {
                menuByCategory.put(dish.category, new JSONArray());
            }
            
            JSONObject dishObj = new JSONObject();
            dishObj.put("id", dish.dish_id);
            dishObj.put("name", dish.dish_name);
            dishObj.put("price", dish.price);
            
            menuByCategory.get(dish.category).put(dishObj);
        }
        
        return menuByCategory;
    }

    public Dish getDishById(int dishId) {
        return db.dishDao().getDishById(dishId);
    }

    public List<String> getCategories() {
        List<Dish> dishes = db.dishDao().getAllDishes();
        List<String> categories = new ArrayList<>();
        
        for (Dish dish : dishes) {
            if (!categories.contains(dish.category)) {
                categories.add(dish.category);
            }
        }
        
        return categories;
    }

    public boolean updateMenuItem(JSONObject itemData) throws JSONException {
        try {
            Dish dish = new Dish();
            
            if (itemData.has("id")) {
                // Update existing dish
                int id = itemData.getInt("id");
                dish.dish_id = id;
                dish.dish_name = itemData.getString("name");
                dish.price = itemData.getInt("price");
                dish.category = itemData.getString("category");
                db.dishDao().updateDish(dish);
            } else {
                // Insert new dish
                dish.dish_name = itemData.getString("name");
                dish.price = itemData.getInt("price");
                dish.category = itemData.getString("category");
                db.dishDao().insertDish(dish);
            }
            
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public List<Dish> getAllDishes() {
        return db.dishDao().getAllDishes();
    }

    public List<Order> getAllOrders() {
        return db.orderDao().getAllOrders();
    }

    public List<OrderItem> getAllOrderItems() {
        return db.orderItemDao().getAllOrderItems();
    }

    public JSONObject restoreBackup(JSONObject backupData, boolean wipeExistingData) throws JSONException {
        final JSONArray dishesArray = backupData.optJSONArray("dishes") == null ? new JSONArray() : backupData.optJSONArray("dishes");
        final JSONArray ordersArray = backupData.optJSONArray("orders") == null ? new JSONArray() : backupData.optJSONArray("orders");
        final JSONArray orderItemsArray = backupData.optJSONArray("order_items") == null ? new JSONArray() : backupData.optJSONArray("order_items");

        final int[] restoredCounts = new int[] {0, 0, 0};
        final int[] skippedCounts = new int[] {0, 0, 0};
        final Set<Integer> restoredDishIds = new HashSet<>();
        final Set<Integer> restoredOrderIds = new HashSet<>();
        final List<String> warnings = new ArrayList<>();

        AppDatabase.withSeedLock(() -> db.runInTransaction(() -> {
            if (wipeExistingData) {
                db.orderItemDao().deleteAllOrderItems();
                db.orderDao().deleteAllOrders();
                db.dishDao().deleteAllDishes();
            }

            for (int index = 0; index < dishesArray.length(); index++) {
                JSONObject dishObj = dishesArray.optJSONObject(index);
                if (dishObj == null) {
                    skippedCounts[0]++;
                    addWarning(warnings, "Skipped dish at index " + index + ": invalid JSON object");
                    continue;
                }

                try {
                    Dish dish = new Dish();
                    dish.dish_id = dishObj.getInt("dish_id");
                    dish.dish_name = dishObj.getString("dish_name");
                    dish.category = dishObj.getString("category");
                    dish.price = dishObj.optInt("price", 0);
                    db.dishDao().insertDish(dish);
                    restoredDishIds.add(dish.dish_id);
                    restoredCounts[0]++;
                } catch (Exception exception) {
                    skippedCounts[0]++;
                    addWarning(warnings, "Skipped dish at index " + index + ": " + exception.getMessage());
                }
            }

            for (int index = 0; index < ordersArray.length(); index++) {
                JSONObject orderObj = ordersArray.optJSONObject(index);
                if (orderObj == null) {
                    skippedCounts[1]++;
                    addWarning(warnings, "Skipped order at index " + index + ": invalid JSON object");
                    continue;
                }

                try {
                    Order order = new Order();
                    order.order_id = orderObj.getInt("order_id");
                    order.order_tag = orderObj.optString("order_tag", null);
                    order.is_payment_done = orderObj.optBoolean("is_payment_done", false);
                    order.order_total = orderObj.optInt("order_total", 0);
                    if (orderObj.has("display_id") && !orderObj.isNull("display_id")) {
                        order.display_id = orderObj.getInt("display_id");
                    }
                    order.order_status = parseOrderStatus(orderObj.optString("order_status", null));
                    String createdAt = orderObj.optString("created_at", null);
                    order.created_at = (createdAt == null || createdAt.isEmpty()) ? null : createdAt;
                    db.orderDao().insertOrder(order);
                    restoredOrderIds.add(order.order_id);
                    restoredCounts[1]++;
                } catch (Exception exception) {
                    skippedCounts[1]++;
                    addWarning(warnings, "Skipped order at index " + index + ": " + exception.getMessage());
                }
            }

            for (int index = 0; index < orderItemsArray.length(); index++) {
                JSONObject itemObj = orderItemsArray.optJSONObject(index);
                if (itemObj == null) {
                    skippedCounts[2]++;
                    addWarning(warnings, "Skipped order item at index " + index + ": invalid JSON object");
                    continue;
                }

                try {
                    int orderId = itemObj.getInt("order_id");
                    int dishId = itemObj.getInt("dish_id");

                    // Prevent foreign key failures by validating restored parent rows first.
                    if (!restoredOrderIds.contains(orderId) || !restoredDishIds.contains(dishId)) {
                        skippedCounts[2]++;
                        addWarning(warnings, "Skipped order item at index " + index + ": missing order_id or dish_id reference");
                        continue;
                    }

                    OrderItem item = new OrderItem();
                    item.order_item_id = itemObj.getInt("order_item_id");
                    item.order_id = orderId;
                    item.dish_id = dishId;
                    item.quantity = itemObj.optInt("quantity", 1);
                    item.dish_name_snapshot = itemObj.getString("dish_name_snapshot");
                    item.price_snapshot = itemObj.optInt("price_snapshot", 0);
                    item.item_status = parseItemStatus(itemObj.optString("item_status", null));
                    db.orderItemDao().insertItem(item);
                    restoredCounts[2]++;
                } catch (Exception exception) {
                    skippedCounts[2]++;
                    addWarning(warnings, "Skipped order item at index " + index + ": " + exception.getMessage());
                }
            }
        }));

        JSONObject result = new JSONObject();
        int totalRestored = restoredCounts[0] + restoredCounts[1] + restoredCounts[2];
        int totalSkipped = skippedCounts[0] + skippedCounts[1] + skippedCounts[2];

        result.put("success", totalRestored > 0 || (dishesArray.length() + ordersArray.length() + orderItemsArray.length() == 0));
        result.put("partial_restore", totalSkipped > 0);
        result.put("message", buildRestoreMessage(wipeExistingData, totalRestored, totalSkipped));
        result.put("restored_dishes", restoredCounts[0]);
        result.put("restored_orders", restoredCounts[1]);
        result.put("restored_order_items", restoredCounts[2]);
        result.put("skipped_dishes", skippedCounts[0]);
        result.put("skipped_orders", skippedCounts[1]);
        result.put("skipped_order_items", skippedCounts[2]);
        result.put("total_restored", totalRestored);
        result.put("total_skipped", totalSkipped);

        JSONArray warningArray = new JSONArray();
        for (String warning : warnings) {
            warningArray.put(warning);
        }
        result.put("warnings", warningArray);

        return result;
    }

    private static void addWarning(List<String> warnings, String warning) {
        if (warnings.size() < 25) {
            warnings.add(warning);
        }
    }

    private static OrderStatus parseOrderStatus(String raw) {
        if (raw == null) {
            return OrderStatus.OPEN;
        }
        try {
            return OrderStatus.valueOf(raw);
        } catch (IllegalArgumentException exception) {
            return OrderStatus.OPEN;
        }
    }

    private static ItemStatus parseItemStatus(String raw) {
        if (raw == null) {
            return ItemStatus.PENDING;
        }
        try {
            return ItemStatus.valueOf(raw);
        } catch (IllegalArgumentException exception) {
            return ItemStatus.PENDING;
        }
    }

    private static String buildRestoreMessage(boolean wipeExistingData, int totalRestored, int totalSkipped) {
        StringBuilder message = new StringBuilder();
        if (wipeExistingData) {
            message.append("Current data wiped. ");
        }

        if (totalRestored == 0 && totalSkipped > 0) {
            message.append("No records could be restored");
        } else if (totalRestored == 0) {
            message.append("Backup contained no records to restore");
        } else {
            message.append("Restore completed with ").append(totalRestored).append(" records imported");
        }

        if (totalSkipped > 0) {
            message.append(" and ").append(totalSkipped).append(" skipped");
        }

        return message.toString();
    }
}

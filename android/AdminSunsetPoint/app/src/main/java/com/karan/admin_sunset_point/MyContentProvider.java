package com.karan.admin_sunset_point;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.UriMatcher;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.util.Log; // Import Log

import com.google.gson.Gson;
import com.karan.admin_sunset_point.data.AppDatabase;
import com.karan.admin_sunset_point.data.Responses.OrderItemResponse;
import com.karan.admin_sunset_point.data.Responses.OrderResponse;
import com.karan.admin_sunset_point.data.entity.*;
import com.karan.admin_sunset_point.data.entity.OrderWithItemsRow;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.*;

public class MyContentProvider extends ContentProvider {

    // TAG for filtering in Logcat
    private static final String TAG = "OrderProvider";

    private AppDatabase db;
    private Gson gson = new Gson();

    private static final String AUTHORITY =
            "com.karan.sunset_point.provider";

    // URI Codes
    private static final int ORDERS = 1;
    private static final int DISHES = 2;
    private static final int ORDER_PRINT = 3;
    private static final int DELETE_ITEM = 4;

    private static final UriMatcher uriMatcher;

    static {
        uriMatcher = new UriMatcher(UriMatcher.NO_MATCH);
        uriMatcher.addURI(AUTHORITY, "orders", ORDERS);
        uriMatcher.addURI(AUTHORITY, "dishes", DISHES);
        uriMatcher.addURI(AUTHORITY, "orderPrint/#", ORDER_PRINT);
        uriMatcher.addURI(AUTHORITY, "deleteItem/#", DELETE_ITEM);
    }

    @Override
    public boolean onCreate() {
        Log.d(TAG, "onCreate: Initializing MyContentProvider...");
        try {
            db = AppDatabase.getInstance(getContext());
            Log.d(TAG, "onCreate: Database instance obtained.");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "onCreate: Failed to initialize DB", e);
            return false;
        }
    }

    // =====================================================
    // QUERY (READ)
    // =====================================================

    @Override
    public Cursor query(Uri uri, String[] projection,
                        String selection, String[] selectionArgs,
                        String sortOrder) {

        Log.d(TAG, "query: Incoming URI -> " + uri.toString());
        MatrixCursor cursor = new MatrixCursor(new String[]{"json"});

        try {
            String jsonResult = "{}";

            switch (uriMatcher.match(uri)) {

                case ORDERS:
                    Log.d(TAG, "query: Matched ORDERS. Fetching all orders...");
                    jsonResult = getOrdersJson();
                    Log.d(TAG, "query: Orders JSON generated. Length: " + jsonResult.length());
                    break;

                case DISHES:
                    Log.d(TAG, "query: Matched DISHES. Fetching menu...");
                    jsonResult = getDishesJson();
                    Log.d(TAG, "query: Dishes JSON generated. Length: " + jsonResult.length());
                    break;

                case ORDER_PRINT:
                    String idStr = uri.getLastPathSegment();
                    Log.d(TAG, "query: Matched ORDER_PRINT. ID: " + idStr);
                    int orderId = Integer.parseInt(idStr);
                    jsonResult = getOrderPrintJson(orderId);
                    break;

                default:
                    Log.e(TAG, "query: Unknown URI match.");
                    throw new IllegalArgumentException("Unknown URI: " + uri);
            }

            cursor.addRow(new Object[]{ jsonResult });

        } catch (Exception e){
            Log.e(TAG, "query: EXCEPTION occurred", e);
            cursor.addRow(new Object[]{"{}"});
        }

        return cursor;
    }

    // =====================================================
    // INSERT (CREATE ORDER)
    // =====================================================

    @Override
    public Uri insert(Uri uri, ContentValues values) {

        Log.d(TAG, "insert: Incoming URI -> " + uri.toString());

        try {

            if (uri.getPath().contains("createOrder")) {
                String tag = values.getAsString("tag");
                String itemsJson = values.getAsString("items");

                Log.d(TAG, "insert: Creating Order. Tag: " + tag + ", ItemsJSON Length: " + (itemsJson != null ? itemsJson.length() : "null"));

                List<OrderItem> items = Arrays.asList(
                        gson.fromJson(itemsJson, OrderItem[].class)
                );

                createOrder(tag, items);
                Log.d(TAG, "insert: Order creation logic completed.");
            } else {
                Log.w(TAG, "insert: URI path did not match 'createOrder'.");
            }

        } catch (Exception e){
            Log.e(TAG, "insert: EXCEPTION", e);
        }

        return uri;
    }

    // =====================================================
    // UPDATE (TOGGLES / CLOSE / CANCEL)
    // =====================================================

    @Override
    public int update(Uri uri, ContentValues values,
                      String selection, String[] selectionArgs) {

        Log.d(TAG, "update: Incoming URI -> " + uri.toString());
        int result = 0; // Default to 0 (Failure)

        try {
            String path = uri.getPath();

            if (path.contains("toggleServed")) {
                int orderId = values.getAsInteger("orderId");
                int itemId = values.getAsInteger("itemId");
                // Store the result (1 or 2)
                result = toggleServed(orderId, itemId);
                Log.d(TAG, "update: toggleServed returned state code: " + result);

            } else if (path.contains("togglePayment")) {
                int orderId = values.getAsInteger("orderId");
                // Store the result (1 or 2)
                result = togglePayment(orderId);
                Log.d(TAG, "update: togglePayment returned state code: " + result);

            } else if (path.contains("closeOrder")) {
                int orderId = values.getAsInteger("orderId");
                closeOrder(orderId);
                result = 1; // Standard success

            } else if (path.contains("cancelOrder")) {
                int orderId = values.getAsInteger("orderId");
                cancelOrder(orderId);
                result = 1; // Standard success
            }

        } catch (Exception e){
            Log.e(TAG, "update: EXCEPTION", e);
            result = 0;
        }

        return result;
    }
    // =====================================================
    // DELETE
    // =====================================================

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {

        Log.d(TAG, "delete: Incoming URI -> " + uri.toString());

        try {

            if (uriMatcher.match(uri) == DELETE_ITEM) {
                String idStr = uri.getLastPathSegment();
                Log.d(TAG, "delete: Removing Item ID: " + idStr);
                int itemId = Integer.parseInt(idStr);
                db.orderItemDao().deleteItem(itemId);
                Log.d(TAG, "delete: Item removed successfully.");
            } else {
                Log.w(TAG, "delete: URI did not match DELETE_ITEM.");
            }

        } catch (Exception e){
            Log.e(TAG, "delete: EXCEPTION", e);
        }

        return 1;
    }

    // =====================================================
    // JSON BUILDERS
    // =====================================================

    private String getOrdersJson() {
        Log.d(TAG, "getOrdersJson: Querying DB for today's orders...");
        List<OrderWithItemsRow> rows = db.orderDao().getTodayOrders();
        Log.d(TAG, "getOrdersJson: DB returned " + rows.size() + " raw rows.");

        Map<Integer, OrderResponse> map = new LinkedHashMap<>();

        for (OrderWithItemsRow row : rows) {
            OrderResponse order = map.get(row.order_id);
            if (order == null) {
                order = new OrderResponse();
                order.id = row.order_id;
                order.tag = row.order_tag;
                order.createdAt = row.created_at;
                order.status = row.order_status;
                order.paymentDone = row.is_payment_done;
                order.orderTotal = row.order_total;
                map.put(row.order_id, order);
            }

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

        Log.d(TAG, "getOrdersJson: Processed into " + map.size() + " unique orders.");
        return gson.toJson(new ArrayList<>(map.values()));
    }

    private String getDishesJson() throws Exception {
        Log.d(TAG, "getDishesJson: Querying all dishes...");
        List<Dish> dishes = db.dishDao().getAllDishes();
        Log.d(TAG, "getDishesJson: Found " + dishes.size() + " dishes.");

        Map<String, JSONArray> grouped = new LinkedHashMap<>();

        for (Dish d : dishes) {
            if (!grouped.containsKey(d.category))
                grouped.put(d.category, new JSONArray());

            JSONObject j = new JSONObject();
            j.put("id", d.dish_id);
            j.put("name", d.dish_name);
            j.put("price", d.price);

            grouped.get(d.category).put(j);
        }

        JSONObject res = new JSONObject();
        for (Map.Entry<String, JSONArray> e : grouped.entrySet()) {
            res.put(e.getKey(), e.getValue());
        }

        return res.toString();
    }

    private String getOrderPrintJson(int orderId) {
        Log.d(TAG, "getOrderPrintJson: Fetching order details for ID: " + orderId);
        List<OrderWithItemsRow> rows = db.orderDao().getOrderForPrint(orderId);

        if(rows.isEmpty()){
            Log.w(TAG, "getOrderPrintJson: No rows found for Order ID: " + orderId);
            return "{}";
        }

        Map<Integer, OrderResponse> map = new LinkedHashMap<>();

        for (OrderWithItemsRow row : rows) {
            OrderResponse order = map.get(row.order_id);
            if (order == null) {
                order = new OrderResponse();
                order.id = row.order_id;
                order.tag = row.order_tag;
                order.createdAt = row.created_at;
                order.status = row.order_status;
                order.paymentDone = row.is_payment_done;
                order.orderTotal = row.order_total;
                map.put(row.order_id, order);
            }

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

        return gson.toJson(map.values().iterator().next());
    }

    // =====================================================
    // DB ACTIONS
    // =====================================================

    private void createOrder(String tag, List<OrderItem> items) {
        Log.d(TAG, "createOrder: processing DB insert...");
        Order order = new Order();
        order.order_tag = tag;
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault());
        order.created_at = sdf.format(new Date());

        long id = db.orderDao().insertOrder(order);
        Log.d(TAG, "createOrder: Order Header inserted. New ID: " + id);

        for (OrderItem i : items) {
            i.order_id = (int) id;
            db.orderItemDao().insertItem(i);
        }
        Log.d(TAG, "createOrder: " + items.size() + " items inserted.");

        db.orderDao().recalcOrderTotal((int) id);
        Log.d(TAG, "createOrder: Total recalculated.");
    }

    private int toggleServed(int orderId, int itemId) {
        OrderItem item = db.orderItemDao().getOrderItemById(orderId, itemId);

        if(item == null) return 0;

        // Toggle logic
        if (item.item_status == ItemStatus.SERVED) {
            item.item_status = ItemStatus.PENDING;
        } else {
            item.item_status = ItemStatus.SERVED;
        }

        db.orderItemDao().updateItemStatus(itemId, item.item_status);

        // Return 1 if SERVED, 2 if PENDING
        return (item.item_status == ItemStatus.SERVED) ? 1 : 2;
    }

    /**
     * Returns 1 for PAID (True), 2 for UNPAID (False), 0 for Error
     */
    private int togglePayment(int orderId) {
        Order o = db.orderDao().getOrderById(orderId);
        if(o == null) return 0;

        boolean newVal = !o.is_payment_done;
        db.orderDao().setIsPayment(newVal, orderId);

        // Return 1 if True (Paid), 2 if False (Not Paid)
        return newVal ? 1 : 2;
    }

    private void closeOrder(int orderId) {
        Log.d(TAG, "closeOrder: Closing order " + orderId);
        db.orderItemDao().setServed(orderId);
        db.orderDao().closeOrder(orderId);
    }

    private void cancelOrder(int orderId) {
        Log.d(TAG, "cancelOrder: Cancelling order " + orderId);
        db.orderDao().cancelOrder(orderId);
    }

    @Override
    public String getType(Uri uri) {
        return "application/json";
    }
}
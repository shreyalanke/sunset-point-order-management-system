package com.karan.admin_sunset_point.data.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Transaction;

import com.karan.admin_sunset_point.data.entity.*;

import java.util.List;

@Dao
public interface OrderDao {

    @Insert
    long insertOrder(Order order);

    @Query("SELECT * FROM orders ORDER BY created_at DESC")
    List<Order> getAllOrders();

    @Query("SELECT * FROM orders WHERE order_id = :id")
    Order getOrderById(int id);

    @Query("UPDATE orders SET order_total = :total WHERE order_id = :orderId")
    void updateOrderTotal(int orderId, int total);

    @Query("        SELECT COALESCE(SUM(quantity * price_snapshot), 0)\n" +
            "        FROM order_items\n" +
            "        WHERE order_id = :orderId")
    int calculateOrderTotal(int orderId);

    @Transaction
    default void recalcOrderTotal(int orderId) {
        int total = calculateOrderTotal(orderId);
        updateOrderTotal(orderId, total);
    }

    @Query("        UPDATE orders\n" +
            "        SET order_status = 'CLOSED',\n" +
            "            is_payment_done = 1\n" +
            "        WHERE order_id = :orderId")
    void closeOrder(int orderId);

    @Query( "        UPDATE orders\n" +
            "        SET is_payment_done = :isPaymentDone\n" +
            "        WHERE order_id = :orderId")
    void setIsPayment(boolean isPaymentDone, int orderId);

    @Query("DELETE FROM orders WHERE order_id = :orderId")
    void cancelOrder(int orderId);

    /* ---------------- TODAY ORDERS ---------------- */

    @Query("        SELECT\n" +
            "          o.order_id,\n" +
            "          o.order_tag,\n" +
            "          o.created_at,\n" +
            "          o.order_status,\n" +
            "          o.is_payment_done,\n" +
            "          o.order_total,\n" +
            "\n" +
            "          oi.order_item_id,\n" +
            "          oi.quantity,\n" +
            "          oi.item_status,\n" +
            "          oi.price_snapshot AS price,\n" +
            "          oi.dish_name_snapshot AS dish_name,\n" +
            "\n" +
            "          d.dish_id,\n" +
            "          d.category\n" +
            "        FROM orders o\n" +
            "        LEFT JOIN order_items oi ON o.order_id = oi.order_id\n" +
            "        LEFT JOIN dishes d ON oi.dish_id = d.dish_id\n" +
            "        WHERE\n" +
            "            (\n" +
            "              o.created_at >= datetime('now', 'start of day')\n" +
            "              AND o.created_at <  datetime('now', 'start of day', '+1 day')\n" +
            "            )\n" +
            "            OR o.order_status = 'OPEN'\n" +
            "        ORDER BY o.created_at, oi.order_item_id")
    List<OrderWithItemsRow> getTodayOrders();

    /* ---------------- PRINT ---------------- */

    @Query("        SELECT\n" +
            "          o.order_id,\n" +
            "          o.order_tag,\n" +
            "          o.created_at,\n" +
            "          o.order_status,\n" +
            "          o.is_payment_done,\n" +
            "          o.order_total,\n" +
            "\n" +
            "          oi.order_item_id,\n" +
            "          oi.quantity,\n" +
            "          oi.item_status,\n" +
            "          oi.price_snapshot AS price,\n" +
            "          oi.dish_name_snapshot AS dish_name,\n" +
            "\n" +
            "          d.dish_id,\n" +
            "          d.category\n" +
            "        FROM orders o\n" +
            "        LEFT JOIN order_items oi ON o.order_id = oi.order_id\n" +
            "        LEFT JOIN dishes d ON oi.dish_id = d.dish_id\n" +
            "        WHERE o.order_id = :orderId")
    List<OrderWithItemsRow> getOrderForPrint(int orderId);

    /* ---------------- SUMMARY ---------------- */

    @Query("        SELECT\n" +
            "            COALESCE(SUM(o.order_total), 0) AS total_revenue,\n" +
            "            COUNT(o.order_id)               AS total_orders,\n" +
            "            AVG(o.order_total)              AS avg_order_value,\n" +
            "            AVG(COALESCE(oi.item_count, 0)) AS avg_number_of_items_per_order\n" +
            "        FROM orders o\n" +
            "        LEFT JOIN (\n" +
            "            SELECT order_id, SUM(quantity) AS item_count\n" +
            "            FROM order_items\n" +
            "            WHERE item_status != 'CANCELLED'\n" +
            "            GROUP BY order_id\n" +
            "        ) oi ON oi.order_id = o.order_id\n" +
            "        WHERE\n" +
            "            o.order_status = 'CLOSED'\n" +
            "            AND o.is_payment_done = 1\n" +
            "            AND o.created_at >= datetime(:start, 'start of day')\n" +
            "            AND o.created_at <  datetime(:end, '+1 day')")
    OrderSummary getOrderSummary(String start, String end);

    /* ---------------- CATEGORY PERFORMANCE ---------------- */

    @Query("        SELECT\n" +
            "            d.category AS name,\n" +
            "            SUM(oi.quantity * oi.price_snapshot) AS sales,\n" +
            "            SUM(oi.quantity) AS quantity\n" +
            "        FROM order_items oi\n" +
            "        JOIN orders o ON o.order_id = oi.order_id\n" +
            "        JOIN dishes d ON d.dish_id = oi.dish_id\n" +
            "        WHERE\n" +
            "            o.order_status = 'CLOSED'\n" +
            "            AND o.is_payment_done = 1\n" +
            "            AND o.created_at >= datetime(:start, 'start of day')\n" +
            "            AND o.created_at <  datetime(:end, '+1 day')\n" +
            "        GROUP BY d.category\n" +
            "        ORDER BY sales DESC\n" +
            "        LIMIT 4")
    List<CategoryPerformance> getTopCategories(String start, String end);

    /* ---------------- HOURLY RUSH ---------------- */

    @Query("\n" +
            "        WITH RECURSIVE hours(hour) AS (\n" +
            "            SELECT 0\n" +
            "            UNION ALL\n" +
            "            SELECT hour + 1 FROM hours WHERE hour < 23\n" +
            "        ),\n" +
            "        hourly_orders AS (\n" +
            "            SELECT\n" +
            "                CAST(strftime('%H', o.created_at) AS INTEGER) AS hour,\n" +
            "                COUNT(o.order_id) AS orders\n" +
            "            FROM orders o\n" +
            "            WHERE\n" +
            "                o.order_status = 'CLOSED'\n" +
            "                AND o.is_payment_done = 1\n" +
            "                AND o.created_at >= datetime(:start, 'start of day')\n" +
            "                AND o.created_at <  datetime(:end, '+1 day')\n" +
            "            GROUP BY hour\n" +
            "        )\n" +
            "        SELECT\n" +
            "            h.hour AS hour,\n" +
            "            COALESCE(ROUND(AVG(o.orders)), 0) AS avg_orders\n" +
            "        FROM hours h\n" +
            "        LEFT JOIN hourly_orders o ON o.hour = h.hour\n" +
            "        GROUP BY h.hour\n" +
            "        ORDER BY h.hour\n" +
            "    ")
    List<HourlyRush> getHourlyRush(String start, String end);

    /* ---------------- SALES TREND ---------------- */

    @Query("\n" +
            "        WITH RECURSIVE days(day) AS (\n" +
            "            SELECT date(:startDate)\n" +
            "            UNION ALL\n" +
            "            SELECT date(day, '+1 day')\n" +
            "            FROM days\n" +
            "            WHERE day < date(:endDate)\n" +
            "        ),\n" +
            "        aggregated AS (\n" +
            "            SELECT\n" +
            "                date(o.created_at) AS day,\n" +
            "                SUM(o.order_total) AS sales,\n" +
            "                COUNT(o.order_id)  AS orders,\n" +
            "                ROUND(AVG(o.order_total)) AS aov\n" +
            "            FROM orders o\n" +
            "            WHERE\n" +
            "                o.order_status = 'CLOSED'\n" +
            "                AND o.is_payment_done = 1\n" +
            "                AND o.created_at >= datetime(:startDate, 'start of day')\n" +
            "                AND o.created_at <  datetime(:endDate, '+1 day')\n" +
            "            GROUP BY date(o.created_at)\n" +
            "        )\n" +
            "        SELECT\n" +
            "            d.day AS date,\n" +
            "            COALESCE(a.sales, 0)  AS sales,\n" +
            "            COALESCE(a.orders, 0) AS orders,\n" +
            "            COALESCE(a.aov, 0)    AS aov\n" +
            "        FROM days d\n" +
            "        LEFT JOIN aggregated a ON a.day = d.day\n" +
            "        ORDER BY d.day")
    List<SalesTrend> getSalesTrend(String startDate, String endDate);

    /* ---------------- ORDER SIZE DISTRIBUTION ---------------- */

    @Query("WITH order_item_counts AS (\n" +
            "            SELECT\n" +
            "                o.order_id,\n" +
            "                SUM(oi.quantity) AS item_count\n" +
            "            FROM orders o\n" +
            "            JOIN order_items oi ON oi.order_id = o.order_id\n" +
            "            WHERE\n" +
            "                o.order_status = 'CLOSED'\n" +
            "                AND o.is_payment_done = 1\n" +
            "                AND oi.item_status != 'CANCELLED'\n" +
            "                AND o.created_at >= datetime(:start, 'start of day')\n" +
            "                AND o.created_at <  datetime(:end, '+1 day')\n" +
            "            GROUP BY o.order_id\n" +
            "        )\n" +
            "        SELECT\n" +
            "            CASE\n" +
            "                WHEN item_count = 1 THEN '1 Item'\n" +
            "                WHEN item_count = 2 THEN '2 Items'\n" +
            "                WHEN item_count BETWEEN 3 AND 4 THEN '3-4 Items'\n" +
            "                ELSE '5+ Items'\n" +
            "            END AS size,\n" +
            "            COUNT(*) AS count\n" +
            "        FROM order_item_counts\n" +
            "        GROUP BY\n" +
            "            CASE\n" +
            "                WHEN item_count = 1 THEN '1 Item'\n" +
            "                WHEN item_count = 2 THEN '2 Items'\n" +
            "                WHEN item_count BETWEEN 3 AND 4 THEN '3-4 Items'\n" +
            "                ELSE '5+ Items'\n" +
            "            END\n" +
            "        ORDER BY\n" +
            "            CASE\n" +
            "                WHEN item_count = 1 THEN 1\n" +
            "                WHEN item_count = 2 THEN 2\n" +
            "                WHEN item_count BETWEEN 3 AND 4 THEN 3\n" +
            "                ELSE 4\n" +
            "            END\n" +
            "    ")
    List<OrderSizeDistribution> getOrderSizeDistribution(String start, String end);

    @Query("SELECT\n" +
            "        d.dish_id                    AS id,\n" +
            "        oi.dish_name_snapshot        AS name,\n" +
            "        d.category                   AS category,\n" +
            "        SUM(oi.quantity)             AS sales,\n" +
            "        SUM(oi.quantity * oi.price_snapshot) AS revenue\n" +
            "    FROM order_items oi\n" +
            "    JOIN orders o ON o.order_id = oi.order_id\n" +
            "    JOIN dishes d ON d.dish_id = oi.dish_id\n" +
            "    WHERE\n" +
            "        o.order_status = 'CLOSED'\n" +
            "        AND o.is_payment_done = 1\n" +
            "        AND oi.item_status != 'CANCELLED'\n" +
            "        AND o.created_at >= datetime(:start, 'start of day')\n" +
            "        AND o.created_at <  datetime(:end, '+1 day')\n" +
            "    GROUP BY\n" +
            "        d.dish_id,\n" +
            "        oi.dish_name_snapshot,\n" +
            "        d.category\n" +
            "    ORDER BY revenue DESC\n" +
            "    LIMIT :limit")
    List<DishPerformance> getTopDishesByRevenue(
            String start,
            String end,
            int limit
    );

    @Query("    SELECT\n" +
            "        d.dish_id                    AS id,\n" +
            "        oi.dish_name_snapshot        AS name,\n" +
            "        d.category                   AS category,\n" +
            "        SUM(oi.quantity)             AS sales,\n" +
            "        SUM(oi.quantity * oi.price_snapshot) AS revenue\n" +
            "    FROM order_items oi\n" +
            "    JOIN orders o ON o.order_id = oi.order_id\n" +
            "    JOIN dishes d ON d.dish_id = oi.dish_id\n" +
            "    WHERE\n" +
            "        o.order_status = 'CLOSED'\n" +
            "        AND o.is_payment_done = 1\n" +
            "        AND oi.item_status != 'CANCELLED'\n" +
            "        AND o.created_at >= datetime(:start, 'start of day')\n" +
            "        AND o.created_at <  datetime(:end, '+1 day')\n" +
            "    GROUP BY\n" +
            "        d.dish_id,\n" +
            "        oi.dish_name_snapshot,\n" +
            "        d.category\n" +
            "    ORDER BY sales DESC\n" +
            "    LIMIT :limit")
    List<DishPerformance> getTopDishesByQuantity(
            String start,
            String end,
            int limit
    );
}

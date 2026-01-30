package com.karan.sunset_point.data.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Transaction;

import com.karan.sunset_point.data.entity.Order;
import com.karan.sunset_point.data.entity.OrderWithItemsRow;

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

    @Query("SELECT COALESCE(SUM(quantity * price_snapshot), 0) FROM order_items WHERE order_id = :orderId")
    int calculateOrderTotal(int orderId);

    @Query("SELECT \n" +
            "  o.order_id,\n" +
            "  o.order_tag,\n" +
            "  o.created_at,\n" +
            "  o.order_status,\n" +
            "  o.is_payment_done,\n" +
            "  o.order_total,\n" +
            "\n" +
            "  oi.order_item_id,\n" +
            "  oi.quantity,\n" +
            "  oi.item_status,\n" +
            "  oi.price_snapshot AS price,\n" +
            "  oi.dish_name_snapshot AS dish_name,\n" +
            "\n" +
            "  d.dish_id,\n" +
            "  d.category\n" +
            "\n" +
            "FROM orders o\n" +
            "LEFT JOIN order_items oi\n" +
            "  ON o.order_id = oi.order_id\n" +
            "LEFT JOIN dishes d\n" +
            "  ON oi.dish_id = d.dish_id\n" +
            "\n" +
            "WHERE o.created_at >= datetime(date('now', '-4 hours'), '+4 hours')\n" +
            "AND   o.created_at <  datetime(date('now', '-4 hours', '+1 day'), '+4 hours')\n" +
            "OR o.order_status = 'OPEN'"+
            "\n" +
            "ORDER BY o.created_at, oi.order_item_id")
    List<OrderWithItemsRow> getTodayOrders();


    /** replaces trigger + function */
    @Transaction
    default void recalcOrderTotal(int orderId) {
        int total = calculateOrderTotal(orderId);
        updateOrderTotal(orderId, total);
    }

    @Query("UPDATE orders SET order_status = 'CLOSED',is_payment_done = 1 WHERE order_id = :orderId")
    void closeOrder(int orderId);

    @Query("UPDATE orders SET is_payment_done = :isPaymentDone WHERE order_id = :orderId")
    void setIsPayment(boolean isPaymentDone, int orderId);

    @Query("DELETE FROM orders WHERE order_id = :orderId")
    void cancelOrder(int orderId);

    @Query("SELECT \n" +
            "  o.order_id,\n" +
            "  o.order_tag,\n" +
            "  o.created_at,\n" +
            "  o.order_status,\n" +
            "  o.is_payment_done,\n" +
            "  o.order_total,\n" +
            "\n" +
            "  oi.order_item_id,\n" +
            "  oi.quantity,\n" +
            "  oi.item_status,\n" +
            "  oi.price_snapshot AS price,\n" +
            "  oi.dish_name_snapshot AS dish_name,\n" +
            "\n" +
            "  d.dish_id,\n" +
            "  d.category\n" +
            "\n" +
            "FROM orders o\n" +
            "LEFT JOIN order_items oi\n" +
            "  ON o.order_id = oi.order_id\n" +
            "LEFT JOIN dishes d\n" +
            "  ON oi.dish_id = d.dish_id\n" +
            "\n" +
            "WHERE o.order_id = :orderId")
    List<OrderWithItemsRow> getOrderForPrint(int orderId);

}

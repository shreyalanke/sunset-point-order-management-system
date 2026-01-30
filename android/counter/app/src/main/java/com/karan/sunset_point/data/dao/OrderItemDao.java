package com.karan.sunset_point.data.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Transaction;

import com.karan.sunset_point.data.entity.ItemStatus;
import com.karan.sunset_point.data.entity.OrderItem;

import java.util.List;

@Dao
public interface OrderItemDao {

    @Insert
    void insertItem(OrderItem item);

    @Query("SELECT * FROM order_items WHERE order_id = :orderId")
    List<OrderItem> getItemsForOrder(int orderId);

    @Query("UPDATE order_items SET item_status = :status WHERE order_item_id = :itemId ")
    void updateItemStatus(int itemId, ItemStatus status);

    @Query("DELETE FROM order_items WHERE order_item_id = :itemId")
    void deleteItem(int itemId);

    @Query("SELECT * FROM order_items WHERE order_id = :orderId AND order_item_id = :itemId")
    OrderItem getOrderItemById(int orderId, int itemId);

    @Query("UPDATE order_items SET item_status = 'SERVED' WHERE order_id = :orderId")
    void setServed(int orderId);
}

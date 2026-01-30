package com.karan.sunset_point.data.entity;

import androidx.room.Entity;
import androidx.room.ForeignKey;
import androidx.room.Index;
import androidx.room.PrimaryKey;
import androidx.annotation.NonNull;

@Entity(
        tableName = "order_items",
        foreignKeys = {
                @ForeignKey(
                        entity = Order.class,
                        parentColumns = "order_id",
                        childColumns = "order_id",
                        onDelete = ForeignKey.CASCADE
                ),
                @ForeignKey(
                        entity = Dish.class,
                        parentColumns = "dish_id",
                        childColumns = "dish_id"
                )
        },
        indices = {
                @Index("order_id"),
                @Index("dish_id")
        }
)
public class OrderItem {

    @PrimaryKey(autoGenerate = true)
    public int order_item_id;

    public int order_id;
    public int dish_id;

    public int quantity;

    @NonNull
    public String dish_name_snapshot;

    public int price_snapshot;

    @NonNull
    public ItemStatus item_status = ItemStatus.PENDING;
}

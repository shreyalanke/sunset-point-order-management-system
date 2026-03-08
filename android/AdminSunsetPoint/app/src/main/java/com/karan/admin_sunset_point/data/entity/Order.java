package com.karan.admin_sunset_point.data.entity;

import androidx.annotation.NonNull;
import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "orders")
public class Order {

    @PrimaryKey(autoGenerate = true)
    public int order_id;

    public String order_tag;

    public boolean is_payment_done = false;

    public int order_total = 0;

    public Integer display_id;

    @NonNull
    public OrderStatus order_status = OrderStatus.OPEN;

    @ColumnInfo(name = "created_at", defaultValue = "CURRENT_TIMESTAMP")
    public String created_at;
}

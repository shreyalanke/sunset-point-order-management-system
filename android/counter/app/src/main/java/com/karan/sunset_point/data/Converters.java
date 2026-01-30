package com.karan.sunset_point.data;

import androidx.room.TypeConverter;

import com.karan.sunset_point.data.entity.ItemStatus;
import com.karan.sunset_point.data.entity.OrderStatus;

public class Converters {

    @TypeConverter
    public static String fromOrderStatus(OrderStatus status) {
        return status == null ? null : status.name();
    }

    @TypeConverter
    public static OrderStatus toOrderStatus(String value) {
        return value == null ? null : OrderStatus.valueOf(value);
    }

    @TypeConverter
    public static String fromItemStatus(ItemStatus status) {
        return status == null ? null : status.name();
    }

    @TypeConverter
    public static ItemStatus toItemStatus(String value) {
        return value == null ? null : ItemStatus.valueOf(value);
    }

}

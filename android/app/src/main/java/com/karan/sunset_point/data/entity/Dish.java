package com.karan.sunset_point.data.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.annotation.NonNull;

@Entity(tableName = "dishes")
public class Dish {

    @PrimaryKey(autoGenerate = true)
    public int dish_id;

    @NonNull
    public String dish_name;

    @NonNull
    public String category;

    public int price;
}

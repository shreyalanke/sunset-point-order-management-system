package com.karan.sunset_point.data.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;
import androidx.room.Delete;

import com.karan.sunset_point.data.entity.Dish;

import java.util.List;

@Dao
public interface DishDao {

    @Insert
    long insertDish(Dish dish);

    @Update
    void updateDish(Dish dish);

    @Delete
    void deleteDish(Dish dish);

    @Query("SELECT * FROM dishes ORDER BY dish_id ASC")
    List<Dish> getAllDishes();

    @Query("SELECT * FROM dishes WHERE category = :category")
    List<Dish> getDishesByCategory(String category);

    @Query("SELECT * FROM dishes WHERE dish_id = :id LIMIT 1")
    Dish getDishById(int id);

    @Query("SELECT COUNT(*) FROM dishes")
    int countDishes();
}

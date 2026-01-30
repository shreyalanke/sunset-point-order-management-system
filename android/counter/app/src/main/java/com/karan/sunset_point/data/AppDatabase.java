package com.karan.sunset_point.data;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.sqlite.db.SupportSQLiteDatabase;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.karan.sunset_point.data.dao.DishDao;
import com.karan.sunset_point.data.dao.OrderDao;
import com.karan.sunset_point.data.dao.OrderItemDao;
import com.karan.sunset_point.data.entity.Dish;
import com.karan.sunset_point.data.entity.Order;
import com.karan.sunset_point.data.entity.OrderItem;

import org.json.JSONObject;

import java.lang.reflect.Type;
import java.util.List;
import java.util.concurrent.Executors;

@Database(
        entities = {
                Dish.class,
                OrderItem.class,
                Order.class
        },
        version = 4
)
public abstract class AppDatabase extends RoomDatabase {

    private static AppDatabase INSTANCE;

    public abstract DishDao dishDao();
    public abstract OrderDao orderDao();
    public abstract OrderItemDao orderItemDao();

    public static synchronized AppDatabase getInstance(Context context) {
        if (INSTANCE == null) {
            INSTANCE = Room.databaseBuilder(
                    context.getApplicationContext(),
                    AppDatabase.class,
                    "pos_db"
            ).fallbackToDestructiveMigration(true)
            .addCallback(new RoomDatabase.Callback() {
                @Override
                public void onOpen(@NonNull SupportSQLiteDatabase db) {
                    super.onOpen(db);
                    seedIfNeeded();
                }
            })
            .build();
        }
        return INSTANCE;
    }

    private static void seedIfNeeded() {

        Executors.newSingleThreadExecutor().execute(() -> {
            AppDatabase db = INSTANCE;


            // 🔑 Guard: only seed if empty
            if (db.dishDao().countDishes() > 0) {
                return;
            }

            String dishSeed = "[{\"dish_name\":\"Tea\",\"category\":\"Hot Beverage\",\"price\":20},{\"dish_name\":\"Green Tea\",\"category\":\"Hot Beverage\",\"price\":30},{\"dish_name\":\"Black Tea\",\"category\":\"Hot Beverage\",\"price\":20},{\"dish_name\":\"Hot Coffee\",\"category\":\"Hot Beverage\",\"price\":30},{\"dish_name\":\"Black Coffee\",\"category\":\"Hot Beverage\",\"price\":25},{\"dish_name\":\"Plain Hot Chocolate\",\"category\":\"Hot Beverage\",\"price\":40},{\"dish_name\":\"Cold Coffee\",\"category\":\"Cold Coffee\",\"price\":50},{\"dish_name\":\"Cold Coffee with Crush\",\"category\":\"Cold Coffee\",\"price\":70},{\"dish_name\":\"Lemon Ice Tea\",\"category\":\"Refresher\",\"price\":50},{\"dish_name\":\"Peach Ice Tea\",\"category\":\"Refresher\",\"price\":50},{\"dish_name\":\"Mint Mojito\",\"category\":\"Refresher\",\"price\":80},{\"dish_name\":\"Green Apple Mojito\",\"category\":\"Refresher\",\"price\":80},{\"dish_name\":\"Blue Berry Smoothie\",\"category\":\"Smoothie\",\"price\":110},{\"dish_name\":\"Strawberry Smoothie\",\"category\":\"Smoothie\",\"price\":110},{\"dish_name\":\"Mango Smoothie\",\"category\":\"Smoothie\",\"price\":110},{\"dish_name\":\"Oreo Smoothie\",\"category\":\"Smoothie\",\"price\":120},{\"dish_name\":\"Dark Chocolate Smoothie\",\"category\":\"Smoothie\",\"price\":130},{\"dish_name\":\"Kit Kat Shake\",\"category\":\"Shake\",\"price\":110},{\"dish_name\":\"Java Choco Chip Shake\",\"category\":\"Shake\",\"price\":120},{\"dish_name\":\"Brownie Shake\",\"category\":\"Shake\",\"price\":130},{\"dish_name\":\"Nutella Shake\",\"category\":\"Shake\",\"price\":140},{\"dish_name\":\"Oreo Shake\",\"category\":\"Shake\",\"price\":100},{\"dish_name\":\"Butter Scotch Shake\",\"category\":\"Shake\",\"price\":100},{\"dish_name\":\"Rose Shake\",\"category\":\"Shake\",\"price\":90},{\"dish_name\":\"Green Chatni Sandwich\",\"category\":\"Sandwich\",\"price\":60},{\"dish_name\":\"Triple Cheese Sandwich\",\"category\":\"Sandwich\",\"price\":80},{\"dish_name\":\"Chocolate Sandwich\",\"category\":\"Sandwich\",\"price\":80},{\"dish_name\":\"Bombay Masala Sandwich\",\"category\":\"Sandwich\",\"price\":80},{\"dish_name\":\"Classic Club Sandwich\",\"category\":\"Sandwich\",\"price\":100},{\"dish_name\":\"Paneer Sandwich\",\"category\":\"Sandwich\",\"price\":120},{\"dish_name\":\"Mexican Sandwich\",\"category\":\"Sandwich\",\"price\":130},{\"dish_name\":\"Cheese Corn Sandwich\",\"category\":\"Sandwich\",\"price\":110},{\"dish_name\":\"Extra Spicy Sandwich\",\"category\":\"Sandwich\",\"price\":120},{\"dish_name\":\"Plain Maggi\",\"category\":\"Maggi\",\"price\":50},{\"dish_name\":\"Masala Maggi\",\"category\":\"Maggi\",\"price\":60},{\"dish_name\":\"Cheese Masala Maggi\",\"category\":\"Maggi\",\"price\":70},{\"dish_name\":\"Italian Maggi\",\"category\":\"Maggi\",\"price\":90},{\"dish_name\":\"Peri Peri Cheese Maggi\",\"category\":\"Maggi\",\"price\":80},{\"dish_name\":\"Cheese Corn Maggi\",\"category\":\"Maggi\",\"price\":80},{\"dish_name\":\"Alfredo Pasta (White)\",\"category\":\"Pasta\",\"price\":160},{\"dish_name\":\"Arrabiata Pasta (Red)\",\"category\":\"Pasta\",\"price\":160},{\"dish_name\":\"Pink Pasta (Red + White)\",\"category\":\"Pasta\",\"price\":180},{\"dish_name\":\"Indian Pasta (All Veggies)\",\"category\":\"Pasta\",\"price\":120},{\"dish_name\":\"Salted Fries\",\"category\":\"Fries\",\"price\":60},{\"dish_name\":\"Peri Peri Fries\",\"category\":\"Fries\",\"price\":80},{\"dish_name\":\"Cheese Peri Peri Fries\",\"category\":\"Fries\",\"price\":100},{\"dish_name\":\"Chipotle Fries\",\"category\":\"Fries\",\"price\":120},{\"dish_name\":\"Cheese Corn Balls (6 pcs)\",\"category\":\"Fries\",\"price\":120},{\"dish_name\":\"Margarita Pizza\",\"category\":\"Pizza\",\"price\":100},{\"dish_name\":\"Cheese Chilli Toast\",\"category\":\"Pizza\",\"price\":80},{\"dish_name\":\"Cheese Burst Pizza\",\"category\":\"Pizza\",\"price\":100},{\"dish_name\":\"Corn Cheese Pizza\",\"category\":\"Pizza\",\"price\":110},{\"dish_name\":\"Mexican Cheese Pizza\",\"category\":\"Pizza\",\"price\":140},{\"dish_name\":\"Tandoori Paneer Pizza\",\"category\":\"Pizza\",\"price\":150},{\"dish_name\":\"Mix Veg Cheese Pizza\",\"category\":\"Pizza\",\"price\":160},{\"dish_name\":\"Pasta Pizza\",\"category\":\"Pizza\",\"price\":180},{\"dish_name\":\"Special Pizza\",\"category\":\"Pizza\",\"price\":200},{\"dish_name\":\"Crispy Veg Burger\",\"category\":\"Burger\",\"price\":80},{\"dish_name\":\"Crispy Veg Cheese Burger\",\"category\":\"Burger\",\"price\":100},{\"dish_name\":\"Crispy Veg Schezwan Burger\",\"category\":\"Burger\",\"price\":100},{\"dish_name\":\"Crispy Paneer Burger\",\"category\":\"Burger\",\"price\":120},{\"dish_name\":\"Crispy Paneer Cheese Burger\",\"category\":\"Burger\",\"price\":130},{\"dish_name\":\"Crispy Paneer Schezwan Burger\",\"category\":\"Burger\",\"price\":140},{\"dish_name\":\"Crispy Paneer Chipotle Burger\",\"category\":\"Burger\",\"price\":150},{\"dish_name\":\"Crispy Paneer + Veg Burger\",\"category\":\"Burger\",\"price\":200},{\"dish_name\":\"Crispy Double Decker Burger\",\"category\":\"Burger\",\"price\":190},{\"dish_name\":\"Veg Steam Momo\",\"category\":\"Momo\",\"price\":80},{\"dish_name\":\"Paneer Steam Momo\",\"category\":\"Momo\",\"price\":90},{\"dish_name\":\"Veg Fried Momo\",\"category\":\"Momo\",\"price\":90},{\"dish_name\":\"Paneer Fried Momo\",\"category\":\"Momo\",\"price\":100},{\"dish_name\":\"Veg Tandoori Momo\",\"category\":\"Momo\",\"price\":120},{\"dish_name\":\"Paneer Tandoori Momo\",\"category\":\"Momo\",\"price\":130},{\"dish_name\":\"Veg Mexican Momo\",\"category\":\"Momo\",\"price\":150},{\"dish_name\":\"Paneer Mexican Momo\",\"category\":\"Momo\",\"price\":160},{\"dish_name\":\"Veg + Paneer Steam Momo\",\"category\":\"Momo\",\"price\":100},{\"dish_name\":\"Veg + Paneer Fried Momo\",\"category\":\"Momo\",\"price\":120},{\"dish_name\":\"Cheese\",\"category\":\"Extra\",\"price\":30},{\"dish_name\":\"Water Bottle\",\"category\":\"Misc\",\"price\":20},{\"dish_name\":\"Cigarettes\",\"category\":\"Misc\",\"price\":25}]";

            Gson gson = new Gson();

            Type listType = new TypeToken<List<Dish>>() {}.getType();
            List<Dish> dishes = gson.fromJson(dishSeed, listType);

            for (Dish dish : dishes) {
                dish.price*=100;
                Log.d("dishName", dish.dish_name);
                db.dishDao().insertDish(dish);
            }
        });
    }
}

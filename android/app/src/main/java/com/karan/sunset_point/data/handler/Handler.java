package com.karan.sunset_point.data.handler;

import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

import com.karan.sunset_point.App;
import com.karan.sunset_point.data.AppDatabase;
import com.karan.sunset_point.data.entity.Dish;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class Handler {
    private static Handler handler;
    private AppDatabase appDatabase;

    private Handler(){
        appDatabase = AppDatabase.getInstance(App.context);
    }

    public static Handler getInstance(){
        if(handler == null){
            handler = new Handler();
        }
        return handler;
    }

    private WebResourceResponse getDishes() {
        try {
            List<Dish> dishes = appDatabase.dishDao().getAllDishes();

            // category -> list of dishes
            Map<String, JSONArray> grouped = new LinkedHashMap<>();

            for (Dish dish : dishes) {
                if (!grouped.containsKey(dish.category)) {
                    grouped.put(dish.category, new JSONArray());
                }

                JSONObject dishJson = new JSONObject();
                dishJson.put("id", dish.dish_id);
                dishJson.put("name", dish.dish_name);
                dishJson.put("price", dish.price);

                Objects.requireNonNull(grouped.get(dish.category)).put(dishJson);
            }

            JSONObject responseJson = new JSONObject();
            for (Map.Entry<String, JSONArray> entry : grouped.entrySet()) {
                responseJson.put(entry.getKey(), entry.getValue());
            }

            InputStream stream = new ByteArrayInputStream(
                    responseJson.toString().getBytes(StandardCharsets.UTF_8)
            );

            return new WebResourceResponse(
                    "application/json",
                    "UTF-8",
                    stream
            );

        } catch (Exception e) {
            e.printStackTrace();
            return new WebResourceResponse(
                    "application/json",
                    "UTF-8",
                    new ByteArrayInputStream("{}".getBytes())
            );
        }
    }


    public static WebResourceResponse handleRequest(WebResourceRequest request, String path, String method) {
        if(path.startsWith("/dishes") && method.equals("GET")){
            return getInstance().getDishes();
        }
        return null;
    }
}

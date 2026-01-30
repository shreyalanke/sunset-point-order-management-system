package com.karan.sunset_point.data.handler;

import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.karan.sunset_point.data.entity.OrderItem;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

public class NativeApi {
    private final Executor executor = Executors.newSingleThreadExecutor();
    private final WebView webView;

    public NativeApi(WebView webView) {
        this.webView = webView;
    }
    @JavascriptInterface
    public void getDishes(String requestId) {
        executor.execute(() -> {
            String result;

            try {
                result = Handler.getInstance().getDishes();
            } catch (Exception e) {
                result = "{\"success\":false,\"error\":\"" + e.getMessage() + "\"}";
            }

            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) + "," +
                    JSONObject.quote(result) +
                    ")";

            webView.post(() ->
                    webView.evaluateJavascript(js, null)
            );
        });
    }

    @JavascriptInterface
    public void createOrder(String requestId, String orderJson) {
        executor.execute(() -> {
            try {
                JSONObject orderObj = new JSONObject(orderJson);

                String tag = orderObj.getString("tag");
                JSONArray itemsArray = orderObj.getJSONArray("items");

                List<OrderItem> items = new ArrayList<>();

                for (int i = 0; i < itemsArray.length(); i++) {
                    JSONObject itemObj = itemsArray.getJSONObject(i);

                    OrderItem item = new OrderItem();
                    item.dish_id = itemObj.getInt("id");
                    item.dish_name_snapshot = itemObj.getString("name");
                    item.price_snapshot = itemObj.getInt("price");
                    item.quantity = itemObj.getInt("quantity");
                    items.add(item);
                }

                Handler.getInstance().createOrder(tag, items);

            } catch (Exception e) {
                e.printStackTrace();
            }

            String result = "{\"success\":false,\"error\":\"karan suthar\"}";

            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) + "," + JSONObject.quote(result) +
                    ")";

            webView.post(() ->
                    webView.evaluateJavascript(js, null)
            );
        });
    }
    @JavascriptInterface
    public void getOrders(String requestId){
        executor.execute(() -> {
            String result;
            try {
                result = Handler.getInstance().getOrders();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }

            Log.d("tag",result);

            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) + "," + JSONObject.quote(result) + ");";
            webView.post(() -> webView.evaluateJavascript(js, null));
        });
    }

    @JavascriptInterface
    public void toggleServedStatus(String requestId,String orderId_s,String itemId_s){
        executor.execute(() -> {
            String result = "";
            try{
                int orderId = Integer.parseInt(orderId_s);
                int itemId = Integer.parseInt(itemId_s);
                result = Handler.getInstance().toggleServedStatus(orderId,itemId);
            } catch (Exception e) {
                e.printStackTrace();
            }
            JSONObject obj = new JSONObject();
            try {
                obj.put("status", result);
            } catch (JSONException e) {
                e.printStackTrace();
            }

            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) + "," +
                    JSONObject.quote(obj.toString()) +
                    ");";

            webView.post(() -> webView.evaluateJavascript(js, null));
        });
    }

    @JavascriptInterface
    public void closeOrder(String requestId,String orderId_s){
        executor.execute(()->{
            try{
                int orderId = Integer.parseInt(orderId_s);
                Handler.getInstance().closeOrder(orderId);
            } catch (Exception e){
                e.printStackTrace();
            }
            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) +
                    ");";

            webView.post(()->webView.evaluateJavascript(js,null));
        });
    }

    @JavascriptInterface
    public void deleteItemFromOrder(String requestId, String itemId_s){
        executor.execute(()->{
            try{
                int itemId = Integer.parseInt(itemId_s);
                Handler.getInstance().deleteOrderItem(itemId);
            } catch (Exception e) {
                e.printStackTrace();
            }

            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) +
                    ");";
            webView.post(()->webView.evaluateJavascript(js,null));
        });
    }

    @JavascriptInterface
    public void toggleOrderPayment(String requestId, String orderId_s){
        executor.execute(()->{
            Boolean isPaymentDone = false;
            try{
                int orderId = Integer.parseInt(orderId_s);
                isPaymentDone = Handler.getInstance().toggleOrderPayment(orderId);
            } catch (Exception e) {
                e.printStackTrace();
            }

            JSONObject obj = new JSONObject();
            try {
                obj.put("isPaymentDone", isPaymentDone);
            } catch (JSONException e) {
                e.printStackTrace();
            }

            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) + "," +
                    JSONObject.quote(obj.toString()) +
                    ");";
            webView.post(()->webView.evaluateJavascript(js,null));
        });
    }

    @JavascriptInterface
    public void cancelOrder(String requestId, String orderId_s){
        executor.execute(()->{
            try{
                int orderId = Integer.parseInt(orderId_s);
                Handler.getInstance().cancelOrder(orderId);
            } catch (Exception e) {
                e.printStackTrace();
            }


            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) +
                    ");";
            webView.post(()->webView.evaluateJavascript(js,null));
        });
    }
}
package com.karan.sunset_point.data.handler;

import android.annotation.SuppressLint;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.dantsu.escposprinter.EscPosPrinter;
import com.dantsu.escposprinter.connection.bluetooth.BluetoothConnection;
import com.karan.sunset_point.OnPrinterConnected;
import com.karan.sunset_point.PrinterManager;
import com.karan.sunset_point.data.Responses.OrderItemResponse;
import com.karan.sunset_point.data.Responses.OrderResponse;
import com.karan.sunset_point.data.entity.OrderItem;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

public class PrinterNativeApi {
    private final Executor executor = Executors.newSingleThreadExecutor();
    private final WebView webView;

    public PrinterNativeApi(WebView webView) {
        this.webView = webView;
    }

    @JavascriptInterface
    public void connectPrinter(String requestId){
        executor.execute(() -> {
            try {
                PrinterManager.connect((deviceName, connection, printer) -> {
                    JSONObject obj = new JSONObject();
                    try {
                        obj.put("name",deviceName);
                    } catch (JSONException e) {
                        throw new RuntimeException(e);
                    }
                    String js = "window.__nativeResolve(" +
                            JSONObject.quote(requestId) + "," +
                            JSONObject.quote(obj.toString()) +
                            ");";
                    webView.post(()->webView.evaluateJavascript(js,null));
                });
            } catch (Exception e) {
                String js = "window.__nativeResolve(" +
                        JSONObject.quote(requestId) +
                        ");";
                webView.post(()->webView.evaluateJavascript(js,null));
                throw new RuntimeException(e);
            }
        });
    }

    @SuppressLint("DefaultLocale")
    private String formatKotDantsu(OrderResponse order) {

        StringBuilder sb = new StringBuilder();

        int totalItems = 0;

        // Header
        sb.append("[C]================================\n");
        sb.append("[C]KOT\n");
        sb.append("[C]================================\n");
        sb.append("\n");

        // Order Info
        sb.append("[L]Order : ").append(order.id).append("\n");

        if (order.tag != null && !order.tag.isEmpty()) {
            sb.append("[L]Tag   : ").append(order.tag).append("\n");
        }

        if (order.createdAt != null && order.createdAt.length() >= 16) {
            String time = order.createdAt.substring(11, 16);
            sb.append("[R]").append(time).append("\n");
        }

        sb.append("\n");

        // Items Header
        sb.append("[L]--------------------------------\n");
        sb.append("[L]QTY  ITEM\n");
        sb.append("[L]--------------------------------\n");
        sb.append("\n");

        // Items
        for (OrderItemResponse item : order.items) {

            // Skip cancelled
            if ("CANCELLED".equalsIgnoreCase(item.status)) continue;

            totalItems += item.quantity;

            sb.append("[L]");
            sb.append(String.format("%-4d %s", item.quantity, item.name));
            sb.append("\n");
        }

        sb.append("\n");

        // Footer
        sb.append("[L]--------------------------------\n");
        sb.append("[L]Total Items : ").append(totalItems).append("\n");
        sb.append("\n");
        sb.append("[C]================================\n");
        for (int i = 0;i<4;i++){
            sb.append("\n ");
        }

        return sb.toString();
    }

    @JavascriptInterface
    public void printOrder(String requestId, String orderId_s){
        executor.execute(() -> {
            try {
                int orderId = Integer.parseInt(orderId_s);
                OrderResponse order = Handler.getInstance().getOrderForPrint(orderId);
                String text = formatKotDantsu(order);
                PrinterManager.print(text);
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
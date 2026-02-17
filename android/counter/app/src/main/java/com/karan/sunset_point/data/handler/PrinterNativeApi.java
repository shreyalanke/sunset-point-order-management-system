package com.karan.sunset_point.data.handler;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.dantsu.escposprinter.EscPosPrinter;
import com.dantsu.escposprinter.connection.bluetooth.BluetoothConnection;
import com.karan.sunset_point.MainActivity;
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
    public void getStatus(String requestId) {
        executor.execute(() -> {
            try {
                // Get Bluetooth state
                BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
                boolean bluetoothEnabled = bluetoothAdapter != null && bluetoothAdapter.isEnabled();
                
                // Get printer connection state
                boolean printerConnected = PrinterManager.isConnected();
                String printerName = PrinterManager.getConnectedPrinterName();
                
                // Build response
                JSONObject obj = new JSONObject();
                try {
                    obj.put("bluetoothEnabled", bluetoothEnabled);
                    obj.put("printerConnected", printerConnected);
                    if (printerName != null) {
                        obj.put("printerName", printerName);
                    }
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
                
                String js = "window.__nativeResolve(" +
                        JSONObject.quote(requestId) + "," +
                        JSONObject.quote(obj.toString()) +
                        ");";
                webView.post(() -> webView.evaluateJavascript(js, null));
            } catch (Exception e) {
                String js = "window.__nativeResolve(" +
                        JSONObject.quote(requestId) +
                        ");";
                webView.post(() -> webView.evaluateJavascript(js, null));
                e.printStackTrace();
            }
        });
    }

    @JavascriptInterface
    public void checkConnection(String requestId) {
        executor.execute(() -> {
            try {
                boolean isConnected = PrinterManager.isConnected();
                String printerName = PrinterManager.getConnectedPrinterName();
                
                // If we think we're connected but the connection is actually dead, reset it
                if (!isConnected && printerName != null) {
                    PrinterManager.resetConnection();
                    MainActivity.notifyPrinterState(false, null);
                }
                
                JSONObject obj = new JSONObject();
                try {
                    obj.put("connected", isConnected);
                    if (printerName != null) {
                        obj.put("printerName", printerName);
                    }
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
                
                String js = "window.__nativeResolve(" +
                        JSONObject.quote(requestId) + "," +
                        JSONObject.quote(obj.toString()) +
                        ");";
                webView.post(() -> webView.evaluateJavascript(js, null));
            } catch (Exception e) {
                String js = "window.__nativeResolve(" +
                        JSONObject.quote(requestId) +
                        ");";
                webView.post(() -> webView.evaluateJavascript(js, null));
                e.printStackTrace();
            }
        });
    }
 
    @JavascriptInterface
    public void connectPrinter(String requestId){
        executor.execute(() -> {
            try {
                Log.d("conneting",requestId);
                PrinterManager.connect((deviceName, connection, printer) -> {
                    JSONObject obj = new JSONObject();
                    try {
                        obj.put("name",deviceName);
                        obj.put("connected", true);
                    } catch (JSONException e) {
                        throw new RuntimeException(e);
                    }
                    
                    // Notify frontend of successful connection
                    String eventJs = String.format("window.__onPrinterStateChanged && window.__onPrinterStateChanged(true, \"%s\");", deviceName);
                    webView.post(() -> webView.evaluateJavascript(eventJs, null));
                    
                    String js = "window.__nativeResolve(" +
                            JSONObject.quote(requestId) + "," +
                            JSONObject.quote(obj.toString()) +
                            ");";
                    webView.post(()->webView.evaluateJavascript(js,null));
                });
            } catch (Exception e) {
                // Show error message to user
                webView.post(() -> {
                    android.widget.Toast.makeText(
                        webView.getContext(),
                        e.getMessage() != null ? e.getMessage() : "Failed to connect printer",
                        android.widget.Toast.LENGTH_LONG
                    ).show();
                });
                
                String js = "window.__nativeResolve(" +
                        JSONObject.quote(requestId) +
                        ");";
                webView.post(()->webView.evaluateJavascript(js,null));
                e.printStackTrace();
            }
        });
    }

    @SuppressLint("DefaultLocale")
    private String formatKotDantsu(OrderResponse order) {

        StringBuilder sb = new StringBuilder();

        // ================= CONFIGURATION =================
        // Set to 32 for 58mm paper, 48 for 80mm paper
        final int PRINTER_WIDTH = 32;

        // Define column widths
        // SlNo needs ~5 chars (e.g. "99. ")
        final int COL_SLNO = 5;
        // Qty needs ~4 chars (e.g. " 99 ")
        final int COL_QTY = 4;

        // Item Name takes the remaining space
        final int COL_NAME = PRINTER_WIDTH - COL_SLNO - COL_QTY;

        // Create dynamic format strings
        // %-Nd : Left align SlNo
        // %-Ns : Left align Name
        // %Nd  : Right align Qty
        String headerFormat = "%-" + COL_SLNO + "s%-" + COL_NAME + "s%" + COL_QTY + "s";
        String itemFormat   = "%-" + COL_SLNO + "d%-" + COL_NAME + "s%" + COL_QTY + "d";

        // Dynamic separator line
        String separator = new String(new char[PRINTER_WIDTH]).replace("\0", "-");
        String doubleSeparator = new String(new char[PRINTER_WIDTH]).replace("\0", "=");

        int totalItems = 0;
        int slNo = 1;

// ================= TITLE =================
        sb.append("[C]").append(doubleSeparator).append("\n");
        sb.append("[C]KOT\n");
        sb.append("[C]").append(doubleSeparator).append("\n");

// ================= ORDER ID + DATE =================
        sb.append("[L]Order Number : ").append(order.id).append("\n");

// ================= CUSTOMER / TABLE =================
        if (order.tag != null) {
            sb.append("[L]Customer : ").append(order.tag).append("\n");
        }
        if (order.createdAt != null && order.createdAt.length() >= 16) {
            String date = order.createdAt.substring(0, 10);   // yyyy-MM-dd
            String time = order.createdAt.substring(11, 16);  // HH:mm

            // Right align date/time manually or using format
            sb.append("[R]").append(date).append(" ").append(time);
        }
        sb.append("\n");

// ================= ITEMS HEADER =================
        sb.append("[L]").append(separator).append("\n");
        // "Sl." short for Sl.No to save space on small paper
        sb.append("[L]").append(String.format(headerFormat, "Sl.", "Item Name", "Qty")).append("\n");
        sb.append("[L]").append(separator).append("\n");

// ================= ITEMS =================
        for (OrderItemResponse item : order.items) {

            if ("CANCELLED".equalsIgnoreCase(item.status)) continue;

            totalItems += item.quantity;

            // Truncate name dynamically to fit the calculated column
            String itemName = item.name;
            // ... inside for loop ...
            boolean firstLine = true;

            while (!itemName.isEmpty()) {
                sb.append("[L]");

                String line;
                if (itemName.length() > COL_NAME) {
                    // Take the first chunk
                    line = itemName.substring(0, COL_NAME);
                    itemName = itemName.substring(COL_NAME); // Remaining text
                } else {
                    line = itemName;
                    itemName = ""; // Done
                }

                if (firstLine) {
                    // First line: Print SlNo, Name Chunk, and Qty
                    sb.append(String.format(itemFormat, slNo++, line, item.quantity));
                    firstLine = false;
                } else {
                    // Subsequent lines: Empty SlNo, Name Chunk, Empty Qty
                    // We use string format to keep alignment but pass empty strings for numbers
                    String indentFormat = "%-" + COL_SLNO + "s%-" + COL_NAME + "s%" + COL_QTY + "s";
                    sb.append(String.format(indentFormat, "", line, ""));
                }
                sb.append("\n");
            }
        }

// ================= FOOTER =================
        sb.append("[L]").append(separator).append("\n");
        sb.append("[L]Total Items : ").append(totalItems).append("\n");

// ================= FEED =================
        sb.append(" \n \n \n ");

        return sb.toString();
    }

    @SuppressLint("DefaultLocale")
    private String formatCustomerReceiptDantsu(OrderResponse order) {

        StringBuilder sb = new StringBuilder();

        // ================= CONFIGURATION =================
        // 32 for 58mm paper, 48 for 80mm paper
        final int PRINTER_WIDTH = 32;

        // Define column widths for figures (fixed size)
        // Qty needs ~4 chars (e.g. " 99 ")
        // Price needs ~9 chars (e.g. " 9999.00")
        final int COL_QTY = 4;
        final int COL_PRICE = 9;

        // Name takes whatever space is left
        final int COL_NAME = PRINTER_WIDTH - COL_QTY - COL_PRICE;

        // Create a dynamic format string (e.g., "%-19s%4d%9.2f")
        // %-Ns : Left align string (Name)
        // %Nd  : Right align integer (Qty)
        // %N.2f: Right align decimal (Price)
        String itemFormat = "%-" + COL_NAME + "s%" + COL_QTY + "d%" + COL_PRICE + ".2f";
        String headerFormat = "%-" + COL_NAME + "s%" + COL_QTY + "s%" + COL_PRICE + "s";

        // Create a separator line based on width
        String separator = new String(new char[PRINTER_WIDTH]).replace("\0", "-");

        int totalItems = 0;
        double subtotal = 0.0;

// ================= HEADER / BUSINESS INFO =================
        sb.append("[C]<b>SUNSET POINT</b>\n");
        sb.append("[C]").append(separator).append("\n");
        sb.append("[C]CUSTOMER RECEIPT\n");
        sb.append("[C]").append(separator).append("\n");

// ================= ORDER INFO =================
        if(!order.tag.isEmpty()){
            sb.append("[L]Customer : ").append(order.tag).append("\n");
        }
        sb.append("[L]Order Number : <b>").append(order.id).append("</b>\n");

        if (order.createdAt != null && order.createdAt.length() >= 16) {
            String date = order.createdAt.substring(0, 10);
            String time = order.createdAt.substring(11, 16);
            sb.append("[L]Date : ").append(date).append(" ").append(time).append("\n");
        }
        sb.append("[L]").append(separator).append("\n");

// ================= ITEMS HEADER =================
        // Dynamically format the header titles to align with the data columns
        sb.append("[L]").append(String.format(headerFormat, "Item", "Qty", "Price")).append("\n");
        sb.append("[L]").append(separator).append("\n");

// ================= ITEMS WITH PRICES =================
        for (OrderItemResponse item : order.items) {

            if ("CANCELLED".equalsIgnoreCase(item.status)) continue;

            totalItems += item.quantity;
            double itemTotal = (item.price / 100.0) * item.quantity;
            subtotal += itemTotal;

            // Truncate name dynamically if it exceeds the calculated column width
            String itemName = item.name;
            if (itemName.length() > COL_NAME) {
                itemName = itemName.substring(0, COL_NAME);
            }

            sb.append("[L]");
            sb.append(String.format(itemFormat, itemName, item.quantity, itemTotal));
            sb.append("\n");
        }

        // Show order total
        double orderTotal = order.orderTotal / 100.0;

        sb.append("[L]").append(separator).append("\n");
        sb.append(String.format("[R]<b>TOTAL : %.2f</b>\n", orderTotal));
        sb.append("[L]").append(separator).append("\n");

        sb.append("[C]Thank you for your visit!\n");

// ================= FEED =================
        sb.append(" \n \n \n ");

        return sb.toString();
    }
    @JavascriptInterface
    public void printOrder(String requestId, String orderId_s, String printType){
        executor.execute(() -> {
            try {
                int orderId = Integer.parseInt(orderId_s);
                OrderResponse order = Handler.getInstance().getOrderForPrint(orderId);
                
                String text;
                if ("CUSTOMER_RECEIPT".equalsIgnoreCase(printType)) {
                    text = formatCustomerReceiptDantsu(order);
                } else {
                    // Default to KOT
                    text = formatKotDantsu(order);
                }
                
                PrinterManager.print(text);
            } catch (Exception e) {
                // Show error message to user
                webView.post(() -> {
                    android.widget.Toast.makeText(
                        webView.getContext(),
                        e.getMessage() != null ? e.getMessage() : "Failed to print order",
                        android.widget.Toast.LENGTH_LONG
                    ).show();
                });
                e.printStackTrace();
            }

            String js = "window.__nativeResolve(" +
                    JSONObject.quote(requestId) +
                    ");";
            webView.post(()->webView.evaluateJavascript(js,null));
        });
    }
}
package com.karan.sunset_point.data.handler;

import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

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
}
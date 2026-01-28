package com.karan.sunset_point;
import android.net.Uri;
import android.util.Log;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.karan.sunset_point.data.handler.Handler;

import java.util.Objects;

public class SunsetPointWebViewClient extends WebViewClient {

    @Override
    public WebResourceResponse shouldInterceptRequest(
            WebView view,
            WebResourceRequest request
    ) {
        String url = request.getUrl().toString();

        Uri uri = Uri.parse(url);

        if (Objects.equals(uri.getHost(), "localhost") && uri.getPort() == 3000) {
            Log.d("LOCALHOST_LOG", "Intercepted request: " + uri.getPath());
            return Handler.handleRequest(request, Objects.requireNonNull(uri.getPath()),request.getMethod());
        }

        return super.shouldInterceptRequest(view, request);
    }
}

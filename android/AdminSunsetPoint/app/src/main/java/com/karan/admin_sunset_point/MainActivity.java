package com.karan.admin_sunset_point;

import android.annotation.SuppressLint;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.karan.admin_sunset_point.data.handler.NativeApi;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "RestoreFlow";

    private static final String KEY_WEBVIEW_STATE = "key_webview_state";
    private static final String KEY_PENDING_BACKUP_DATA = "key_pending_backup_data";
    private static final String KEY_PENDING_BACKUP_REQUEST_ID = "key_pending_backup_request_id";
    private static final String KEY_PENDING_RESTORE_REQUEST_ID = "key_pending_restore_request_id";
    private static final String KEY_PENDING_RESTORE_WIPE = "key_pending_restore_wipe";

    private WebView webView;
    private long backPressedTime;
    private Toast backToast;
    private OnBackPressedCallback backPressedCallback;
    private ActivityResultLauncher<Intent> createDocumentLauncher;
    private ActivityResultLauncher<Intent> openDocumentLauncher;
    private static MainActivity instance;
    private NativeApi nativeApi;
    private String[] pendingBackupData;
    private String pendingBackupRequestId;
    private String pendingRestoreRequestId;
    private boolean pendingRestoreWipeExistingData;

    public static MainActivity getInstance() {
        return instance;
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;
        setContentView(R.layout.activity_main);
        webView = findViewById(R.id.mainWebView);
        nativeApi = new NativeApi(webView);

        if (savedInstanceState != null) {
            pendingBackupData = savedInstanceState.getStringArray(KEY_PENDING_BACKUP_DATA);
            pendingBackupRequestId = savedInstanceState.getString(KEY_PENDING_BACKUP_REQUEST_ID);
            pendingRestoreRequestId = savedInstanceState.getString(KEY_PENDING_RESTORE_REQUEST_ID);
            pendingRestoreWipeExistingData = savedInstanceState.getBoolean(KEY_PENDING_RESTORE_WIPE, false);
        }

        // Initialize file picker launcher
        createDocumentLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        Uri uri = result.getData().getData();
                        if (uri != null && pendingBackupData != null) {
                            nativeApi.writeBackupToUri(uri, pendingBackupData, pendingBackupRequestId);
                            pendingBackupData = null;
                            pendingBackupRequestId = null;
                        }
                    } else {
                        // User cancelled
                        if (pendingBackupRequestId != null) {
                            String js = "window.__nativeResolve(" +
                                    "\"" + pendingBackupRequestId + "\"," +
                                    "\"{\\\"success\\\":false,\\\"message\\\":\\\"Backup cancelled\\\"}\")";
                            webView.post(() -> webView.evaluateJavascript(js, null));
                            pendingBackupRequestId = null;
                        }
                        pendingBackupData = null;
                    }
                }
        );

        openDocumentLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    Log.d(TAG, "Restore picker result code=" + result.getResultCode());

                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        Uri uri = extractSelectedUri(result.getData());
                        if (uri != null && pendingRestoreRequestId != null) {
                            Log.d(TAG, "Selected restore URI=" + uri);
                            try {
                                final int takeFlags = result.getData().getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION;
                                if (takeFlags != 0) {
                                    getContentResolver().takePersistableUriPermission(uri, takeFlags);
                                }
                            } catch (SecurityException securityException) {
                                // Some providers do not allow persistable grants; transient grant is still usable.
                                Log.w(TAG, "Persistable URI permission not granted", securityException);
                            }
                            nativeApi.restoreDatabaseFromUri(uri, pendingRestoreRequestId, pendingRestoreWipeExistingData);
                        } else if (pendingRestoreRequestId != null) {
                            Log.e(TAG, "Restore URI missing from picker result");
                            nativeApi.resolveRestoreRequestError(pendingRestoreRequestId, "No file URI returned by picker");
                        }
                    } else if (pendingRestoreRequestId != null) {
                        Log.w(TAG, "Restore cancelled by user");
                        nativeApi.resolveRestoreRequestError(pendingRestoreRequestId, "Restore cancelled");
                    }

                    pendingRestoreRequestId = null;
                    pendingRestoreWipeExistingData = false;
                }
        );

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        webView.addJavascriptInterface(nativeApi, "NativeApi");
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setCancelable(false)
                        .setPositiveButton("OK", (dialog, which) -> result.confirm())
                        .setNegativeButton("Cancel", (dialog, which) -> result.cancel())
                        .setOnCancelListener(dialog -> result.cancel())
                        .show();
                return true;
            }
        });


        // Restore webview session when activity is recreated (e.g., document picker lifecycle).
        Bundle webViewState = savedInstanceState == null ? null : savedInstanceState.getBundle(KEY_WEBVIEW_STATE);
        if (webViewState != null) {
            webView.restoreState(webViewState);
        } else {
            webView.loadUrl("file:///android_asset/react/index.html");
        }

        // Setup back press handler using OnBackPressedDispatcher
        setupBackPressHandler();
    }

    private void setupBackPressHandler() {
        backPressedCallback = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    // Nothing to go back to, show double-press-to-exit toast
                    if (backPressedTime + 2000 > System.currentTimeMillis()) {
                        // Second press within 2 seconds - exit app
                        if (backToast != null) {
                            backToast.cancel();
                        }
                        finishAffinity(); // This kills the app completely
                    } else {
                        // First press - show toast
                        backToast = Toast.makeText(MainActivity.this, "Press back again to exit", Toast.LENGTH_SHORT);
                        backToast.show();
                    }
                    backPressedTime = System.currentTimeMillis();
                }
            }
        };
        getOnBackPressedDispatcher().addCallback(this, backPressedCallback);
    }

    public void launchBackupFilePicker(String[] backupData, String requestId) {
        pendingBackupData = backupData;
        pendingBackupRequestId = requestId;

        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String filename = "sunset_point_backup_" + timestamp + ".zip";

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/zip");
        intent.putExtra(Intent.EXTRA_TITLE, filename);

        createDocumentLauncher.launch(intent);
    }

    public void launchRestoreFilePicker(String requestId, boolean wipeExistingData) {
        pendingRestoreRequestId = requestId;
        pendingRestoreWipeExistingData = wipeExistingData;

        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/zip");

        openDocumentLauncher.launch(intent);
    }

    private Uri extractSelectedUri(Intent data) {
        Uri uri = data.getData();
        if (uri != null) {
            return uri;
        }

        ClipData clipData = data.getClipData();
        if (clipData != null && clipData.getItemCount() > 0) {
            ClipData.Item firstItem = clipData.getItemAt(0);
            if (firstItem != null) {
                return firstItem.getUri();
            }
        }

        return null;
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        Bundle webViewState = new Bundle();
        webView.saveState(webViewState);
        outState.putBundle(KEY_WEBVIEW_STATE, webViewState);
        outState.putStringArray(KEY_PENDING_BACKUP_DATA, pendingBackupData);
        outState.putString(KEY_PENDING_BACKUP_REQUEST_ID, pendingBackupRequestId);
        outState.putString(KEY_PENDING_RESTORE_REQUEST_ID, pendingRestoreRequestId);
        outState.putBoolean(KEY_PENDING_RESTORE_WIPE, pendingRestoreWipeExistingData);
    }

    @Override
    protected void onDestroy() {
        if (instance == this) {
            instance = null;
        }
        super.onDestroy();
    }
}
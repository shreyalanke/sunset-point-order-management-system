package com.karan.sunset_point;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.content.pm.PackageManager;
import android.util.Log;

import androidx.core.app.ActivityCompat;

import com.dantsu.escposprinter.EscPosPrinter;
import com.dantsu.escposprinter.connection.bluetooth.BluetoothConnection;
import com.dantsu.escposprinter.connection.bluetooth.BluetoothPrintersConnections;
import com.dantsu.escposprinter.connection.bluetooth.BluetoothConnection;


public class PrinterManager {

    private static BluetoothConnection connection;
    private static EscPosPrinter printer;

    private static Boolean inititalizing = false;

    public static synchronized void connect(OnPrinterConnected callback) throws Exception {

        if (printer != null && connection != null) {
            if (callback != null) {
                if (ActivityCompat.checkSelfPermission(App.context, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                    // TODO: Consider calling
                    //    ActivityCompat#requestPermissions
                    // here to request the missing permissions, and then overriding
                    //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
                    //                                          int[] grantResults)
                    // to handle the case where the user grants the permission. See the documentation
                    // for ActivityCompat#requestPermissions for more details.
                    return;
                }
                String name = connection.getDevice().getName();
                callback.onConnected(name, connection, printer);
            }
            return;
        }

        inititalizing = true;

        if (ActivityCompat.checkSelfPermission(
                App.context,
                Manifest.permission.BLUETOOTH_SCAN
        ) != PackageManager.PERMISSION_GRANTED) {

            inititalizing = false;
            throw new Exception("Bluetooth permission not granted");
        }

        BluetoothAdapter.getDefaultAdapter().cancelDiscovery();

        connection = BluetoothPrintersConnections.selectFirstPaired();

        if (connection == null) {
            inititalizing = false;
            throw new Exception("No printer found");
        }

        printer = new EscPosPrinter(connection, 203, 48f, 32);

        inititalizing = false;

        if (callback != null) {
            String name = connection.getDevice().getName();
            callback.onConnected(name, connection, printer);
        }
    }

    public static void print(String text) {

        new Thread(() -> {

            try {

                if (inititalizing) return;

                try {

                    connect((name, conn, pr) -> {
                        try {
                            pr.printFormattedText(text);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    });

                } catch (Exception firstFail) {

                    try {
                        if (connection != null) connection.disconnect();
                    } catch (Exception ignored) {}

                    printer = null;
                    connection = null;

                    connect((name, conn, pr) -> {
                        try {
                            pr.printFormattedText(text);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    });
                }

            } catch (Exception e) {
                e.printStackTrace();
            }

        }).start();
    }
}

package com.karan.sunset_point;

import com.dantsu.escposprinter.EscPosPrinter;
import com.dantsu.escposprinter.connection.bluetooth.BluetoothConnection;

public interface OnPrinterConnected {
    void onConnected(String deviceName, BluetoothConnection connection, EscPosPrinter printer);
}

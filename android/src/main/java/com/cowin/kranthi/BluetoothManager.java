package com.cowin.kranthi;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.os.Handler;
import android.os.Message;
import android.util.Log;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.UUID;

public class BluetoothManager {
    private BluetoothAdapter mBluetoothAdapter;
    private BluetoothSocket mBluetoothSocket;
    private OutputStream mOutputStream;
    private InputStream mInputStream;
    private ReadThread mReadThread;

    private static final UUID MY_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    // Callback interface for communication with the main activity
    public interface OnDataReceivedListener {
        void onDataReceived(String data);
    }

    private OnDataReceivedListener onDataReceivedListener;

    public void setOnDataReceivedListener(OnDataReceivedListener listener) {
        onDataReceivedListener = listener;
    }

    public BluetoothManager(Context context) {
        mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        if (mBluetoothAdapter == null) {
            Log.e("BluetoothManager", "Bluetooth is not supported on this device.");
            return;
        }
    }

    @SuppressLint("MissingPermission")
    public boolean connectToDevice(String deviceAddress) {
        if (!mBluetoothAdapter.isEnabled()) {
            return false; // Bluetooth is not enabled
        }

        BluetoothDevice device = mBluetoothAdapter.getRemoteDevice(deviceAddress);
        try {
            mBluetoothSocket = device.createRfcommSocketToServiceRecord(MY_UUID);
            mBluetoothSocket.connect();
            mOutputStream = mBluetoothSocket.getOutputStream();
            mInputStream = mBluetoothSocket.getInputStream();
            mReadThread = new ReadThread();
            mReadThread.start();
            return true;
        } catch (IOException e) {
            Log.e("BluetoothManager", "Error connecting to device: " + e.getMessage());
            return false;
        }
    }

    public Boolean sendCommand(String command) {
        Boolean status = false;
        if (mOutputStream != null) {
            try {
                mOutputStream.write(command.getBytes());
                status = true;
            } catch (IOException e) {
                status = false;
                Log.e("BluetoothManager", "Error sending command: " + e.getMessage());
            }
        } else {
            Log.e("BluetoothManager", "OutputStream is null, cannot send command.");
        }
        return status;
    }


    private class ReadThread extends Thread {
        @Override
        public void run() {
            byte[] buffer = new byte[1024];
            int bytes;

            while (true) {
                try {
                    bytes = mInputStream.read(buffer);
                    String receivedData = new String(buffer, 0, bytes);
                    // Send the received data to the main activity using the callback
                    if (onDataReceivedListener != null) {
                        onDataReceivedListener.onDataReceived(receivedData);
                    }
                } catch (IOException e) {
                    Log.e("BluetoothManager", "Error reading data: " + e.getMessage());
                    break;
                }
            }
        }
    }

    public void disconnect() {
        if (mBluetoothSocket != null) {
            try {
                mBluetoothSocket.close();
            } catch (IOException e) {
                Log.e("BluetoothManager", "Error closing socket: " + e.getMessage());
            }
        }
    }
}


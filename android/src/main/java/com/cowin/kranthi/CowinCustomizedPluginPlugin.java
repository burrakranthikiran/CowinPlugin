package com.cowin.kranthi;

import static android.Manifest.permission.BLUETOOTH_CONNECT;
import static android.Manifest.permission.BLUETOOTH_SCAN;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "CowinCustomizedPlugin")
public class CowinCustomizedPluginPlugin extends Plugin {
    private static final int REQUEST_ID_MULTIPLE_PERMISSIONS = 1001;
    private CowinCustomizedPlugin implementation = new CowinCustomizedPlugin();
    private BluetoothManager bluetoothManager;

    @Override
    public void load() {
        bluetoothManager = new BluetoothManager(getContext());

        // Set global listener once on plugin load
        bluetoothManager.setOnDataReceivedListener(new BluetoothManager.OnDataReceivedListener() {
            @Override
            public void onDataReceived(final String data) {
                getActivity().runOnUiThread(() -> notifyDataReceived(data));
            }
        });
    }

    @PluginMethod
    public void echo(PluginCall call) {
        String value = call.getString("value");
        JSObject ret = new JSObject();
        ret.put("value", implementation.echo(value));
        call.resolve(ret);
    }

    @PluginMethod
    public void getPermission(PluginCall call) {
        List<String> permissionsToCheck = new ArrayList<>();
        permissionsToCheck.add(Manifest.permission.ACCESS_FINE_LOCATION);
        permissionsToCheck.add(Manifest.permission.CAMERA);
        permissionsToCheck.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
        permissionsToCheck.add(Manifest.permission.READ_PHONE_STATE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissionsToCheck.add(Manifest.permission.BLUETOOTH_CONNECT);
            permissionsToCheck.add(Manifest.permission.BLUETOOTH_SCAN);
        } else {
            permissionsToCheck.add(Manifest.permission.BLUETOOTH);
        }

        List<String> permissionsToRequest = new ArrayList<>();
        JSObject ret = new JSObject();
        for (String permission : permissionsToCheck) {
            if (ContextCompat.checkSelfPermission(getContext(), permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission);
            }
        }

        if (!permissionsToRequest.isEmpty()) {
            ActivityCompat.requestPermissions(
                    getActivity(),
                    permissionsToRequest.toArray(new String[0]),
                    REQUEST_ID_MULTIPLE_PERMISSIONS
            );
            ret.put("granted", false);
            ret.put("requested", new JSONArray(permissionsToRequest));
        } else {
            ret.put("granted", true);
            ret.put("requested", new JSONArray());
        }

        call.resolve(ret);
    }

    @PluginMethod
    public void connectToDevice(PluginCall call) {
        String macId = call.getString("value");
        Log.e("Data_Received", macId);
        JSObject ret = new JSObject();

        if (macId != null) {
            ret.put("value", bluetoothManager.connectToDevice(macId));
            call.resolve(ret);
        } else {
            call.reject("MAC ID is null");
        }
    }

    @PluginMethod
    public void listDevices(PluginCall call) {
        try {
            List<Map<String, String>> devices = bluetoothManager.listDevices();
            JSONArray devicesArray = new JSONArray();

            for (Map<String, String> device : devices) {
                JSONObject deviceObj = new JSONObject();
                deviceObj.put("deviceId",   device.get("deviceId"));
                deviceObj.put("deviceName", device.get("deviceName"));
                deviceObj.put("deviceType", device.get("deviceType"));
                deviceObj.put("bondState",  device.get("bondState"));
                devicesArray.put(deviceObj);
            }

            JSObject ret = new JSObject();
            ret.put("devices", devicesArray);
            Log.d("BluetoothPlugin", "listDevices: found " + devices.size() + " device(s)");
            call.resolve(ret);
        } catch (Exception e) {
            Log.e("BluetoothPlugin", "Error in listDevices: " + e.getMessage(), e);
            call.reject("Failed to list devices: " + e.getMessage());
        }
    }

    @PluginMethod
    public void sendCommand(PluginCall call) {
        try {
            String command = call.getString("value") + "\\r\\n";
            JSObject ret = new JSObject();
            ret.put("value", bluetoothManager.sendCommand(command));
            call.resolve(ret);
        } catch (Exception e) {
            Log.e("BluetoothPlugin", "Error in sendCommand: " + e.getMessage(), e);
            call.reject("Failed to send command: " + e.getMessage());
        }
    }

    // Notify JS listeners about Bluetooth data
    public void notifyDataReceived(String data) {
        Log.e("Data_Received", data);
        JSObject eventData = new JSObject();
        eventData.put("data", data);
        notifyListeners("dataReceived", eventData);
    }
}

package com.cowin.kranthi;

import static android.Manifest.permission.BLUETOOTH_CONNECT;
import static android.Manifest.permission.BLUETOOTH_SCAN;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "CowinCustomizedPlugin")
public class CowinCustomizedPluginPlugin extends Plugin {
    private static final int REQUEST_ID_MULTIPLE_PERMISSIONS = 1001;
    private static final int REQUEST_BLUETOOTH_PERMISSION = 1002;
    private CowinCustomizedPlugin implementation = new CowinCustomizedPlugin();

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
            // Request missing permissions
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


}

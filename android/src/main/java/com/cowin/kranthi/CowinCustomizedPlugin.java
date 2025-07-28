package com.cowin.kranthi;

import android.util.Log;

public class CowinCustomizedPlugin {

    public String echo(String value) {
        Log.i("Echo", value);
        return value;
    }
}

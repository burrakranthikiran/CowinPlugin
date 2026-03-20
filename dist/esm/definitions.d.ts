import type { PluginListenerHandle } from '@capacitor/core';
/** Represents a single Bluetooth device returned by listDevices() */
export interface BluetoothDeviceInfo {
    /** Unique device identifier (MAC address on Android, browser-assigned opaque ID on Web) */
    deviceId: string;
    /** Human-readable device name, or null if unavailable */
    deviceName: string | null;
    /**
     * Device type (Android only).
     * 0 = Unknown, 1 = Classic, 2 = BLE, 3 = Dual
     * On web this will always be "ble" | "unknown".
     */
    deviceType: string;
    /**
     * Bonding state (Android only: "bonded" | "bonding" | "none").
     * On web this will always be "unknown".
     */
    bondState: string;
}
export interface CowinCustomizedPluginPlugin {
    echo(options: {
        value: string;
    }): Promise<{
        value: string;
    }>;
    getPermission(): Promise<{
        value: string;
    }>;
    /**
     * List available Bluetooth devices.
     * - Android: returns all paired/bonded classic + BLE devices from the system.
     * - Web: returns devices previously granted permission via the browser picker
     *        (requires `navigator.bluetooth.getDevices()` — Chrome 85+ / Edge 85+).
     *        Falls back to opening the browser picker if no permitted devices exist.
     */
    listDevices(): Promise<{
        devices: BluetoothDeviceInfo[];
    }>;
    connectToDevice(options: {
        value: string;
    }): Promise<{
        value: boolean;
    }>;
    sendCommand(options: {
        value: string;
    }): Promise<{
        value: boolean;
    }>;
    addListener(eventName: string, listenerFunc: (data: any) => void): Promise<PluginListenerHandle>;
    removeAllListeners(eventName: string): Promise<void>;
}
export interface CowinCustomizedPluginEvents {
    'bluetoothConnected': {
        deviceId: string;
        deviceName: string;
    };
    'bluetoothDisconnected': {
        deviceId: string;
    };
    'dataReceived': {
        data: string;
    };
    'error': {
        message: string;
    };
}

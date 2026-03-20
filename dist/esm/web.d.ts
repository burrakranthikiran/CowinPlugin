import { WebPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import type { CowinCustomizedPluginPlugin, BluetoothDeviceInfo } from './definitions';
declare global {
    interface Navigator {
        bluetooth: Bluetooth;
    }
    interface Bluetooth {
        requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
        getAvailability(): Promise<boolean>;
        /** Returns devices the user has previously granted permission to */
        getDevices(): Promise<BluetoothDevice[]>;
    }
    interface RequestDeviceOptions {
        acceptAllDevices?: boolean;
        filters?: BluetoothRequestDeviceFilter[];
        optionalServices?: string[];
    }
    interface BluetoothRequestDeviceFilter {
        services?: string[];
        name?: string;
        namePrefix?: string;
    }
    interface BluetoothDevice {
        id: string;
        name?: string;
        gatt?: BluetoothRemoteGATTServer;
        addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
        removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
    }
    interface BluetoothRemoteGATTServer {
        connected: boolean;
        connect(): Promise<BluetoothRemoteGATTServer>;
        disconnect(): void;
        getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
    }
    interface BluetoothRemoteGATTService {
        getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
    }
    interface BluetoothRemoteGATTCharacteristic {
        value?: DataView;
        startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
        stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
        writeValue(value: ArrayBuffer): Promise<void>;
        writeValueWithoutResponse(value: ArrayBuffer): Promise<void>;
        addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
        removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
    }
}
export declare class CowinCustomizedPluginWeb extends WebPlugin implements CowinCustomizedPluginPlugin {
    private device;
    private server;
    private txCharacteristic;
    private rxCharacteristic;
    /** Bound handler so we can remove it later */
    private _onCharacteristicValueChanged;
    private _onDisconnected;
    echo(options: {
        value: string;
    }): Promise<{
        value: string;
    }>;
    /**
     * On the web there is no explicit Bluetooth permission request API.
     * Permission is granted implicitly when the user picks a device via
     * navigator.bluetooth.requestDevice(). We check availability instead.
     */
    getPermission(): Promise<{
        value: string;
    }>;
    /**
     * On Android the MAC address is passed so the app can target a specific device.
     * On the Web, the browser's security model does NOT allow connecting by MAC address.
     * Instead, we open the browser's native device picker (= user gesture required).
     *
     * The `options.value` string is ignored for the web, but kept for API compatibility.
     */
    connectToDevice(options: {
        value: string;
    }): Promise<{
        value: boolean;
    }>;
    /**
     * Mirrors Android's BluetoothManager.sendCommand().
     * Appends \r\n exactly like the Android side does.
     * Writes to the TX characteristic (NUS TX = write from host to device).
     */
    sendCommand(options: {
        value: string;
    }): Promise<{
        value: boolean;
    }>;
    /**
     * Returns ONLY already-saved/permitted BLE devices using navigator.bluetooth.getDevices().
     * - No browser picker is shown.
     * - Returns an empty array if no devices have been permitted yet.
     * - A device appears here after the user previously connected via connectToDevice().
     *
     * Requires Chrome 85+ / Edge 85+. On unsupported browsers returns [].
     */
    listDevices(): Promise<{
        devices: BluetoothDeviceInfo[];
    }>;
    /**
     * Supports the same events as Android:
     *  - 'dataReceived'         → { data: string }
     *  - 'bluetoothConnected'   → { deviceId: string; deviceName: string }
     *  - 'bluetoothDisconnected'→ { deviceId: string }
     *  - 'error'                → { message: string }
     */
    addListener(eventName: string, listenerFunc: (data: any) => void): Promise<PluginListenerHandle>;
    removeAllListeners(): Promise<void>;
    private _disconnect;
    private _cleanup;
}

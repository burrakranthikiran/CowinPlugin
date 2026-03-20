import { WebPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import type { CowinCustomizedPluginPlugin, BluetoothDeviceInfo } from './definitions';

// Web Bluetooth API type declarations (not in all TS lib versions)
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

/**
 * Web Bluetooth UUIDs for Nordic UART Service (NUS) — the most common
 * BLE serial emulation used on embedded/BLE devices.
 * Android uses classic BT RFCOMM (UUID 00001101-...), but on the web
 * we use the BLE UART service as the closest equivalent.
 *
 * Change these UUIDs to match your actual BLE device's service/characteristic.
 */
const NUS_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_TX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Write (TX from host → device)
const NUS_RX_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // Notify (RX from device → host)

export class CowinCustomizedPluginWeb extends WebPlugin implements CowinCustomizedPluginPlugin {
  // ── Internal BLE state ──────────────────────────────────────────────────
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  /** Bound handler so we can remove it later */
  private _onCharacteristicValueChanged = (event: Event) => {
    const target = (event.target as unknown) as BluetoothRemoteGATTCharacteristic;
    if (target.value) {
      const decoder = new TextDecoder('utf-8');
      const data = decoder.decode(target.value);
      console.log('[CowinWeb] dataReceived:', data);
      this.notifyListeners('dataReceived', { data });
    }
  };

  private _onDisconnected = () => {
    console.log('[CowinWeb] Device disconnected');
    this.notifyListeners('bluetoothDisconnected', {
      deviceId: this.device?.id ?? 'unknown',
    });
    this._cleanup();
  };

  // ── echo ────────────────────────────────────────────────────────────────
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('[CowinWeb] echo', options);
    return options;
  }

  // ── getPermission ───────────────────────────────────────────────────────
  /**
   * On the web there is no explicit Bluetooth permission request API.
   * Permission is granted implicitly when the user picks a device via
   * navigator.bluetooth.requestDevice(). We check availability instead.
   */
  async getPermission(): Promise<{ value: string }> {
    if (!navigator.bluetooth) {
      return {
        value: JSON.stringify({
          granted: false,
          reason: 'Web Bluetooth API is not supported in this browser. Use Chrome/Edge on desktop or Android.',
        }),
      };
    }

    try {
      const available = await navigator.bluetooth.getAvailability();
      return {
        value: JSON.stringify({
          granted: available,
          reason: available
            ? 'Bluetooth is available. Permission will be requested when connecting to a device.'
            : 'Bluetooth is not available or not enabled on this device.',
        }),
      };
    } catch (err: any) {
      return {
        value: JSON.stringify({
          granted: false,
          reason: err.message ?? 'Unknown error checking Bluetooth availability.',
        }),
      };
    }
  }

  // ── connectToDevice ─────────────────────────────────────────────────────
  /**
   * On Android the MAC address is passed so the app can target a specific device.
   * On the Web, the browser's security model does NOT allow connecting by MAC address.
   * Instead, we open the browser's native device picker (= user gesture required).
   *
   * The `options.value` string is ignored for the web, but kept for API compatibility.
   */
  async connectToDevice(options: { value: string }): Promise<{ value: boolean }> {
    console.log('[CowinWeb] connectToDevice called (MAC ignored on web):', options.value);

    if (!navigator.bluetooth) {
      console.error('[CowinWeb] Web Bluetooth not supported');
      this.notifyListeners('error', { message: 'Web Bluetooth API not supported in this browser.' });
      return { value: false };
    }

    try {
      // Disconnect any existing connection first
      await this._disconnect();

      // Show the browser's native BLE device picker
      this.device = await navigator.bluetooth.requestDevice({
        // Accept any BLE device that advertises the Nordic UART service.
        // Change this filter to match your actual device.
        filters: [{ services: [NUS_SERVICE_UUID] }],
        // If your device doesn't advertise the service, use:
        // acceptAllDevices: true,
        // optionalServices: [NUS_SERVICE_UUID],
        optionalServices: [NUS_SERVICE_UUID],
      });

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', this._onDisconnected);

      // Connect to GATT server
      this.server = await this.device.gatt!.connect();

      // Discover NUS service and characteristics
      const service = await this.server.getPrimaryService(NUS_SERVICE_UUID);
      this.txCharacteristic = await service.getCharacteristic(NUS_TX_CHAR_UUID);
      this.rxCharacteristic = await service.getCharacteristic(NUS_RX_CHAR_UUID);

      // Subscribe to incoming notifications (equivalent to Android's ReadThread)
      await this.rxCharacteristic.startNotifications();
      this.rxCharacteristic.addEventListener(
        'characteristicvaluechanged',
        this._onCharacteristicValueChanged,
      );

      // Notify listeners — mirrors Android's bluetoothConnected event
      this.notifyListeners('bluetoothConnected', {
        deviceId: this.device.id,
        deviceName: this.device.name ?? 'Unknown Device',
      });

      console.log('[CowinWeb] Connected to', this.device.name, '(', this.device.id, ')');
      return { value: true };
    } catch (err: any) {
      console.error('[CowinWeb] connectToDevice error:', err.message);
      this.notifyListeners('error', { message: err.message ?? 'Failed to connect to Bluetooth device.' });
      this._cleanup();
      return { value: false };
    }
  }

  // ── sendCommand ─────────────────────────────────────────────────────────
  /**
   * Mirrors Android's BluetoothManager.sendCommand().
   * Appends \r\n exactly like the Android side does.
   * Writes to the TX characteristic (NUS TX = write from host to device).
   */
  async sendCommand(options: { value: string }): Promise<{ value: boolean }> {
    console.log('[CowinWeb] sendCommand:', options.value);

    if (!this.txCharacteristic) {
      console.error('[CowinWeb] Not connected — cannot send command');
      this.notifyListeners('error', { message: 'Not connected to any Bluetooth device.' });
      return { value: false };
    }

    try {
      // Append \r\n exactly as Android does: command + "\\r\\n"
      const command = options.value + '\r\n';
      const encoder = new TextEncoder();
      const encoded = encoder.encode(command);

      // Use writeValueWithoutResponse for SPP-like behaviour (fire & forget)
      // Pass .buffer (ArrayBuffer) — writeValueWithoutResponse requires ArrayBuffer not Uint8Array
      await this.txCharacteristic.writeValueWithoutResponse(encoded.buffer as ArrayBuffer);
      console.log('[CowinWeb] Command sent:', command);
      return { value: true };
    } catch (err: any) {
      console.error('[CowinWeb] sendCommand error:', err.message);
      this.notifyListeners('error', { message: 'Failed to send command: ' + err.message });
      return { value: false };
    }
  }

  // ── listDevices ─────────────────────────────────────────────────────────
  /**
   * Returns ONLY already-saved/permitted BLE devices using navigator.bluetooth.getDevices().
   * - No browser picker is shown.
   * - Returns an empty array if no devices have been permitted yet.
   * - A device appears here after the user previously connected via connectToDevice().
   *
   * Requires Chrome 85+ / Edge 85+. On unsupported browsers returns [].
   */
  async listDevices(): Promise<{ devices: BluetoothDeviceInfo[] }> {
    if (!navigator.bluetooth) {
      console.error('[CowinWeb] Web Bluetooth not supported');
      return { devices: [] };
    }

    try {
      // getDevices() silently returns previously-permitted devices — no user gesture needed
      if (typeof navigator.bluetooth.getDevices !== 'function') {
        console.warn('[CowinWeb] navigator.bluetooth.getDevices() not supported in this browser');
        return { devices: [] };
      }

      const rawDevices: BluetoothDevice[] = await navigator.bluetooth.getDevices();
      console.log('[CowinWeb] listDevices: found', rawDevices.length, 'saved device(s)');

      // Map Web BluetoothDevice → BluetoothDeviceInfo
      const devices: BluetoothDeviceInfo[] = rawDevices.map((d) => ({
        deviceId: d.id,
        deviceName: d.name ?? null,
        deviceType: 'ble',     // Web Bluetooth is always BLE
        bondState: 'unknown',  // Bond state is not exposed by the Web Bluetooth API
      }));

      return { devices };
    } catch (err: any) {
      console.error('[CowinWeb] listDevices error:', err.message);
      this.notifyListeners('error', { message: 'listDevices failed: ' + err.message });
      return { devices: [] };
    }
  }

  // ── addListener override ────────────────────────────────────────────────
  /**
   * Supports the same events as Android:
   *  - 'dataReceived'         → { data: string }
   *  - 'bluetoothConnected'   → { deviceId: string; deviceName: string }
   *  - 'bluetoothDisconnected'→ { deviceId: string }
   *  - 'error'                → { message: string }
   */
  async addListener(
    eventName: string,
    listenerFunc: (data: any) => void,
  ): Promise<PluginListenerHandle> {
    return super.addListener(eventName, listenerFunc);
  }

  async removeAllListeners(): Promise<void> {
    return super.removeAllListeners();
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private async _disconnect(): Promise<void> {
    if (this.rxCharacteristic) {
      try {
        this.rxCharacteristic.removeEventListener(
          'characteristicvaluechanged',
          this._onCharacteristicValueChanged,
        );
        await this.rxCharacteristic.stopNotifications();
      } catch (_) {}
    }

    if (this.server?.connected) {
      try {
        this.server.disconnect();
      } catch (_) {}
    }

    if (this.device) {
      this.device.removeEventListener('gattserverdisconnected', this._onDisconnected);
    }

    this._cleanup();
  }

  private _cleanup(): void {
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    this.server = null;
    this.device = null;
  }
}

var capacitorCowinCustomizedPlugin = (function (exports, core) {
    'use strict';

    const CowinCustomizedPlugin = core.registerPlugin('CowinCustomizedPlugin', {
        web: () => Promise.resolve().then(function () { return web; }).then((m) => new m.CowinCustomizedPluginWeb()),
    });

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
    class CowinCustomizedPluginWeb extends core.WebPlugin {
        constructor() {
            super(...arguments);
            // ── Internal BLE state ──────────────────────────────────────────────────
            this.device = null;
            this.server = null;
            this.txCharacteristic = null;
            this.rxCharacteristic = null;
            /** Bound handler so we can remove it later */
            this._onCharacteristicValueChanged = (event) => {
                const target = event.target;
                if (target.value) {
                    const decoder = new TextDecoder('utf-8');
                    const data = decoder.decode(target.value);
                    console.log('[CowinWeb] dataReceived:', data);
                    this.notifyListeners('dataReceived', { data });
                }
            };
            this._onDisconnected = () => {
                var _a, _b;
                console.log('[CowinWeb] Device disconnected');
                this.notifyListeners('bluetoothDisconnected', {
                    deviceId: (_b = (_a = this.device) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : 'unknown',
                });
                this._cleanup();
            };
        }
        // ── echo ────────────────────────────────────────────────────────────────
        async echo(options) {
            console.log('[CowinWeb] echo', options);
            return options;
        }
        // ── getPermission ───────────────────────────────────────────────────────
        /**
         * On the web there is no explicit Bluetooth permission request API.
         * Permission is granted implicitly when the user picks a device via
         * navigator.bluetooth.requestDevice(). We check availability instead.
         */
        async getPermission() {
            var _a;
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
            }
            catch (err) {
                return {
                    value: JSON.stringify({
                        granted: false,
                        reason: (_a = err.message) !== null && _a !== void 0 ? _a : 'Unknown error checking Bluetooth availability.',
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
        async connectToDevice(options) {
            var _a, _b;
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
                this.server = await this.device.gatt.connect();
                // Discover NUS service and characteristics
                const service = await this.server.getPrimaryService(NUS_SERVICE_UUID);
                this.txCharacteristic = await service.getCharacteristic(NUS_TX_CHAR_UUID);
                this.rxCharacteristic = await service.getCharacteristic(NUS_RX_CHAR_UUID);
                // Subscribe to incoming notifications (equivalent to Android's ReadThread)
                await this.rxCharacteristic.startNotifications();
                this.rxCharacteristic.addEventListener('characteristicvaluechanged', this._onCharacteristicValueChanged);
                // Notify listeners — mirrors Android's bluetoothConnected event
                this.notifyListeners('bluetoothConnected', {
                    deviceId: this.device.id,
                    deviceName: (_a = this.device.name) !== null && _a !== void 0 ? _a : 'Unknown Device',
                });
                console.log('[CowinWeb] Connected to', this.device.name, '(', this.device.id, ')');
                return { value: true };
            }
            catch (err) {
                console.error('[CowinWeb] connectToDevice error:', err.message);
                this.notifyListeners('error', { message: (_b = err.message) !== null && _b !== void 0 ? _b : 'Failed to connect to Bluetooth device.' });
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
        async sendCommand(options) {
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
                await this.txCharacteristic.writeValueWithoutResponse(encoded.buffer);
                console.log('[CowinWeb] Command sent:', command);
                return { value: true };
            }
            catch (err) {
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
        async listDevices() {
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
                const rawDevices = await navigator.bluetooth.getDevices();
                console.log('[CowinWeb] listDevices: found', rawDevices.length, 'saved device(s)');
                // Map Web BluetoothDevice → BluetoothDeviceInfo
                const devices = rawDevices.map((d) => {
                    var _a;
                    return ({
                        deviceId: d.id,
                        deviceName: (_a = d.name) !== null && _a !== void 0 ? _a : null,
                        deviceType: 'ble',
                        bondState: 'unknown',
                    });
                });
                return { devices };
            }
            catch (err) {
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
        async addListener(eventName, listenerFunc) {
            return super.addListener(eventName, listenerFunc);
        }
        async removeAllListeners() {
            return super.removeAllListeners();
        }
        // ── Private helpers ─────────────────────────────────────────────────────
        async _disconnect() {
            var _a;
            if (this.rxCharacteristic) {
                try {
                    this.rxCharacteristic.removeEventListener('characteristicvaluechanged', this._onCharacteristicValueChanged);
                    await this.rxCharacteristic.stopNotifications();
                }
                catch (_) { }
            }
            if ((_a = this.server) === null || _a === void 0 ? void 0 : _a.connected) {
                try {
                    this.server.disconnect();
                }
                catch (_) { }
            }
            if (this.device) {
                this.device.removeEventListener('gattserverdisconnected', this._onDisconnected);
            }
            this._cleanup();
        }
        _cleanup() {
            this.txCharacteristic = null;
            this.rxCharacteristic = null;
            this.server = null;
            this.device = null;
        }
    }

    var web = /*#__PURE__*/Object.freeze({
        __proto__: null,
        CowinCustomizedPluginWeb: CowinCustomizedPluginWeb
    });

    exports.CowinCustomizedPlugin = CowinCustomizedPlugin;

    return exports;

})({}, capacitorExports);
//# sourceMappingURL=plugin.js.map

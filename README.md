# cowin-plugin

NA

## Install

```bash
npm install cowin-plugin
npx cap sync
```

## API

<docgen-index>

* [`echo(...)`](#echo)
* [`getPermission()`](#getpermission)
* [`listDevices()`](#listdevices)
* [`connectToDevice(...)`](#connecttodevice)
* [`sendCommand(...)`](#sendcommand)
* [`addListener(string, ...)`](#addlistenerstring-)
* [`removeAllListeners(...)`](#removealllisteners)
* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### echo(...)

```typescript
echo(options: { value: string; }) => Promise<{ value: string; }>
```

| Param         | Type                            |
| ------------- | ------------------------------- |
| **`options`** | <code>{ value: string; }</code> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### getPermission()

```typescript
getPermission() => Promise<{ value: string; }>
```

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### listDevices()

```typescript
listDevices() => Promise<{ devices: BluetoothDeviceInfo[]; }>
```

List available Bluetooth devices.
- Android: returns all paired/bonded classic + BLE devices from the system.
- Web: returns devices previously granted permission via the browser picker
       (requires `navigator.bluetooth.getDevices()` — Chrome 85+ / Edge 85+).
       Falls back to opening the browser picker if no permitted devices exist.

**Returns:** <code>Promise&lt;{ devices: BluetoothDeviceInfo[]; }&gt;</code>

--------------------


### connectToDevice(...)

```typescript
connectToDevice(options: { value: string; }) => Promise<{ value: boolean; }>
```

| Param         | Type                            |
| ------------- | ------------------------------- |
| **`options`** | <code>{ value: string; }</code> |

**Returns:** <code>Promise&lt;{ value: boolean; }&gt;</code>

--------------------


### sendCommand(...)

```typescript
sendCommand(options: { value: string; }) => Promise<{ value: boolean; }>
```

| Param         | Type                            |
| ------------- | ------------------------------- |
| **`options`** | <code>{ value: string; }</code> |

**Returns:** <code>Promise&lt;{ value: boolean; }&gt;</code>

--------------------


### addListener(string, ...)

```typescript
addListener(eventName: string, listenerFunc: (data: any) => void) => Promise<PluginListenerHandle>
```

| Param              | Type                                |
| ------------------ | ----------------------------------- |
| **`eventName`**    | <code>string</code>                 |
| **`listenerFunc`** | <code>(data: any) =&gt; void</code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

--------------------


### removeAllListeners(...)

```typescript
removeAllListeners(eventName: string) => Promise<void>
```

| Param           | Type                |
| --------------- | ------------------- |
| **`eventName`** | <code>string</code> |

--------------------


### Interfaces


#### BluetoothDeviceInfo

Represents a single Bluetooth device returned by listDevices()

| Prop             | Type                        | Description                                                                                                            |
| ---------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **`deviceId`**   | <code>string</code>         | Unique device identifier (MAC address on Android, browser-assigned opaque ID on Web)                                   |
| **`deviceName`** | <code>string \| null</code> | Human-readable device name, or null if unavailable                                                                     |
| **`deviceType`** | <code>string</code>         | Device type (Android only). 0 = Unknown, 1 = Classic, 2 = BLE, 3 = Dual On web this will always be "ble" \| "unknown". |
| **`bondState`**  | <code>string</code>         | Bonding state (Android only: "bonded" \| "bonding" \| "none"). On web this will always be "unknown".                   |


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |

</docgen-api>

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


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |

</docgen-api>

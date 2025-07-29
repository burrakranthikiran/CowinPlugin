import type { PluginListenerHandle } from '@capacitor/core';

export interface CowinCustomizedPluginPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
  getPermission(): Promise<{ value: string }>;
  connectToDevice(options: { value: string }): Promise<{ value: boolean }>;
  sendCommand(options: { value: string }): Promise<{ value: boolean }>;
  
  // Add event listener methods with correct return types
  addListener(eventName: string, listenerFunc: (data: any) => void): Promise<PluginListenerHandle>;
  removeAllListeners(eventName: string): Promise<void>;
}

// Define event types
export interface CowinCustomizedPluginEvents {
  'bluetoothConnected': { deviceId: string; deviceName: string };
  'bluetoothDisconnected': { deviceId: string };
  'dataReceived': { data: string };
  'error': { message: string };
}

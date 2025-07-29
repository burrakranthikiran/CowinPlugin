import { WebPlugin } from '@capacitor/core';

import type { CowinCustomizedPluginPlugin } from './definitions';

export class CowinCustomizedPluginWeb extends WebPlugin implements CowinCustomizedPluginPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }

  async getPermission(): Promise<{ value: string }> {
    return { value: "This not developed for web" };
  }

  async connectToDevice(options: { value: string }): Promise<{ value: boolean }> {
    console.log('ECHO', options);
    return { value: false };
  }
  async sendCommand(options: { value: string }): Promise<{ value: boolean }> {
    console.log('ECHO', options);
    return { value: false };
  }
}

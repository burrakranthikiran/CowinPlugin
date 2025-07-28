import { registerPlugin } from '@capacitor/core';

import type { CowinCustomizedPluginPlugin } from './definitions';

const CowinCustomizedPlugin = registerPlugin<CowinCustomizedPluginPlugin>('CowinCustomizedPlugin', {
  web: () => import('./web').then((m) => new m.CowinCustomizedPluginWeb()),
});

export * from './definitions';
export { CowinCustomizedPlugin };

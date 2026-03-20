import { registerPlugin } from '@capacitor/core';
const CowinCustomizedPlugin = registerPlugin('CowinCustomizedPlugin', {
    web: () => import('./web').then((m) => new m.CowinCustomizedPluginWeb()),
});
export * from './definitions';
export { CowinCustomizedPlugin };
//# sourceMappingURL=index.js.map
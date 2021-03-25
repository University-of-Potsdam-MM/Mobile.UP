import type { PluginListenerHandle } from '@capacitor/core';
export interface DarkModeAndroidPlugin {
    isDarkModeOn(): Promise<any>;
    addListener(eventName: 'darkModeStateChanged', listenerFunc: (state: any) => void): PluginListenerHandle;
    registerDarkModeChangeListener(): void;
}

import { registerPlugin } from '@capacitor/core';
import type { DarkModeAndroidPlugin } from './definitions';

const DarkModeAndroid =
  registerPlugin<DarkModeAndroidPlugin>('DarkModeAndroid');

export * from './definitions';
export { DarkModeAndroid };
